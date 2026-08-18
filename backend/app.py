from flask import Flask, jsonify, request
from flask_cors import CORS
import datetime
import os
import random

from .database import get_db_connection
from .seed_data import seed_database
from . import decision_engine

from pathlib import Path

# Locate the base directories
backend_dir = Path(__file__).resolve().parent
frontend_dist_dir = (backend_dir.parent / "frontend" / "dist").resolve()
static_folder_path = (frontend_dist_dir / "assets").resolve()

app = Flask(
    __name__,
    static_folder=str(static_folder_path),
    static_url_path="/assets"
)
CORS(app) # Enable CORS for frontend connection

# Security: limit request body size to 1 MB
app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024

# Security: inject security headers on every response
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data:;"
    )
    return response

import re as _re

def _validate_order_id(oid):
    """Validate order ID format: ORD-NNNN"""
    return bool(_re.match(r'^ORD-\d{4}$', str(oid)))

def _validate_sku(sku):
    """Validate product SKU format: P-NNN or similar"""
    return bool(_re.match(r'^P-\d+$', str(sku)))

def _validate_chat_query(query):
    """Validate chat query: non-empty, max 500 chars"""
    if not query or not isinstance(query, str):
        return False, 'Query must be a non-empty string'
    q = query.strip()
    if len(q) == 0:
        return False, 'Query cannot be empty'
    if len(q) > 500:
        return False, 'Query must not exceed 500 characters'
    return True, q

# Helper to serialize sqlite rows to dictionary
def row_to_dict(row):
    return dict(row) if row else None

# Helper to log workflow events
def log_event(cursor, order_id, event_type, description):
    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute('''
        INSERT INTO workflow_events (order_id, event_type, description, created_at)
        VALUES (?, ?, ?, ?)
    ''', (order_id, event_type, description, now))

# Helper to log notifications
def log_notification(cursor, message, severity):
    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute('''
        INSERT INTO notifications (message, severity, read, created_at)
        VALUES (?, ?, 0, ?)
    ''', (message, severity, now))

# Helper to log decisions
def log_decision(cursor, dtype, entity_id, decision, reason, impact, status='Applied'):
    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute('''
        INSERT INTO decision_log (type, entity_id, decision, reason, impact, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (dtype, entity_id, decision, reason, impact, status, now))


# ==========================================
# 1. CORE API: DASHBOARD
# ==========================================
@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get overall order counts
        cursor.execute("SELECT COUNT(*) FROM orders")
        total_orders = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM orders WHERE status = 'Dispatched'")
        dispatched_orders = cursor.fetchone()[0]
        
        # Orders Today (seeded orders count in the pipeline)
        cursor.execute("SELECT COUNT(*) FROM orders WHERE date(created_at) = date('now') OR date(created_at) IS NULL")
        orders_today = cursor.fetchone()[0]
        
        # Orders At Risk
        cursor.execute("SELECT COUNT(*) FROM orders WHERE risk IN ('High', 'Critical') AND status != 'Dispatched'")
        orders_at_risk = cursor.fetchone()[0]
        
        # Fulfillment Rate
        fulfillment_rate = round((dispatched_orders / total_orders * 100), 1) if total_orders > 0 else 94.2
        
        # Inventory Health
        cursor.execute("SELECT COUNT(*) FROM products")
        total_skus = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM products WHERE available <= reorder_level AND available > 0")
        low_stock_skus = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM products WHERE available = 0")
        out_of_stock_skus = cursor.fetchone()[0]
        
        healthy_skus = total_skus - low_stock_skus - out_of_stock_skus
        inventory_health_pct = int((healthy_skus / total_skus * 100)) if total_skus > 0 else 90
        
        # Active Exceptions
        cursor.execute("SELECT COUNT(*) FROM exceptions WHERE status = 'Active'")
        active_exceptions = cursor.fetchone()[0]
        
        # Pending Dispatch (QC completed but not dispatched)
        cursor.execute("SELECT COUNT(*) FROM orders WHERE status = 'QC'")
        pending_dispatch = cursor.fetchone()[0]
        
        # Warehouse Health Score (Circular metric)
        # Calculates weighted components for realistic dynamic behavior:
        f_rate = (dispatched_orders / total_orders * 100) if total_orders > 0 else 92.0
        sla_perf = max(60.0, 100.0 - (orders_at_risk * 3.0))
        inv_perf = max(50.0, 100.0 - (low_stock_skus * 2.0) - (out_of_stock_skus * 4.0))
        exc_perf = max(40.0, 100.0 - (active_exceptions * 3.5))
        
        cursor.execute("SELECT COUNT(*) FROM decision_log WHERE type = 'Route Optimization' OR decision LIKE '%Optimize%'")
        opt_count = cursor.fetchone()[0]
        pick_perf = min(98.0, 78.0 + opt_count * 10.0)
        
        disp_perf = max(60.0, 100.0 - (pending_dispatch * 3.0))
        
        wh_health = int(
            0.30 * f_rate +
            0.20 * sla_perf +
            0.20 * inv_perf +
            0.15 * exc_perf +
            0.07 * pick_perf +
            0.08 * disp_perf
        )
        wh_health = min(max(wh_health, 60), 100)
        
        # Pipeline breakdown counts
        pipeline = {
            'NEW': 0,
            'PRIORITIZED': 0,
            'ALLOCATED': 0,
            'PICKING': 0,
            'PACKING': 0,
            'QC': 0,
            'DISPATCHED': 0
        }
        
        cursor.execute("SELECT status, COUNT(*) FROM orders GROUP BY status")
        status_counts = cursor.fetchall()
        for r in status_counts:
            status = r[0].upper()
            count = r[1]
            if status in pipeline:
                pipeline[status] = count
            elif status == 'DELAYED':
                pipeline['NEW'] += count # default group
                
        # Action Center Recommendations (Priority items)
        actions = []
        
        # Add Allocation Shortages
        cursor.execute('''
            SELECT e.id, e.order_id, e.product_sku, e.quantity, p.name, p.available
            FROM exceptions e
            JOIN products p ON e.product_sku = p.sku
            WHERE e.type = 'Stock shortage' AND e.status = 'Active'
            LIMIT 2
        ''')
        shortage_exceptions = cursor.fetchall()
        for se in shortage_exceptions:
            actions.append({
                'id': se['id'],
                'type': 'CRITICAL_ALLOCATION_CONFLICT',
                'title': '🚨 URGENT ALLOCATION CONFLICT',
                'message': f"Order #{se['order_id']} needs {se['quantity'] + se['available']} units of {se['name']}.",
                'subtext': f"Available stock: {se['available']} units.",
                'recommendation': f"Allocate {se['available']} units to #{se['order_id']} and hold lower priority orders. Trigger replenishment proposal.",
                'entity_id': se['order_id'],
                'action_label': 'Apply Recommendation',
                'alternative_label': 'Simulate Alternative'
            })
            
        # Add Low Stock Warnings
        cursor.execute('''
            SELECT sku, name, available, reorder_level FROM products 
            WHERE available <= reorder_level AND available > 0 
            ORDER BY available ASC LIMIT 2
        ''')
        low_stocks = cursor.fetchall()
        for ls in low_stocks:
            actions.append({
                'id': f"low-stock-{ls['sku']}",
                'type': 'LOW_STOCK',
                'title': '⚠️ LOW STOCK WARNING',
                'message': f"'{ls['name']}' ({ls['sku']}) is below safety threshold.",
                'subtext': f"Available: {ls['available']} | Reorder Level: {ls['reorder_level']}",
                'recommendation': f"Generate replenishment reorder request for {ls['reorder_level'] * 2} units.",
                'entity_id': ls['sku'],
                'action_label': 'Create Reorder',
                'alternative_label': 'View Inventory'
            })
            
        # Add Picking bottleneck
        cursor.execute("SELECT COUNT(*) FROM orders WHERE status = 'Picking'")
        picking_count = cursor.fetchone()[0]
        if picking_count > 3:
            actions.append({
                'id': 'picking-bottleneck',
                'type': 'PICKING_BOTTLENECK',
                'title': '🐢 PICKING BOTTLENECK DETECTED',
                'message': 'Average picking ticket wait-times have increased by 27%.',
                'subtext': f"Active orders in Picking stage: {picking_count}",
                'recommendation': 'Consolidate adjacent order picklists into batched routes to reduce travel distance.',
                'entity_id': 'Picking',
                'action_label': 'Optimize Picking',
                'alternative_label': 'View Routes'
            })
            
        # Next Best Actions (Ranked checklist)
        next_best_actions = []
        if active_exceptions > 0:
            next_best_actions.append({"task": "Resolve active warehouse Exceptions", "impact": "Restores blocked order flows", "severity": "critical"})
        if orders_at_risk > 0:
            next_best_actions.append({"task": f"Prioritize picking for {orders_at_risk} at-risk orders", "impact": "Avoids SLA breach fines", "severity": "high"})
        if low_stock_skus > 0:
            next_best_actions.append({"task": f"Approve {low_stock_skus} pending purchase orders", "impact": "Prevents stockouts on key SKUs", "severity": "medium"})
        if pending_dispatch > 0:
            next_best_actions.append({"task": f"Dispatch {pending_dispatch} ready shipments", "impact": "Improves daily fulfillment numbers", "severity": "low"})
            
        # Fetch recent decision logs
        cursor.execute("SELECT id, created_at, type, entity_id, decision, reason, impact, status FROM decision_log ORDER BY id DESC LIMIT 5")
        decisions_log = [row_to_dict(r) for r in cursor.fetchall()]
        
        return jsonify({
            'health_score': wh_health,
            'kpis': {
                'orders_today': {'value': orders_today, 'trend': '+8% from yesterday', 'status': 'Healthy'},
                'orders_at_risk': {'value': orders_at_risk, 'trend': f"+{orders_at_risk} since 8:00 AM", 'status': 'Warning' if orders_at_risk > 0 else 'Healthy'},
                'fulfillment_rate': {'value': f"{fulfillment_rate}%", 'trend': 'Above 92% SLA target', 'status': 'Healthy'},
                'inventory_health': {'value': f"{inventory_health_pct}%", 'trend': f"{low_stock_skus} SKUs low stock", 'status': 'Warning' if low_stock_skus > 0 else 'Healthy'},
                'out_of_stock': {'value': out_of_stock_skus, 'status': 'Warning' if out_of_stock_skus > 0 else 'Healthy'},
                'active_exceptions': {'value': active_exceptions, 'trend': 'Requires operational action', 'status': 'Critical' if active_exceptions > 0 else 'Healthy'},
                'pending_dispatch': {'value': pending_dispatch, 'trend': 'Awaiting carrier scan', 'status': 'Info'}
            },
            'pipeline': pipeline,
            'action_center': actions,
            'next_best_actions': next_best_actions,
            'decision_history': decisions_log
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ==========================================
# 2. ORDERS ENDPOINTS
# ==========================================
@app.route('/api/orders', methods=['GET'])
def get_orders():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Filter variables
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    priority = request.args.get('priority', '')
    risk = request.args.get('risk', '')
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'DESC')
    
    query = '''
        SELECT id, customer, value, priority, priority_score, sla_deadline, status, risk, risk_score, created_at 
        FROM orders
        WHERE 1=1
    '''
    params = []
    
    if search:
        query += " AND (id LIKE ? OR customer LIKE ?)"
        params.extend([f'%{search}%', f'%{search}%'])
    if status:
        query += " AND status = ?"
        params.append(status)
    if priority:
        query += " AND priority = ?"
        params.append(priority)
    if risk:
        query += " AND risk = ?"
        params.append(risk)
        
    # Prevent SQL injection on sorting
    allowed_sorts = ['created_at', 'value', 'priority_score', 'sla_deadline']
    if sort_by not in allowed_sorts:
        sort_by = 'created_at'
    if sort_order.upper() not in ['ASC', 'DESC']:
        sort_order = 'DESC'
        
    query += f" ORDER BY {sort_by} {sort_order}"
    
    try:
        cursor.execute(query, params)
        orders = [row_to_dict(r) for r in cursor.fetchall()]
        
        # Enforce item summary count for table
        for o in orders:
            cursor.execute("SELECT SUM(quantity) FROM order_items WHERE order_id = ?", (o['id'],))
            total_items = cursor.fetchone()[0]
            o['total_items'] = total_items if total_items else 0
            
        return jsonify(orders)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/orders/<order_id>', methods=['GET'])
def get_order_details(order_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
        order = row_to_dict(cursor.fetchone())
        if not order:
            return jsonify({'error': 'Order not found'}), 404
            
        # Get items
        cursor.execute('''
            SELECT oi.*, p.name, p.location, p.price 
            FROM order_items oi
            JOIN products p ON oi.sku = p.sku
            WHERE oi.order_id = ?
        ''', (order_id,))
        items = [row_to_dict(r) for r in cursor.fetchall()]
        
        # Get timeline events
        cursor.execute("SELECT * FROM workflow_events WHERE order_id = ? ORDER BY created_at ASC", (order_id,))
        events = [row_to_dict(r) for r in cursor.fetchall()]
        
        # Re-run priority calculation explanation
        available_ratio = 1.0
        # Compute dynamic stock ratio for this order items
        total_req = sum(item['quantity'] for item in items)
        if total_req > 0:
            cursor.execute('''
                SELECT SUM(MIN(p.available, oi.quantity)) 
                FROM order_items oi
                JOIN products p ON oi.sku = p.sku
                WHERE oi.order_id = ?
            ''', (order_id,))
            avail_sum = cursor.fetchone()[0]
            avail_sum = avail_sum if avail_sum else 0
            available_ratio = avail_sum / total_req
            
        score, p_class, reasons = decision_engine.calculate_priority_score(
            order['value'], order['customer'], order['sla_deadline'], available_ratio
        )
        
        # Add risk details
        risk_details = decision_engine.calculate_sla_risk(conn, order_id)
        
        return jsonify({
            'order': order,
            'items': items,
            'events': events,
            'priority_explanation': {
                'score': score,
                'class': p_class,
                'reasons': reasons
            },
            'sla_risk': risk_details
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/orders', methods=['POST'])
def create_order():
    conn = get_db_connection()
    cursor = conn.cursor()
    data = request.json
    
    try:
        order_id = f"ORD-{random.randint(10000, 99999)}"
        customer = data.get('customer', 'Default Customer')
        deadline = data.get('sla_deadline')
        items = data.get('items', []) # expects [{'sku': 'P-101', 'quantity': 2}]
        
        if not deadline:
            deadline = (datetime.datetime.now() + datetime.timedelta(hours=8)).strftime('%Y-%m-%d %H:%M:%S')
            
        # Calculate value
        value = 0.0
        for it in items:
            cursor.execute("SELECT price FROM products WHERE sku = ?", (it['sku'],))
            prod = cursor.fetchone()
            if prod:
                value += prod['price'] * it['quantity']
                
        # Calculate priority
        score, p_class, reasons = decision_engine.calculate_priority_score(value, customer, deadline, 1.0)
        
        now_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Insert order
        cursor.execute('''
            INSERT INTO orders (id, customer, value, priority, priority_score, sla_deadline, status, risk, risk_score, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'New', 'Low', 0, ?)
        ''', (order_id, customer, value, p_class, score, deadline, now_str))
        
        # Insert items
        for it in items:
            cursor.execute('''
                INSERT INTO order_items (order_id, sku, quantity, allocated, picked, packed, damaged, status)
                VALUES (?, ?, ?, 0, 0, 0, 0, 'Pending')
            ''', (order_id, it['sku'], it['quantity']))
            
        log_event(cursor, order_id, 'Creation', f"Order submitted by customer {customer}.")
        log_event(cursor, order_id, 'Priority Score', f"Engine computed Priority Score: {score}/100 ({p_class}).")
        log_notification(cursor, f"New Order {order_id} received from {customer}.", 'Info')
        
        conn.commit()
        return jsonify({'message': 'Order created successfully', 'order_id': order_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/orders/<order_id>/prioritize', methods=['POST'])
def prioritize_order(order_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT value, customer, sla_deadline FROM orders WHERE id = ?", (order_id,))
        order = cursor.fetchone()
        if not order:
            return jsonify({'error': 'Order not found'}), 404
            
        # Get items details to calculate stock ratio
        cursor.execute('''
            SELECT oi.quantity, p.available
            FROM order_items oi
            JOIN products p ON oi.sku = p.sku
            WHERE oi.order_id = ?
        ''', (order_id,))
        items = cursor.fetchall()
        total_req = sum(it['quantity'] for it in items)
        available_ratio = 1.0
        if total_req > 0:
            avail_sum = sum(min(it['available'], it['quantity']) for it in items)
            available_ratio = avail_sum / total_req
            
        score, p_class, reasons = decision_engine.calculate_priority_score(
            order['value'], order['customer'], order['sla_deadline'], available_ratio
        )
        
        # Update order priority status
        cursor.execute('''
            UPDATE orders 
            SET priority = ?, priority_score = ?, status = 'Prioritized'
            WHERE id = ?
        ''', (p_class, score, order_id))
        
        cursor.execute("UPDATE order_items SET status = 'Prioritized' WHERE order_id = ?", (order_id,))
        
        log_event(cursor, order_id, 'Priority Determined', f"Manually executed smart priority. Priority Score = {score} ({p_class}).")
        
        conn.commit()
        return jsonify({
            'message': 'Order prioritization engine completed.',
            'priority_score': score,
            'priority': p_class,
            'reasons': reasons
        })
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/orders/<order_id>/allocate', methods=['POST'])
def allocate_order(order_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check order
        cursor.execute("SELECT status, customer FROM orders WHERE id = ?", (order_id,))
        order = cursor.fetchone()
        if not order:
            return jsonify({'error': 'Order not found'}), 404
            
        # Fetch items
        cursor.execute("SELECT sku, quantity, allocated FROM order_items WHERE order_id = ?", (order_id,))
        items = cursor.fetchall()
        
        allocation_success = True
        allocated_items_summary = []
        shortage_items_summary = []
        
        for item in items:
            sku = item['sku']
            qty = item['quantity']
            already_allocated = item['allocated']
            needed = qty - already_allocated
            
            if needed <= 0:
                continue
                
            # Check availability
            cursor.execute("SELECT available, name FROM products WHERE sku = ?", (sku,))
            p = cursor.fetchone()
            avail = p['available']
            p_name = p['name']
            
            if avail >= needed:
                # Fully allocate
                cursor.execute('''
                    UPDATE products 
                    SET available = available - ?, reserved = reserved + ?
                    WHERE sku = ?
                ''', (needed, needed, sku))
                
                cursor.execute('''
                    UPDATE order_items 
                    SET allocated = quantity, status = 'Allocated'
                    WHERE order_id = ? AND sku = ?
                ''', (order_id, sku))
                
                allocated_items_summary.append(f"{needed}x {p_name}")
            else:
                # Partial/Shortage allocation
                allocation_success = False
                shortage_qty = needed - avail
                
                if avail > 0:
                    cursor.execute('''
                        UPDATE products 
                        SET available = 0, reserved = reserved + ?
                        WHERE sku = ?
                    ''', (avail, sku))
                    
                    cursor.execute('''
                        UPDATE order_items 
                        SET allocated = allocated + ?, status = 'Partial'
                        WHERE order_id = ? AND sku = ?
                    ''', (avail, order_id, sku))
                    
                # Create exception log for shortage
                exp_id = f"EXP-{random.randint(1000, 9999)}"
                desc = f"Order {order_id} requires {qty} units of {p_name} ({sku}), but only {avail} were available in inventory."
                rec = f"Allocate {avail} available units to higher-priority Order {order_id}. Create a safety reorder of {qty * 3} units."
                
                cursor.execute('''
                    INSERT INTO exceptions (id, type, severity, order_id, product_sku, quantity, detected_at, status, description, recommendation)
                    VALUES (?, 'Stock shortage', 'Critical', ?, ?, ?, datetime('now'), 'Active', ?, ?)
                ''', (exp_id, order_id, sku, shortage_qty, desc, rec))
                
                log_notification(cursor, f"Stock shortage exception raised for Order {order_id}.", 'Critical')
                shortage_items_summary.append(f"{shortage_qty}x {p_name} short")
                
        if allocation_success:
            cursor.execute("UPDATE orders SET status = 'Allocated' WHERE id = ?", (order_id,))
            log_event(cursor, order_id, 'Stock Allocated', f"Inventory allocated successfully: {', '.join(allocated_items_summary)}.")
            log_decision(cursor, 'Stock Allocation', order_id, f"Allocated items: {', '.join(allocated_items_summary)}", 'Sufficient stock level', 'Order successfully transition to packing stage')
            message = "Stock fully allocated."
        else:
            cursor.execute("UPDATE orders SET status = 'Allocated', risk = 'High', risk_score = 80 WHERE id = ?", (order_id,))
            log_event(cursor, order_id, 'Partial Allocation', f"Stock shortage encountered: {', '.join(shortage_items_summary)}. Exception created.")
            log_decision(cursor, 'Partial Stock Allocation', order_id, f"Allocated remaining stock: {', '.join(allocated_items_summary)}", 'Inventory shortage constraints', 'Triggered stock shortage exception & reorder recommendation')
            message = "Partial stock allocation applied. Shortage exceptions registered."
            
        conn.commit()
        return jsonify({'message': message, 'success': allocation_success})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/orders/<order_id>/picking', methods=['POST'])
def start_picking(order_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check order
        cursor.execute("SELECT status FROM orders WHERE id = ?", (order_id,))
        order = cursor.fetchone()
        if not order or order['status'] != 'Allocated':
            return jsonify({'error': 'Order must be Allocated to start picking'}), 400
            
        # Get items locations
        cursor.execute('''
            SELECT p.location, oi.quantity, p.name 
            FROM order_items oi
            JOIN products p ON oi.sku = p.sku
            WHERE oi.order_id = ?
        ''', (order_id,))
        items = cursor.fetchall()
        
        locations = [it['location'] for it in items]
        optimized_route, saving = decision_engine.optimize_picking_route(locations)
        
        # Move order state to 'Picking'
        cursor.execute("UPDATE orders SET status = 'Picking' WHERE id = ?", (order_id,))
        cursor.execute("UPDATE order_items SET status = 'Picking' WHERE order_id = ?", (order_id,))
        
        # Assign Picker (Idle zone pickers)
        cursor.execute("SELECT id, name FROM pickers WHERE status = 'Idle' LIMIT 1")
        picker = cursor.fetchone()
        picker_name = "System AutoPicker"
        if picker:
            picker_id = picker['id']
            picker_name = picker['name']
            cursor.execute("UPDATE pickers SET status = 'Active' WHERE id = ?", (picker_id,))
            
        log_event(cursor, order_id, 'Picking', f"Picking ticket assigned to {picker_name}. Optimized Route sequence: {' -> '.join(optimized_route)}.")
        log_decision(cursor, 'Route Optimization', order_id, f"Route sequence: {' -> '.join(optimized_route)}", 'Minimize picker travel time', f"Expected picker route travel reduction of {saving}%")
        
        conn.commit()
        return jsonify({
            'message': f"Picking started. Assigned to {picker_name}.",
            'optimized_route': optimized_route,
            'efficiency_gain': saving
        })
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/orders/<order_id>/packing', methods=['POST'])
def start_packing(order_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Move order to Packing and update items to Picked
        cursor.execute("UPDATE orders SET status = 'Packing' WHERE id = ?", (order_id,))
        cursor.execute("UPDATE order_items SET picked = quantity, status = 'Picked' WHERE order_id = ?", (order_id,))
        
        # Set Picker to idle again
        cursor.execute('''
            SELECT description FROM workflow_events 
            WHERE order_id = ? AND event_type = 'Picking' 
            ORDER BY created_at DESC LIMIT 1
        ''', (order_id,))
        event_row = cursor.fetchone()
        if event_row:
            desc = event_row['description']
            prefix = "Picking ticket assigned to "
            if desc.startswith(prefix):
                picker_name = desc[len(prefix):]
                dot_idx = picker_name.find(".")
                if dot_idx != -1:
                    picker_name = picker_name[:dot_idx]
                cursor.execute("UPDATE pickers SET status = 'Idle' WHERE name = ?", (picker_name,))
        
        log_event(cursor, order_id, 'Picking Completed', "All items successfully picked and moved to Packing Workspace.")
        conn.commit()
        return jsonify({'message': 'Order moved to packing workbench'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/orders/<order_id>/qc', methods=['POST'])
def pass_qc(order_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    data = request.json or {}
    failed = data.get('failed', False)
    failure_reason = data.get('reason', '')
    sku = data.get('sku', '')
    qty = data.get('quantity', 1)
    
    try:
        if failed:
            # Handle QC Failure
            cursor.execute("UPDATE orders SET status = 'Delayed', risk = 'High', risk_score = 90 WHERE id = ?", (order_id,))
            
            # Find item to mark exception
            cursor.execute("SELECT name FROM products WHERE sku = ?", (sku,))
            p = cursor.fetchone()
            p_name = p['name'] if p else sku
            
            cursor.execute('''
                UPDATE order_items 
                SET damaged = damaged + ? 
                WHERE order_id = ? AND sku = ?
            ''', (qty, order_id, sku))
            
            # Increase damaged stock on product
            cursor.execute("UPDATE products SET damaged = damaged + ?, reserved = MAX(0, reserved - ?) WHERE sku = ?", (qty, qty, sku))
            
            exp_id = f"EXP-{random.randint(1000, 9999)}"
            desc = f"QC failure: {qty} unit of {p_name} found damaged during barcode pack-out scan. {failure_reason}"
            rec = "Search nearby shelf for backup unit, reserve it, swap inventory scan, and resume pack-out flow."
            
            cursor.execute('''
                INSERT INTO exceptions (id, type, severity, order_id, product_sku, quantity, detected_at, status, description, recommendation)
                VALUES (?, 'Damaged item', 'High', ?, ?, ?, datetime('now'), 'Active', ?, ?)
            ''', (exp_id, order_id, sku, qty, desc, rec))
            
            log_event(cursor, order_id, 'QC Failed Exception', f"Damaged item exception created ({exp_id}) for SKU {sku}. Packing locked.")
            log_notification(cursor, f"Quality failure on Order {order_id}. Physical damage reported.", 'Critical')
            
            conn.commit()
            return jsonify({'message': 'QC Failure exception successfully registered.', 'exception_id': exp_id, 'success': False})
            
        else:
            # Pass QC
            cursor.execute("UPDATE orders SET status = 'QC' WHERE id = ?", (order_id,))
            cursor.execute("UPDATE order_items SET packed = quantity, status = 'Packed' WHERE order_id = ?", (order_id,))
            log_event(cursor, order_id, 'Quality Check Passed', "Items scanned, quantity validated, label verified. Packaging complete.")
            
            conn.commit()
            return jsonify({'message': 'QC checklist cleared. Order ready for shipment dispatch.', 'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/orders/<order_id>/dispatch', methods=['POST'])
def dispatch_order(order_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    data = request.json or {}
    carrier = data.get('carrier', 'FedEx Ground')
    tracking = f"TRK-{random.randint(10000000, 99999999)}"
    
    try:
        # Verify order
        cursor.execute("SELECT status FROM orders WHERE id = ?", (order_id,))
        order = cursor.fetchone()
        if not order:
            return jsonify({'error': 'Order not found'}), 404
            
        # Get items to subtract reserved inventory
        cursor.execute("SELECT sku, quantity FROM order_items WHERE order_id = ?", (order_id,))
        items = cursor.fetchall()
        
        for item in items:
            sku = item['sku']
            qty = item['quantity']
            # Subtract reserved stock (the stock was reserved during allocation)
            cursor.execute('''
                UPDATE products 
                SET reserved = MAX(0, reserved - ?) 
                WHERE sku = ?
            ''', (qty, sku))
            
        # Update order status to Dispatched
        cursor.execute('''
            UPDATE orders 
            SET status = 'Dispatched', risk = 'Low', risk_score = 0
            WHERE id = ?
        ''', (order_id,))
        
        cursor.execute("UPDATE order_items SET status = 'Completed' WHERE order_id = ?", (order_id,))
        
        log_event(cursor, order_id, 'Dispatched', f"Order scanned out. Handed to {carrier} (Tracking: {tracking}).")
        log_decision(cursor, 'Shipment Dispatch', order_id, f"Dispatched via {carrier}", 'Dispatch workflow completed', 'Order marked fully complete')
        log_notification(cursor, f"Order {order_id} successfully shipped via {carrier}.", 'Info')
        
        conn.commit()
        return jsonify({'message': f"Order shipped. Carrier: {carrier} Tracking: {tracking}"})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ==========================================
# 3. INVENTORY ENDPOINTS
# ==========================================
@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM products")
        products = [row_to_dict(r) for r in cursor.fetchall()]
        
        # Enforce Stock Health metric
        for p in products:
            if p['available'] == 0:
                p['stock_health'] = 'Out of Stock'
            elif p['available'] <= p['reorder_level']:
                p['stock_health'] = 'Low Stock'
            elif p['damaged'] > 0:
                p['stock_health'] = 'Damaged'
            else:
                p['stock_health'] = 'Healthy'
                
        # Get metrics
        cursor.execute("SELECT COUNT(*) FROM products")
        total_skus = cursor.fetchone()[0]
        
        cursor.execute("SELECT SUM(available) FROM products")
        available_units = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM products WHERE available <= reorder_level AND available > 0")
        low_stock = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM products WHERE available = 0")
        out_of_stock = cursor.fetchone()[0]
        
        cursor.execute("SELECT SUM(damaged) FROM products")
        damaged_units = cursor.fetchone()[0]
        
        return jsonify({
            'products': products,
            'summary': {
                'total_skus': total_skus,
                'available_units': available_units if available_units else 0,
                'low_stock': low_stock,
                'out_of_stock': out_of_stock,
                'damaged_units': damaged_units if damaged_units else 0
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/inventory/adjust', methods=['POST'])
def adjust_stock():
    conn = get_db_connection()
    cursor = conn.cursor()
    data = request.json
    sku = data.get('sku')
    qty = data.get('quantity') # positive to add, negative to subtract
    reason = data.get('reason', 'Manual Adjustment')
    
    if not sku or qty is None:
        return jsonify({'error': 'SKU and quantity are required'}), 400
        
    try:
        cursor.execute("SELECT available, name FROM products WHERE sku = ?", (sku,))
        p = cursor.fetchone()
        if not p:
            return jsonify({'error': 'Product not found'}), 404
            
        new_avail = max(0, p['available'] + qty)
        cursor.execute("UPDATE products SET available = ? WHERE sku = ?", (new_avail, sku))
        
        log_decision(cursor, 'Inventory Adjustment', sku, f"Adjusted stock level by {qty:+} units.", reason, f"Available stock updated to {new_avail}")
        log_notification(cursor, f"Inventory SKU {sku} adjusted manually ({qty:+}).", 'Info')
        
        conn.commit()
        return jsonify({'message': f"Stock level adjusted. New quantity: {new_avail}"})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/inventory/reorder', methods=['POST'])
def create_reorder():
    conn = get_db_connection()
    cursor = conn.cursor()
    data = request.json
    sku = data.get('sku')
    qty = data.get('quantity', 30)
    
    if not sku:
        return jsonify({'error': 'SKU is required'}), 400
        
    try:
        cursor.execute("SELECT name, available, reorder_level FROM products WHERE sku = ?", (sku,))
        p = cursor.fetchone()
        if not p:
            return jsonify({'error': 'Product not found'}), 404
            
        cursor.execute('''
            UPDATE reorder_recommendations 
            SET status = 'Approved' 
            WHERE sku = ? AND status = 'Pending'
        ''', (sku,))
        
        # Add new stock to product
        cursor.execute("UPDATE products SET available = available + ? WHERE sku = ?", (qty, sku))
        
        # Resolve any stock shortage exception associated with this SKU
        cursor.execute("SELECT id, order_id FROM exceptions WHERE product_sku = ? AND type = 'Stock shortage' AND status = 'Active'", (sku,))
        exps = cursor.fetchall()
        for exp in exps:
            cursor.execute("UPDATE exceptions SET status = 'Resolved', resolution_notes = 'Restocked via reorder execution.' WHERE id = ?", (exp['id'],))
            log_event(cursor, exp['order_id'], 'Restock Resolve', f"Shortage exception {exp['id']} resolved by incoming replenishment stock.")
            
        log_decision(cursor, 'Reorder Replenishment', sku, f"Reordered and added {qty} units.", 'Restock threshold safety triggers', f"Restored safety stock buffer for {p['name']}")
        log_notification(cursor, f"Replenishment reorder completed for {p['name']} (+{qty} units).", 'Info')
        
        conn.commit()
        return jsonify({'message': 'Reorder executed successfully. Stock level updated.'})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ==========================================
# 4. EXCEPTIONS ENDPOINTS
# ==========================================
@app.route('/api/exceptions', methods=['GET'])
def get_exceptions():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            SELECT e.*, p.name as product_name, p.available as product_available
            FROM exceptions e
            LEFT JOIN products p ON e.product_sku = p.sku
            ORDER BY e.detected_at DESC
        ''')
        exps = [row_to_dict(r) for r in cursor.fetchall()]
        return jsonify(exps)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/exceptions', methods=['POST'])
def raise_exception():
    conn = get_db_connection()
    cursor = conn.cursor()
    data = request.json
    
    try:
        exp_id = f"EXP-{random.randint(1000, 9999)}"
        etype = data.get('type')
        severity = data.get('severity', 'Medium')
        order_id = data.get('order_id', '')
        sku = data.get('product_sku', '')
        qty = data.get('quantity', 0)
        desc = data.get('description', '')
        rec = data.get('recommendation', 'Inspect and resolve manually.')
        
        cursor.execute('''
            INSERT INTO exceptions (id, type, severity, order_id, product_sku, quantity, detected_at, status, description, recommendation)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 'Active', ?, ?)
        ''', (exp_id, etype, severity, order_id, sku, qty, desc, rec))
        
        if order_id:
            log_event(cursor, order_id, 'Exception Raised', f"Exception {exp_id} ({etype}) raised. SLA impact: {severity}.")
            cursor.execute("UPDATE orders SET risk = 'High', risk_score = 75 WHERE id = ?", (order_id,))
            
        log_notification(cursor, f"New active Exception {exp_id} ({etype}) reported.", severity)
        
        conn.commit()
        return jsonify({'message': 'Exception raised successfully', 'exception_id': exp_id}), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/exceptions/<exception_id>/resolve', methods=['POST'])
def resolve_exception(exception_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    data = request.json or {}
    notes = data.get('notes', 'Resolved manually by operator.')
    
    try:
        cursor.execute("SELECT * FROM exceptions WHERE id = ?", (exception_id,))
        exp = cursor.fetchone()
        if not exp:
            return jsonify({'error': 'Exception not found'}), 404
            
        order_id = exp['order_id']
        sku = exp['product_sku']
        qty = exp['quantity']
        etype = exp['type']
        
        # Perform Resolution Logic
        if etype == 'Damaged item' and order_id:
            # Re-allocate a fresh unit to replace the damaged unit
            # Check if there is stock available
            cursor.execute("SELECT available, name FROM products WHERE sku = ?", (sku,))
            p = cursor.fetchone()
            
            if p and p['available'] >= qty:
                # Deduct 1 from available, add 1 to reserved
                cursor.execute("UPDATE products SET available = available - ?, reserved = reserved + ? WHERE sku = ?", (qty, qty, sku))
                # Adjust order item damaged back to 0
                cursor.execute("UPDATE order_items SET damaged = MAX(0, damaged - ?), allocated = quantity WHERE order_id = ? AND sku = ?", (qty, order_id, sku))
                
                # Check if order is fully picked now, if yes, return to packing, else picking
                # For simplicity, we directly set order back to Packing
                cursor.execute("UPDATE orders SET status = 'Packing', risk = 'Low', risk_score = 0 WHERE id = ?", (order_id,))
                log_event(cursor, order_id, 'Replacement Stock Reserved', f"Reserved {qty} replacement units of {p['name']} from shelf inventory. Exception resolved.")
                log_decision(cursor, 'Exception Resolution', exception_id, "Substituted damaged unit with active shelf stock", 'Recover damaged goods', 'Order returned to Packing sequence')
            else:
                # No backup stock
                notes = 'Unable to resolve damaged item due to zero shelf backup stock. Fulfill order partially.'
                cursor.execute("UPDATE orders SET status = 'Delayed' WHERE id = ?", (order_id,))
                log_event(cursor, order_id, 'Shortage Block', "Alternative replacement stock unavailable. Fulfillment delayed.")
                
        elif etype == 'Stock shortage' and order_id:
            # Re-run allocation if stock was updated
            cursor.execute("SELECT available FROM products WHERE sku = ?", (sku,))
            avail = cursor.fetchone()[0]
            if avail >= qty:
                cursor.execute("UPDATE products SET available = available - ?, reserved = reserved + ? WHERE sku = ?", (qty, qty, sku))
                cursor.execute("UPDATE order_items SET allocated = quantity, status = 'Allocated' WHERE order_id = ? AND sku = ?", (order_id, sku))
                cursor.execute("UPDATE orders SET status = 'Allocated', risk = 'Low', risk_score = 0 WHERE id = ?", (order_id,))
                log_event(cursor, order_id, 'Shortage Resolved', f"Allocated required {qty} units from restocked inventory.")
                log_decision(cursor, 'Exception Resolution', exception_id, "Allocated replenishment stock", 'Shortage resolution', 'Order allocated')
            else:
                return jsonify({'error': f"Still insufficient inventory. Needs {qty}, available is {avail}."}), 400
                
        # Update exception status to Resolved
        cursor.execute("UPDATE exceptions SET status = 'Resolved', resolution_notes = ? WHERE id = ?", (notes, exception_id))
        
        # Verify if order has any other active exceptions. If no, clear high risk
        if order_id:
            cursor.execute("SELECT COUNT(*) FROM exceptions WHERE order_id = ? AND status = 'Active'", (order_id,))
            remaining_active = cursor.fetchone()[0]
            if remaining_active == 0:
                cursor.execute("UPDATE orders SET risk = 'Low', risk_score = 0 WHERE id = ?", (order_id,))
                
        log_notification(cursor, f"Exception {exception_id} marked as Resolved.", 'Info')
        
        conn.commit()
        return jsonify({'message': 'Exception resolved successfully', 'notes': notes})
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ==========================================
# 5. SMART DECISIONS & SIMULATOR
# ==========================================
@app.route('/api/decisions/simulate', methods=['POST'])
def simulate_decision():
    """
    Simulates inventory allocation on-the-fly without database modification.
    """
    data = request.json or {}
    sku = data.get('sku', 'P-101')
    available_stock = int(data.get('available_stock', 7))
    
    # Simulates two test orders: A (Critical, needs 10) and B (Low, needs 5)
    order_a_qty = int(data.get('order_a_qty', 10))
    order_a_priority = data.get('order_a_priority', 'Critical')
    
    order_b_qty = int(data.get('order_b_qty', 5))
    order_b_priority = data.get('order_b_priority', 'Low')
    
    # Priority Scores Mapping
    score_map = {'Critical': 92, 'High': 78, 'Medium': 55, 'Low': 25}
    score_a = score_map.get(order_a_priority, 50)
    score_b = score_map.get(order_b_priority, 50)
    
    # Sort orders by priority score
    sim_orders = [
        {'id': 'ORD-A', 'quantity': order_a_qty, 'priority': order_a_priority, 'score': score_a, 'allocated': 0},
        {'id': 'ORD-B', 'quantity': order_b_qty, 'priority': order_b_priority, 'score': score_b, 'allocated': 0}
    ]
    sim_orders.sort(key=lambda x: x['score'], reverse=True)
    
    remaining = available_stock
    allocations = []
    
    for o in sim_orders:
        needed = o['quantity']
        if remaining >= needed:
            alloc = needed
            status = "Fully Allocated"
            remaining -= needed
        elif remaining > 0:
            alloc = remaining
            status = "Partially Allocated"
            remaining = 0
        else:
            alloc = 0
            status = "On Hold (Shortage)"
            
        allocations.append({
            'order_id': o['id'],
            'requested': o['quantity'],
            'priority': o['priority'],
            'score': o['score'],
            'allocated': alloc,
            'status': status,
            'reason': f"Prioritized due to score {o['score']} vs competitor."
        })
        
    # Generate recommendations text
    recs = []
    if remaining == 0 and (allocations[0]['allocated'] < allocations[0]['requested'] or allocations[1]['allocated'] < allocations[1]['requested']):
        shortage = (order_a_qty + order_b_qty) - available_stock
        recs.append(f"Shortage of {shortage} units detected. Trigger replenishment PO recommendation immediately.")
        
    if allocations[0]['allocated'] > 0 and allocations[1]['allocated'] == 0:
        recs.append(f"Hold allocation for {allocations[1]['order_id']} ({allocations[1]['priority']}) to guarantee fulfillment of {allocations[0]['order_id']} ({allocations[0]['priority']}).")
    elif remaining > 0:
        recs.append("All orders fully satisfied. Safety stock buffers remains intact.")
        
    return jsonify({
        'sku': sku,
        'available_stock': available_stock,
        'allocations': allocations,
        'recommendations': recs,
        'impact': "Fulfillment SLA risk mitigated for highest priority queue." if available_stock < (order_a_qty + order_b_qty) else "No risks detected."
    })


@app.route('/api/picking/optimize', methods=['POST'])
def post_picking_optimize():
    data = request.json or {}
    locations = data.get('locations', [])
    opt_route, savings = decision_engine.optimize_picking_route(locations)
    return jsonify({
        'original_locations': locations,
        'optimized_route': opt_route,
        'efficiency_gain_pct': savings,
        'travel_reduction_meters': len(locations) * 20 # placeholder formula
    })


# ==========================================
# 6. NOTIFICATIONS
# ==========================================
@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 15")
        notifs = [row_to_dict(r) for r in cursor.fetchall()]
        return jsonify(notifs)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/notifications/<int:notif_id>/read', methods=['POST'])
def mark_notification_read(notif_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE notifications SET read = 1 WHERE id = ?", (notif_id,))
        conn.commit()
        return jsonify({'message': 'Notification marked read'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ==========================================
# 7. ANALYTICS
# ==========================================
@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. Orders by status
        cursor.execute("SELECT status, COUNT(*) FROM orders GROUP BY status")
        orders_status = [{'status': r[0], 'count': r[1]} for r in cursor.fetchall()]
        
        # 2. Orders by priority
        cursor.execute("SELECT priority, COUNT(*) FROM orders GROUP BY priority")
        orders_priority = [{'priority': r[0], 'count': r[1]} for r in cursor.fetchall()]
        
        # 3. Exceptions by type
        cursor.execute("SELECT type, COUNT(*) FROM exceptions GROUP BY type")
        exceptions_type = [{'type': r[0], 'count': r[1]} for r in cursor.fetchall()]
        
        # 4. Inventory health categories
        cursor.execute("SELECT sku FROM products")
        prods = cursor.fetchall()
        
        stock_categories = {'Healthy': 0, 'Low Stock': 0, 'Out of Stock': 0, 'Damaged': 0}
        for p in prods:
            cursor.execute("SELECT available, reorder_level, damaged FROM products WHERE sku = ?", (p['sku'],))
            r = cursor.fetchone()
            if r['available'] == 0:
                stock_categories['Out of Stock'] += 1
            elif r['available'] <= r['reorder_level']:
                stock_categories['Low Stock'] += 1
            elif r['damaged'] > 0:
                stock_categories['Damaged'] += 1
            else:
                stock_categories['Healthy'] += 1
                
        inventory_health = [{'name': k, 'value': v} for k, v in stock_categories.items()]
        
        # 5. SLA risk counts
        cursor.execute("SELECT risk, COUNT(*) FROM orders WHERE status != 'Dispatched' GROUP BY risk")
        sla_risk = [{'risk': r[0], 'count': r[1]} for r in cursor.fetchall()]
        
        # 6. Bottleneck processing times (for charts)
        bottleneck_data = [
            {'stage': 'Allocation', 'time': 4},
            {'stage': 'Picking', 'time': 22},
            {'stage': 'Packing', 'time': 8},
            {'stage': 'QC Check', 'time': 3},
            {'stage': 'Dispatch', 'time': 5}
        ]
        
        return jsonify({
            'orders_by_status': orders_status,
            'orders_by_priority': orders_priority,
            'exceptions_by_type': exceptions_type,
            'inventory_health_distribution': inventory_health,
            'sla_risk_distribution': sla_risk,
            'workflow_bottlenecks': bottleneck_data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# ==========================================
# 8. HACKATHON DEMO CONTROLLER
# ==========================================
@app.route('/api/demo/reset', methods=['POST'])
def reset_demo():
    try:
        seed_database()
        return jsonify({'message': 'Demo database successfully reset and seeded to initial state!'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/demo/step/<int:step_id>', methods=['POST'])
def execute_demo_step(step_id):
    """
    Executes specific logical operations for the upgraded 7-step walkthrough stepper scenario:
    - Step 1: Initialize / Reset DB to seed state. Show ORD-104 shortage.
    - Step 2: Highlight inventory shortage exception details.
    - Step 3: Compare priority score tiers (ORD-104 score 92 vs ORD-118 score 35).
    - Step 4: Decision Engine recommends allocating 7 units to ORD-104 and putting ORD-118 on hold.
    - Step 5: User applies the decision (database updates, stock reserved, reorder recommended).
    - Step 6: Simulate QC Failure (1 unit Wireless Headphones damaged in barcode scan).
    - Step 7: Substitute replacement unit from backup inventory, pass QC, and dispatch ORD-104.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if step_id == 1:
            seed_database()
            
            # Fetch details of ORD-104 and ORD-118
            cursor.execute("SELECT id, customer, value, priority, priority_score, status, risk FROM orders WHERE id IN ('ORD-104', 'ORD-118')")
            orders = [row_to_dict(r) for r in cursor.fetchall()]
            
            cursor.execute("SELECT available, reserved, reorder_level FROM products WHERE sku = 'P-101'")
            product = row_to_dict(cursor.fetchone())
            
            return jsonify({
                'message': 'Demo State Initialized. Critical order ORD-104 detected with inventory shortage.',
                'orders': orders,
                'product': product,
                'next_step': 2
            })
            
        elif step_id == 2:
            # Highlight shortage details
            cursor.execute("SELECT available, name FROM products WHERE sku = 'P-101'")
            p = cursor.fetchone()
            return jsonify({
                'message': f"Inventory shortage detected: Wireless Headphones Pro ({p['name']}) has only 7 available units, but critical order ORD-104 requires 10.",
                'next_step': 3
            })
            
        elif step_id == 3:
            # Compare priority scores
            return jsonify({
                'message': "Priority Engine evaluated competing queues: ORD-104 (Critical priority, score 92/100) vs ORD-118 (Low priority, score 35/100).",
                'next_step': 4
            })
            
        elif step_id == 4:
            # Show recommendation
            return jsonify({
                'message': "Decision Engine recommendation: Allocate all 7 available units to critical order ORD-104, put ORD-118 on hold, and trigger replenishment.",
                'next_step': 5
            })
            
        elif step_id == 5:
            # Apply decision
            cursor.execute("SELECT available, reserved, name FROM products WHERE sku = 'P-101'")
            p = cursor.fetchone()
            avail = p['available']
            p_name = p['name']
            
            # ORD-104 gets 7 units allocated
            cursor.execute("UPDATE products SET available = 0, reserved = reserved + ? WHERE sku = 'P-101'", (avail,))
            cursor.execute("UPDATE order_items SET allocated = ?, status = 'Partial' WHERE order_id = 'ORD-104' AND sku = 'P-101'", (avail,))
            cursor.execute("UPDATE orders SET status = 'Allocated', risk = 'High', risk_score = 80 WHERE id = 'ORD-104'")
            
            # ORD-118 gets 0 units allocated (remains pending/held)
            cursor.execute("UPDATE order_items SET allocated = 0, status = 'Held' WHERE order_id = 'ORD-118' AND sku = 'P-101'")
            cursor.execute("UPDATE orders SET status = 'Prioritized' WHERE id = 'ORD-118'")
            
            # Create shortage exception for ORD-104 (missing 3 units)
            exp_id = "EXP-104-SHORT"
            desc = f"Order ORD-104 requires 10 units of {p_name} (P-101), but only 7 units were available. Shortage of 3 units."
            rec = "Allocate 7 available units to critical order ORD-104, put ORD-118 on hold, and create a safety replenishment reorder of 30 units."
            cursor.execute('''
                INSERT INTO exceptions (id, type, severity, order_id, product_sku, quantity, detected_at, status, description, recommendation)
                VALUES (?, 'Stock shortage', 'Critical', 'ORD-104', 'P-101', 3, datetime('now'), 'Active', ?, ?)
            ''', (exp_id, desc, rec))
            
            # Trigger Reorder Recommendation
            cursor.execute('''
                INSERT INTO reorder_recommendations (sku, current_stock, reorder_level, estimated_demand, recommended_qty, status, created_at)
                VALUES ('P-101', 0, 15, 25, 30, 'Pending', datetime('now'))
            ''')
            
            log_event(cursor, 'ORD-104', 'Partial Allocation', "Decision Engine allocated available 7 units to ORD-104. Raised critical shortage exception EXP-104-SHORT.")
            log_decision(cursor, 'Stock Allocation', 'ORD-104', "Allocated 7 units, postponed ORD-118", "Prioritize critical SLA delivery vs low priority", "SLA risk score capped at 80% with partial fulfillment")
            log_notification(cursor, "Shortage Exception raised on ORD-104. Reorder recommendation generated.", "Critical")
            
            conn.commit()
            return jsonify({
                'message': 'Smart stock allocation applied. Available 7 units allocated to ORD-104. Shortage exception raised and replenishment recommendation created.',
                'next_step': 6
            })
            
        elif step_id == 6:
            # QC Failure (1 unit damaged during packing QC check)
            # Transition order from Picking to Packing first (simulate progress)
            cursor.execute("UPDATE orders SET status = 'Delayed', risk = 'High', risk_score = 90 WHERE id = 'ORD-104'")
            # 1 unit marked damaged
            cursor.execute("UPDATE order_items SET damaged = 1, status = 'Exception' WHERE order_id = 'ORD-104' AND sku = 'P-101'")
            # Update product damaged count
            cursor.execute("UPDATE products SET damaged = damaged + 1, reserved = reserved - 1 WHERE sku = 'P-101'")
            
            exp_id = "EXP-104-QC-DAMAGE"
            desc = "QC check failed: 1 unit of Wireless Headphones Pro (P-101) package damaged. Retail barcode packaging pull tear."
            rec = "Search nearby storage shelves for alternative replacement stock, reserve it, and continue fulfillment."
            cursor.execute('''
                INSERT INTO exceptions (id, type, severity, order_id, product_sku, quantity, detected_at, status, description, recommendation)
                VALUES (?, 'Damaged item', 'High', 'ORD-104', 'P-101', 1, datetime('now'), 'Active', ?, ?)
            ''', (exp_id, desc, rec))
            
            log_event(cursor, 'ORD-104', 'QC Failed Exception', f"Damaged unit exception raised ({exp_id}). Packing halted.")
            log_notification(cursor, "Quality scan failure reported on ORD-104.", "Critical")
            
            conn.commit()
            return jsonify({
                'message': 'QC barcode scan failed. 1 headphone unit package reported damaged. Exception EXP-104-QC-DAMAGE raised.',
                'next_step': 7
            })
            
        elif step_id == 7:
            # Resolve QC Damaged Exception & Dispatch
            # Deduct the QC exception, reserve replacement, then complete and dispatch
            # Simulate finding replacement (available stock temporary increase)
            cursor.execute("UPDATE products SET available = available + 1 WHERE sku = 'P-101'")
            
            # Now run resolution (deduct the 1 available unit and reserve it)
            cursor.execute("UPDATE products SET available = available - 1, reserved = reserved + 1 WHERE sku = 'P-101'")
            # Adjust order item: clear damaged, set allocated = 8 (7 original + 1 replacement)
            cursor.execute("UPDATE order_items SET damaged = 0, allocated = allocated + 1, status = 'Allocated' WHERE order_id = 'ORD-104' AND sku = 'P-101'")
            
            # Mark QC exception resolved
            cursor.execute("UPDATE exceptions SET status = 'Resolved', resolution_notes = 'Substituted with fresh unit from emergency buffer bin B-01.' WHERE id = 'EXP-104-QC-DAMAGE'")
            
            # Clear shortage exceptions too for final dispatch clarity
            cursor.execute("UPDATE exceptions SET status = 'Resolved', resolution_notes = 'Replenished and dispatched.' WHERE order_id = 'ORD-104'")
            
            # Deduct reserved stock (which is 8 units: 7 original + 1 replacement)
            cursor.execute("SELECT allocated FROM order_items WHERE order_id = 'ORD-104' AND sku = 'P-101'")
            alloc = cursor.fetchone()[0]
            
            cursor.execute("UPDATE products SET reserved = MAX(0, reserved - ?) WHERE sku = 'P-101'", (alloc,))
            cursor.execute("UPDATE orders SET status = 'Dispatched', risk = 'Low', risk_score = 0 WHERE id = 'ORD-104'")
            cursor.execute("UPDATE order_items SET status = 'Completed' WHERE order_id = 'ORD-104'")
            
            log_event(cursor, 'ORD-104', 'QC Exception Resolved', "Replacement unit reserved. QC checklist verified. Packing complete.")
            log_event(cursor, 'ORD-104', 'Dispatched', "Fulfillment scan complete. Handed to FedEx Ground. Tracking: TRK-DEMO8899.")
            
            log_decision(cursor, 'Exception Resolution', 'EXP-104-QC-DAMAGE', "Allocated backup unit from reserve buffer", "Rescue order from SLA delay", "SLA risk restored to healthy (0%)")
            log_decision(cursor, 'Shipment Dispatch', 'ORD-104', "Dispatched 8 units via FedEx", "Fulfillment cycle finalized", "Order marked fully completed")
            log_notification(cursor, "Demo Order ORD-104 has been successfully shipped.", "Info")
            
            conn.commit()
            return jsonify({
                'message': 'Replacement unit found and allocated. Quality exception cleared. Order ORD-104 fully dispatched via FedEx.',
                'next_step': 1
            })
            
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/picking/batch', methods=['POST'])
def optimize_picking_batch():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        log_decision(
            cursor, 
            'Route Optimization', 
            'Zone A', 
            'Batch 3 picking lists into serpentine route', 
            'Reduce travel distance and picker walk overlap in Zone A', 
            'Reduced walk travel distance by 38% (-160m)'
        )
        log_event(cursor, 'Zone A', 'Route Optimized', "Consolidated serpentine path generated. Dispatch walk savings applied.")
        log_notification(cursor, "Route Optimization applied: 38% travel savings in Zone A.", "Success")
        conn.commit()
        return jsonify({
            'success': True,
            'travel_reduction_pct': 38,
            'orders': ['ORD-1031', 'ORD-1035', 'ORD-1042'],
            'zone': 'Zone A',
            'skus': ['P-101', 'P-102', 'P-108'],
            'estimated_single_travel_m': 420,
            'estimated_batch_travel_m': 260,
            'explanation': "All 3 orders request products residing in aisle A-03 and A-05. Batching these picklists prevents the picker from returning to Zone A three separate times."
        }), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/intelligence/chat', methods=['POST'])
def query_intelligence():
    data = request.json or {}
    raw_query = data.get('query', '')
    valid, result = _validate_chat_query(raw_query)
    if not valid:
        return jsonify({'error': result}), 400
    query = result

    query_lower = query.lower()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    response = "I don't have enough warehouse data to answer that confidently."
    recommendation = None
    explanation = None
    
    try:
        import re

        # Parse health metrics dynamically
        cursor.execute("SELECT COUNT(*) FROM orders")
        total_orders = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM orders WHERE status = 'Dispatched'")
        dispatched_orders = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM orders WHERE risk IN ('High', 'Critical') AND status != 'Dispatched'")
        orders_at_risk = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM products WHERE available <= reorder_level AND available > 0")
        low_stock_skus = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM products WHERE available = 0")
        out_of_stock_skus = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM exceptions WHERE status = 'Active'")
        active_exceptions = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM orders WHERE status = 'QC'")
        pending_dispatch = cursor.fetchone()[0]
        
        f_rate = (dispatched_orders / total_orders * 100) if total_orders > 0 else 92.0
        sla_perf = max(60.0, 100.0 - (orders_at_risk * 3.0))
        inv_perf = max(50.0, 100.0 - (low_stock_skus * 2.0) - (out_of_stock_skus * 4.0))
        exc_perf = max(40.0, 100.0 - (active_exceptions * 3.5))
        
        cursor.execute("SELECT COUNT(*) FROM decision_log WHERE type = 'Route Optimization' OR decision LIKE '%Optimize%'")
        opt_count = cursor.fetchone()[0]
        pick_perf = min(98.0, 78.0 + opt_count * 10.0)
        
        disp_perf = max(60.0, 100.0 - (pending_dispatch * 3.0))
        
        health = int(
            0.30 * f_rate +
            0.20 * sla_perf +
            0.20 * inv_perf +
            0.15 * exc_perf +
            0.07 * pick_perf +
            0.08 * disp_perf
        )
        health = min(max(health, 60), 100)
        
        # Check for ORD-104 risk details specifically
        if 'ord-104' in query_lower:
            response = "Recommended decision:\nAllocate the available 7 units to the critical order ORD-104 and hold the lower-priority competing order. Trigger replenishment for the shortage."
            recommendation = {
                "type": "CRITICAL_ALLOCATION_CONFLICT",
                "title": "🎯 Recommended Action",
                "action": "Allocate 7 units to ORD-104",
                "reason": "Critical priority + limited inventory",
                "entity_id": "ORD-104",
                "action_label": "Apply Recommendation",
                "alternative_label": "Simulate Alternative"
            }
            explanation = {
                "what": "Stock shortage exception EXP-104-SHORT raised on P-101.",
                "why": "Order ORD-104 requires 10 units of Wireless Headphones Pro (P-101) but only 7 are physically available.",
                "how": "Allocate available 7 units to critical order ORD-104 and place low-priority ORD-118 on hold.",
                "impact": "Expedites delivery for premium customer Apex Systems while raising safety replenishment reorder."
            }

        # Check for specific order risk or details (e.g. ORD-118, ORD-2151, etc.)
        elif re.search(r'ord-\d+', query_lower):
            order_id = re.search(r'ord-\d+', query_lower).group(0).upper()
            if order_id == 'ORD-2151':
                response = "ORD-2151 is at high SLA risk. The remaining SLA time is 42 minutes, while the estimated completion time is 65 minutes. Prioritizing it reduces the probability of a delayed shipment."
                recommendation = {
                    "type": "PRIORITIZE_ORDER",
                    "title": "🎯 Recommended Action",
                    "action": "Prioritize ORD-2151 for picking",
                    "reason": "SLA deadline risk (42m remaining vs 65m est. completion)",
                    "entity_id": "ORD-2151",
                    "action_label": "Prioritize ORD-2151",
                    "alternative_label": "View Order"
                }
            else:
                cursor.execute("SELECT status, priority, risk, risk_score, customer, value FROM orders WHERE id = ?", (order_id,))
                order_row = cursor.fetchone()
                if order_row:
                    status, priority, risk, risk_score, customer, value = order_row
                    score, is_at_risk, reasons = decision_engine.calculate_sla_risk(conn, order_id)
                    reasons_str = " ".join(reasons) if reasons else "No specific issues detected."
                    response = f"Order {order_id} (Customer: '{customer}', Value: ${value:,.2f}) is currently in '{status}' stage. Current risk status is '{risk}' (Score: {risk_score}%).\n\nDiagnostic reasons:\n- {reasons_str}"
                    
                    if status == 'Allocated' and risk == 'High':
                        cursor.execute("SELECT id, description FROM exceptions WHERE order_id = ? AND status = 'Active'", (order_id,))
                        exc_row = cursor.fetchone()
                        if exc_row:
                            exc_id, exc_desc = exc_row
                            response += f"\n\nActive exception detected: {exc_desc}."
                else:
                    response = f"I couldn't find order '{order_id}' in the database."

        # Risk checks (e.g. Which orders are currently at risk?)
        elif 'risk' in query_lower:
            cursor.execute("SELECT COUNT(*) FROM orders WHERE risk IN ('High', 'Critical') AND status != 'Dispatched'")
            risk_count = cursor.fetchone()[0]
            
            # Check if ORD-2151 exists in database, or find the highest risk order
            cursor.execute("SELECT id, customer FROM orders WHERE status != 'Dispatched' AND risk IN ('High', 'Critical') ORDER BY risk_score DESC LIMIT 1")
            highest = cursor.fetchone()
            highest_id = highest[0] if highest else "ORD-2151"
            
            response = f"{risk_count} orders are currently at SLA risk.\n\nThe highest-risk order is {highest_id}.\nIt has approximately 42 minutes of SLA time remaining, while the estimated completion time is 65 minutes.\n\nRecommended action:\nPrioritize {highest_id} for picking."
            
            recommendation = {
                "type": "PRIORITIZE_ORDER",
                "title": "🎯 Recommended Action",
                "action": f"Prioritize {highest_id} for picking",
                "reason": "SLA remaining time (42m) is less than estimated completion time (65m)",
                "entity_id": highest_id,
                "action_label": f"Prioritize {highest_id}",
                "alternative_label": "View Order"
            }
            explanation = {
                "what": f"{risk_count} orders are nearing their SLA thresholds.",
                "why": "High picker congestion and pending items allocation delays.",
                "how": f"Prioritize picking tickets for at-risk orders like {highest_id}.",
                "impact": "Reduces probability of delayed shipment and SLA breach fines."
            }

        # Order prioritization candidate query
        elif 'prioritize' in query_lower or 'priority' in query_lower:
            cursor.execute("SELECT id, customer FROM orders WHERE status = 'New' ORDER BY risk_score DESC LIMIT 1")
            cand = cursor.fetchone()
            target_id = cand[0] if cand else "ORD-2151"
            
            response = f"Order {target_id} is the highest priority candidate. It has approximately 42 minutes of SLA time remaining. Prioritizing it reduces the probability of a delayed shipment."
            recommendation = {
                "type": "PRIORITIZE_ORDER",
                "title": "🎯 Recommended Action",
                "action": f"Prioritize {target_id} for picking",
                "reason": "SLA deadline risk (42m remaining vs 65m est. completion)",
                "entity_id": target_id,
                "action_label": f"Prioritize {target_id}",
                "alternative_label": "View Order"
            }

        # Replenishment checks
        elif any(k in query_lower for k in ['replenish', 'reorder', 'safety minimum', 'low stock', 'low shock', 'stock is low', 'shock is low']):
            cursor.execute("SELECT COUNT(*) FROM products WHERE available <= reorder_level")
            repl_count = cursor.fetchone()[0]
            
            response = f"{repl_count} SKUs are below their safety minimum.\n\nP-102 and P-105 require immediate attention because their available stock is 0.\n\nRecommended action:\nGenerate replenishment requests for the affected SKUs."
            
            recommendation = {
                "type": "LOW_STOCK",
                "title": "📦 Safety Replenishment Reorder",
                "action": "Generate replenishment requests",
                "reason": "SKUs P-102 and P-105 are at 0 available stock",
                "entity_id": "P-102",
                "action_label": "Approve Reorder",
                "alternative_label": "View Low Stock"
            }
            explanation = {
                "what": f"{repl_count} product items fell below minimum safety stock levels.",
                "why": "High outbound order volume for smart speakers and wireless mice.",
                "how": "Approve replenishment reorders to trigger restocking.",
                "impact": "Replenishes stock levels to prevent order delays and stockouts."
            }

        # Out of stock specific checks (e.g. SKU P-102)
        elif re.search(r'p-\d+', query_lower):
            sku = re.search(r'p-\d+', query_lower).group(0).upper()
            cursor.execute("SELECT name, available, reserved, damaged, reorder_level FROM products WHERE sku = ?", (sku,))
            prod = cursor.fetchone()
            if prod:
                name, available, reserved, damaged, reorder_level = prod
                response = f"Product {sku} ({name}) has available stock of {available} units. Reserved units for orders: {reserved}. Damaged units in QC: {damaged}. Minimum safety level: {reorder_level}."
                if available == 0:
                    response += f"\nSince the available stock is 0, it is fully stock-outed. A replenishment reorder is required."
                    recommendation = {
                        "type": "LOW_STOCK",
                        "title": "📦 Safety Replenishment Reorder",
                        "action": f"Reorder safety stock for SKU {sku}",
                        "reason": f"Available stock is 0, below threshold of {reorder_level}.",
                        "entity_id": sku,
                        "action_label": "Approve Reorder",
                        "alternative_label": "View Low Stock"
                    }
            else:
                response = f"I couldn't find a product with SKU '{sku}' in the warehouse database."

        elif 'out of stock' in query_lower:
            cursor.execute("SELECT sku, name FROM products WHERE available = 0")
            out_items = cursor.fetchall()
            if out_items:
                items_str = ", ".join([f"{item[0]} ({item[1]})" for item in out_items])
                response = f"The following products are currently out of stock: {items_str}."
            else:
                response = "No products are currently out of stock."

        # Bottleneck / picking slow checks
        elif any(k in query_lower for k in ['bottleneck', 'picking slow', 'slow', 'picking time', 'reduce picking']):
            response = "Zone A currently has a picking bottleneck.\n\nMultiple orders are sending pickers through the same aisles.\nBatching adjacent picking lists can reduce unnecessary travel.\n\nCurrent estimated travel:\n420m\n\nOptimized travel:\n260m\n\nPotential reduction:\n38%"
            
            recommendation = {
                "type": "PICKING_BOTTLENECK",
                "title": "⚡ Picking Route Optimization",
                "action": "Optimize Zone A Picking",
                "reason": "Serpentine route optimization for Zone A",
                "entity_id": "Zone A",
                "action_label": "Optimize Zone A Picking",
                "alternative_label": "Simulate Alternative"
            }
            explanation = {
                "what": "Zone A picking congestion increased.",
                "why": "Multiple orders are sending pickers through the same aisles.",
                "how": "Batch adjacent picking lists into consolidated route.",
                "impact": "Reduce picker travel distance by approximately 38%."
            }

        # Exceptions checks
        elif 'exception' in query_lower or 'attention' in query_lower:
            cursor.execute("SELECT id, type, severity, order_id, status, description FROM exceptions WHERE status = 'Active'")
            exc_list = cursor.fetchall()
            
            response = "There are 3 unresolved exceptions that need immediate attention:\n- EXP-001: Damaged items on ORD-1025\n- EXP-002: Missing stock on P-105\n- EXP-009: Stock shortage on ORD-1031"
            
            recommendation = {
                "type": "CRITICAL_ALLOCATION_CONFLICT",
                "title": "🎯 Recommended Action",
                "action": "Resolve Exception EXP-001",
                "reason": "Damaged unit on bench #3",
                "entity_id": "EXP-001",
                "action_label": "Apply Swap Buffer",
                "alternative_label": "Simulate Alternative"
            }
            explanation = {
                "what": "Unresolved operational issues flagged in exceptions log.",
                "why": "Quality scans failed or pickers reported missing items at bins.",
                "how": "Perform manual swap substitutions or stock count audits.",
                "impact": "Clears bottlenecks and releases orders to packing workbench."
            }

        # Warehouse health checks
        elif 'health' in query_lower:
            cursor.execute("SELECT COUNT(*) FROM orders WHERE risk IN ('High', 'Critical') AND status != 'Dispatched'")
            risk_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM products WHERE available <= reorder_level")
            repl_count = cursor.fetchone()[0]
            
            response = f"Today's Warehouse Health Score is {health}/100.\n\nOperational metrics are stable with {risk_count} orders at risk and {repl_count} items requiring replenishment."

        # What should I do right now
        elif any(k in query_lower for k in ['right now', 'what to do', 'what should i do', 'action']):
            response = (
                "1. 🔴 Resolve ORD-104 allocation conflict\n"
                "Problem: Stock shortage exception EXP-104-SHORT on P-101.\n"
                "Reason: Competing order ORD-118 reserving headphones inventory.\n"
                "Recommended action: Allocate available 7 units to ORD-104 and place ORD-118 on hold.\n"
                "Expected impact: Cuts SLA delay risk by 70% for Apex Systems order.\n\n"
                "2. 🟠 Prioritize SLA-risk picking\n"
                "Problem: 4 orders nearing deadlines in picking queue.\n"
                "Reason: High picker overlap in aisle A-03.\n"
                "Recommended action: Batch picking lists into consolidated serpentine route.\n"
                "Expected impact: Reduces walk travel distance by 38% (-160m).\n\n"
                "3. 🟡 Replenish low-stock SKUs\n"
                "Problem: 5 SKUs below safety thresholds.\n"
                "Reason: 0 available stock on P-102 and P-105.\n"
                "Recommended action: Approve safety replenishment reorders of 30 units.\n"
                "Expected impact: Prevents stockouts and secures inventory continuity."
            )
            recommendation = {
                "type": "CRITICAL_ALLOCATION_CONFLICT",
                "title": "🎯 Recommended Action",
                "action": "Resolve ORD-104 allocation conflict",
                "reason": "Apex Systems critical delivery at risk",
                "entity_id": "ORD-104",
                "action_label": "Apply Recommendation",
                "alternative_label": "Simulate Alternative"
            }
            explanation = {
                "what": "Active allocation conflicts and stockouts are pending operator resolution.",
                "why": "High-priority client demands exceeded emergency stock counts.",
                "how": "Follow prioritized task list actions 1, 2, and 3.",
                "impact": "Restores operations health, optimizes paths, and avoids SLA breaches."
            }
            
        else:
            # Default fallback when no specific keywords match
            response = (
                f"I am here to help you coordinate warehouse operations.\n\n"
                f"Current Status:\n"
                f"- Warehouse Health Score: {health}/100\n"
                f"- Exceptions: {active_exceptions} active anomaly/shortage(s)\n"
                f"- Orders: {orders_at_risk} at SLA risk\n"
                f"- Inventory: {low_stock_skus} low stock SKU(s) (Safety line breached)\n\n"
                f"Recommended Next Steps:\n"
                f"1. Resolve the critical headphones shortage exception on order ORD-104.\n"
                f"2. Optimize picker serpentine routing to clear the Zone A bottleneck.\n\n"
                f"Feel free to ask me questions like: 'What should I do right now?', 'Which orders are at risk?', 'Which products need replenishment?', or 'Optimize picking routes'."
            )
            recommendation = {
                "type": "CRITICAL_ALLOCATION_CONFLICT",
                "title": "🎯 Recommended Action",
                "action": "Resolve ORD-104 allocation conflict",
                "reason": "Apex Systems critical delivery at risk",
                "entity_id": "ORD-104",
                "action_label": "Apply Recommendation",
                "alternative_label": "Simulate Alternative"
            }
            explanation = {
                "what": "Unresolved allocation conflicts and stockouts are pending operator resolution.",
                "why": "Customer demand for headphones exceeds available stock.",
                "how": "Apply priority reallocation decision to ORD-104 and trigger reorders.",
                "impact": "Restores operations health, optimizes paths, and avoids SLA breaches."
            }
            
    except Exception as e:
        response = f"An error occurred in the cognitive decision engine: {str(e)}"
    finally:
        conn.close()
        
    return jsonify({
        'response': response,
        'recommendation': recommendation,
        'explanation': explanation
    }), 200


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path.startswith("api/") or path.startswith("api"):
        return jsonify({"error": "Not Found"}), 404
    
    file_path = frontend_dist_dir / path
    if path and file_path.exists() and file_path.is_file():
        from flask import send_from_directory
        return send_from_directory(str(frontend_dist_dir), path)
    
    index_file = frontend_dist_dir / "index.html"
    if not index_file.exists():
        return (
            "<h3>WARENEX Frontend Not Built Yet</h3>"
            "<p>Please build the frontend first by running <code>npm run build</code> in the <code>frontend</code> directory.</p>"
        ), 500
    
    from flask import send_file
    return send_file(str(index_file))


if __name__ == '__main__':
    # Initialize DB on start
    seed_database()
    # Check port setting
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

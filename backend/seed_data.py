import sqlite3
import datetime
import random
from .database import get_db_connection
from .models import create_tables

def seed_database():
    # Make sure tables exist
    create_tables()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Clear existing data
    cursor.execute("DELETE FROM order_items")
    cursor.execute("DELETE FROM orders")
    cursor.execute("DELETE FROM products")
    cursor.execute("DELETE FROM exceptions")
    cursor.execute("DELETE FROM pickers")
    cursor.execute("DELETE FROM picking_batches")
    cursor.execute("DELETE FROM reorder_recommendations")
    cursor.execute("DELETE FROM workflow_events")
    cursor.execute("DELETE FROM notifications")
    cursor.execute("DELETE FROM decision_log")
    
    now = datetime.datetime.now()
    
    # 1. Products (30 Products)
    # (sku, name, category, location, available, reserved, damaged, reorder_level, cost, price)
    products_data = [
        ('P-101', 'Wireless Headphones Pro', 'Electronics', 'A-03-B-12', 7, 0, 0, 15, 45.0, 99.99),
        ('P-102', 'Smart Bluetooth Speaker', 'Electronics', 'A-05-A-03', 4, 2, 0, 10, 25.0, 59.99),
        ('P-103', 'Ultra USB-C Charging Cable', 'Accessories', 'B-01-C-05', 120, 15, 2, 30, 3.5, 12.99),
        ('P-104', 'RGB Mechanical Keyboard', 'Electronics', 'A-01-D-02', 18, 5, 0, 10, 40.0, 89.99),
        ('P-105', 'Ergonomic Wireless Mouse', 'Electronics', 'A-02-B-08', 3, 2, 1, 12, 15.0, 39.99),
        ('P-106', 'UltraWide 4K Gaming Monitor', 'Electronics', 'D-01-A-01', 0, 0, 0, 5, 180.0, 349.99),
        ('P-107', 'Active Noise Cancelling Earbuds', 'Electronics', 'A-03-A-01', 25, 8, 0, 15, 30.0, 79.99),
        ('P-108', 'HD Web Camera 1080p', 'Electronics', 'A-04-C-10', 14, 4, 1, 10, 20.0, 49.99),
        ('P-109', 'Leather Office Chair', 'Furniture', 'E-02-A-01', 6, 2, 0, 5, 75.0, 150.00),
        ('P-110', 'Adjustable Standing Desk', 'Furniture', 'E-01-B-04', 5, 3, 0, 4, 120.0, 299.99),
        ('P-111', 'Portable Laptop Stand', 'Accessories', 'B-02-A-01', 42, 10, 0, 20, 8.0, 24.99),
        ('P-112', 'Universal Travel Adapter', 'Accessories', 'B-03-D-09', 65, 0, 0, 15, 6.0, 19.99),
        ('P-113', 'Fast Wireless Charger Pad', 'Accessories', 'B-01-A-02', 28, 5, 0, 15, 9.0, 29.99),
        ('P-114', 'Multi-Device Bluetooth Keyboard', 'Electronics', 'A-01-C-01', 9, 3, 0, 10, 18.0, 45.00),
        ('P-115', 'Solid State Drive SSD 1TB', 'Storage', 'C-02-B-04', 35, 12, 0, 20, 55.0, 119.99),
        ('P-116', 'External Hard Drive 2TB', 'Storage', 'C-01-A-05', 18, 4, 0, 12, 45.0, 89.99),
        ('P-117', 'MicroSD Card 256GB', 'Storage', 'C-03-D-02', 88, 20, 0, 30, 12.0, 29.99),
        ('P-118', 'Dual-Band Wi-Fi Router', 'Networking', 'F-01-A-03', 12, 2, 0, 8, 35.0, 79.99),
        ('P-119', 'Cat6 Ethernet Cable 15ft', 'Networking', 'F-02-B-01', 110, 10, 0, 25, 2.0, 8.99),
        ('P-120', 'Smart Home Smart Plug (4-pack)', 'Home', 'G-01-C-02', 17, 3, 0, 10, 14.0, 34.99),
        ('P-121', 'LED Desk Lamp with USB Port', 'Home', 'G-02-A-05', 22, 5, 0, 10, 11.0, 27.99),
        ('P-122', 'Thermos Stainless Steel Flask', 'Home', 'G-03-B-01', 34, 0, 0, 15, 7.5, 19.99),
        ('P-123', 'Minimalist Laptop Backpack', 'Apparel', 'H-01-C-03', 19, 6, 1, 10, 22.0, 55.00),
        ('P-124', 'Polarized Sports Sunglasses', 'Apparel', 'H-02-A-02', 8, 2, 0, 10, 12.0, 29.99),
        ('P-125', 'Digital Kitchen Scale', 'Home', 'G-04-D-01', 40, 0, 0, 12, 5.0, 14.99),
        ('P-126', 'Waterproof Running Watch', 'Apparel', 'H-03-B-07', 6, 2, 0, 8, 40.0, 89.99),
        ('P-127', 'USB Microphone Stand Kit', 'Audio', 'A-03-C-02', 15, 2, 0, 8, 24.0, 59.99),
        ('P-128', 'Studio Monitor Headphones', 'Audio', 'A-03-D-01', 11, 4, 0, 10, 38.0, 85.00),
        ('P-129', 'Acoustic Foam Panels (12-pack)', 'Audio', 'A-04-A-04', 45, 0, 0, 15, 10.0, 29.99),
        ('P-130', 'Heavy Duty Power Strip', 'Accessories', 'B-04-C-03', 30, 2, 0, 10, 8.0, 19.99)
    ]
    
    cursor.executemany('''
        INSERT INTO products (sku, name, category, location, available, reserved, damaged, reorder_level, cost, price)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', products_data)
    
    # 2. Pickers (5 Pickers)
    pickers_data = [
        ('John Doe', 'Active', 'Zone A', None),
        ('Jane Smith', 'Active', 'Zone B', None),
        ('Robert Chen', 'Idle', 'Zone C', None),
        ('Sarah Jenkins', 'Active', 'Zone E', None),
        ('Michael Patel', 'Idle', 'Zone G', None)
    ]
    cursor.executemany('''
        INSERT INTO pickers (name, status, zone, active_batch_id)
        VALUES (?, ?, ?, ?)
    ''', pickers_data)
    
    # 3. Orders (50 Orders)
    # We will generate a structured set of orders including our critical scenario:
    # ORD-104: Wireless Headphones, 10 units requested, available = 7. CRITICAL Priority.
    # ORD-118: Wireless Headphones, 5 units requested. LOW Priority.
    
    customers = [
        'TechVibe Retail', 'Gizmo Express', 'Apex Systems', 'Prime Supplies', 'ByteSize Corp',
        'NextGen Logics', 'Nova Distributors', 'Core Solutions', 'Global Goods', 'Elite Gadgets'
    ]
    
    orders = []
    order_items = []
    
    # Scenario Specific Order 1: ORD-104 (CRITICAL Shortage Edge Case)
    deadline_104 = (now + datetime.timedelta(hours=2)).strftime('%Y-%m-%d %H:%M:%S')
    orders.append(('ORD-104', 'Apex Systems', 999.90, 'Critical', 92, deadline_104, 'New', 'High', 85, now.strftime('%Y-%m-%d %H:%M:%S')))
    order_items.append(('ORD-104', 'P-101', 10, 0, 0, 0, 0, 'Pending'))
    
    # Scenario Specific Order 2: ORD-118 (LOW Priority Competing Order)
    deadline_118 = (now + datetime.timedelta(hours=18)).strftime('%Y-%m-%d %H:%M:%S')
    orders.append(('ORD-118', 'Core Solutions', 499.95, 'Low', 35, deadline_118, 'New', 'Low', 0, now.strftime('%Y-%m-%d %H:%M:%S')))
    order_items.append(('ORD-118', 'P-101', 5, 0, 0, 0, 0, 'Pending'))
    
    # Let's add other orders representing different states:
    # Dispatched orders (approx 150)
    for i in range(1, 151):
        order_id = f'ORD-{2000+i}'
        customer = random.choice(customers)
        status = 'Dispatched'
        val = round(random.uniform(50.0, 600.0), 2)
        priority = random.choice(['Low', 'Medium', 'High'])
        score = {'Low': 25, 'Medium': 55, 'High': 80}[priority]
        time_created = (now - datetime.timedelta(days=random.randint(1, 5), hours=random.randint(1, 23))).strftime('%Y-%m-%d %H:%M:%S')
        time_deadline = (now - datetime.timedelta(days=random.randint(0, 3))).strftime('%Y-%m-%d %H:%M:%S')
        orders.append((order_id, customer, val, priority, score, time_deadline, status, 'Low', 0, time_created))
        
        # Random items for these dispatched orders
        sku = random.choice(products_data)[0]
        qty = random.randint(1, 4)
        order_items.append((order_id, sku, qty, qty, qty, qty, 0, 'Completed'))
        
    # SLA Risk orders (approx 4)
    for i in range(151, 155):
        order_id = f'ORD-{2000+i}'
        customer = random.choice(customers)
        status = 'Picking'
        val = round(random.uniform(150.0, 800.0), 2)
        priority = 'High'
        score = 88
        time_created = (now - datetime.timedelta(hours=4)).strftime('%Y-%m-%d %H:%M:%S')
        # Very close deadline - SLA risk!
        time_deadline = (now + datetime.timedelta(minutes=random.randint(15, 45))).strftime('%Y-%m-%d %H:%M:%S')
        orders.append((order_id, customer, val, priority, score, time_deadline, status, 'High', 90, time_created))
        
        # Items
        sku = random.choice(products_data)[0]
        qty = random.randint(2, 5)
        # Marked as picking (allocated but not yet fully picked)
        order_items.append((order_id, sku, qty, qty, 0, 0, 0, 'Picking'))

    # Damaged/Exceptions orders (approx 2)
    # One specific damaged item order: ORD-1025
    orders.append(('ORD-1025', 'TechVibe Retail', 300.00, 'High', 78, (now + datetime.timedelta(hours=4)).strftime('%Y-%m-%d %H:%M:%S'), 'Packing', 'Medium', 40, now.strftime('%Y-%m-%d %H:%M:%S')))
    order_items.append(('ORD-1025', 'P-103', 10, 10, 9, 0, 1, 'Exception')) # 1 unit damaged in QC
    
    # Missing item order: ORD-1026
    orders.append(('ORD-1026', 'Gizmo Express', 120.00, 'Medium', 60, (now + datetime.timedelta(hours=6)).strftime('%Y-%m-%d %H:%M:%S'), 'Picking', 'Medium', 30, now.strftime('%Y-%m-%d %H:%M:%S')))
    order_items.append(('ORD-1026', 'P-105', 2, 2, 1, 0, 0, 'Exception')) # 1 unit missing during picking
    
    # Other normal orders in pipeline stages (New, Prioritized, Allocated, Picking, Packing, QC, Ready to Dispatch)
    stages = [
        ('New', 1),
        ('Prioritized', 1),
        ('Allocated', 1),
        ('Picking', 1),
        ('Packing', 1),
        ('QC', 1),
        ('Ready to Dispatch', 1)
    ]
    
    order_id_counter = 1160
    for stage, count in stages:
        for _ in range(count):
            order_id = f'ORD-{order_id_counter}'
            order_id_counter += 1
            customer = random.choice(customers)
            priority = random.choice(['Low', 'Medium', 'High', 'Critical'])
            score = {'Low': random.randint(10, 49), 'Medium': random.randint(50, 74), 'High': random.randint(75, 89), 'Critical': random.randint(90, 100)}[priority]
            
            val = 0.0
            time_created = (now - datetime.timedelta(hours=random.randint(1, 10))).strftime('%Y-%m-%d %H:%M:%S')
            time_deadline = (now + datetime.timedelta(hours=random.randint(3, 24))).strftime('%Y-%m-%d %H:%M:%S')
            
            # Select 1-3 random items and calculate total value
            items_for_order = []
            num_items = random.randint(1, 3)
            for _ in range(num_items):
                p = random.choice(products_data)
                qty = random.randint(1, 5)
                val += p[9] * qty
                items_for_order.append((order_id, p[0], qty))
                
            val = round(val, 2)
            # Map database status
            db_status = stage if stage != 'Ready to Dispatch' else 'QC'
            
            orders.append((order_id, customer, val, priority, score, time_deadline, db_status, 'Low', 0, time_created))
            
            # Add order items based on stage
            for oid, sku, qty in items_for_order:
                allocated = qty if stage not in ['New', 'Prioritized'] else 0
                picked = qty if stage in ['Packing', 'QC', 'Ready to Dispatch'] else 0
                packed = qty if stage in ['QC', 'Ready to Dispatch'] else 0
                item_status = 'Pending'
                if stage == 'Prioritized':
                    item_status = 'Prioritized'
                elif stage == 'Allocated':
                    item_status = 'Allocated'
                elif stage == 'Picking':
                    item_status = 'Picking'
                elif stage == 'Packing':
                    item_status = 'Packing'
                elif stage in ['QC', 'Ready to Dispatch']:
                    item_status = 'Packed'
                    
                order_items.append((oid, sku, qty, allocated, picked, packed, 0, item_status))
                
    # Insert orders
    cursor.executemany('''
        INSERT INTO orders (id, customer, value, priority, priority_score, sla_deadline, status, risk, risk_score, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', orders)
    
    # Insert order items
    cursor.executemany('''
        INSERT INTO order_items (order_id, sku, quantity, allocated, picked, packed, damaged, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', order_items)
    
    # Reserve stock for active allocations in seed data
    for item in order_items:
        oid, sku, qty, allocated, picked, packed, dmg, status = item
        if allocated > 0:
            cursor.execute('''
                UPDATE products 
                SET available = MAX(0, available - ?),
                    reserved = reserved + ?
                WHERE sku = ?
            ''', (allocated, allocated, sku))
            
    # 4. Exceptions (10 Exceptions of various severities and stages)
    # (id, type, severity, order_id, product_sku, quantity, detected_at, status, description, recommendation, resolution_notes)
    exceptions_data = [
        ('EXP-001', 'Damaged item', 'High', 'ORD-1025', 'P-103', 1, (now - datetime.timedelta(minutes=45)).strftime('%Y-%m-%d %H:%M:%S'), 'Active', 
         '1 unit of Ultra USB-C Charging Cable (P-103) failed physical visual scan in QC (torn sleeving).', 
         'Search nearby inventory for replacement and substitute.', None),
        
        ('EXP-002', 'Missing item', 'Medium', 'ORD-1026', 'P-105', 1, (now - datetime.timedelta(hours=1)).strftime('%Y-%m-%d %H:%M:%S'), 'Active', 
         'Picker Robert Chen reported 1 unit of Ergonomic Wireless Mouse (P-105) missing from bin location A-02-B-08.', 
         'Perform cycle count of bin and assign replacement from backup location.', None),
        
        ('EXP-003', 'Stock shortage', 'Critical', 'ORD-104', 'P-101', 3, now.strftime('%Y-%m-%d %H:%M:%S'), 'Active', 
         'Order ORD-104 requires 10 units of Wireless Headphones Pro (P-101) but only 7 units are available.', 
         'Allocate available 7 units to ORD-104, put ORD-118 on hold, and recommend reorder of 30 units.', None),
        
        ('EXP-004', 'Picking delay', 'Low', 'ORD-1021', 'P-123', 0, (now - datetime.timedelta(hours=2)).strftime('%Y-%m-%d %H:%M:%S'), 'Resolved', 
         'Picking ticket has been active for more than 90 minutes. Normal picker transit delay.', 
         'Remind Picker John Doe or batch with nearby picking lists.', 'Route batched, picking duration minimized.'),
          
        ('EXP-005', 'Packing issue', 'Medium', 'ORD-1035', 'P-108', 1, (now - datetime.timedelta(hours=3)).strftime('%Y-%m-%d %H:%M:%S'), 'Resolved', 
         '1 unit of Web Camera (P-108) had damaged external retail box.', 
         'Re-pack with bubble wrap and new box.', 'Box replaced and repackaged successfully.'),
          
        ('EXP-006', 'Quality failure', 'High', 'ORD-1038', 'P-123', 1, (now - datetime.timedelta(hours=4)).strftime('%Y-%m-%d %H:%M:%S'), 'Resolved', 
         'Backpack zipper failed QC checklist pull test.', 
         'Flag exception, return item to damaged stock, and allocate new unit.', 'Substituted zipper sleeve.'),
          
        ('EXP-007', 'Dispatch delay', 'High', 'ORD-1002', 'P-111', 0, (now - datetime.timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S'), 'Resolved', 
         'FedEx carrier pickup missed scheduled departure window.', 
         'Re-route shipment via DHL Express.', 'Shipped via DHL. Tracking number provided.'),
          
        ('EXP-008', 'Inventory mismatch', 'Medium', 'None', 'P-114', 2, (now - datetime.timedelta(hours=6)).strftime('%Y-%m-%d %H:%M:%S'), 'Resolved', 
         'Physical count mismatch. Database indicates 9 available, physical count shows 7.', 
         'Run inventory reconciliation adjust-down and audit log.', 'Reconciled mismatch count to 7.'),
          
        ('EXP-009', 'Stock shortage', 'High', 'ORD-1031', 'P-102', 1, (now - datetime.timedelta(hours=5)).strftime('%Y-%m-%d %H:%M:%S'), 'Active', 
         'Order ORD-1031 requires 5 units of Bluetooth Speaker (P-102), but stock level is 4.', 
         'Allocate 4 units, delay fulfillment, and trigger replenishment.', None),
          
        ('EXP-010', 'Packing issue', 'Low', 'ORD-1042', 'P-117', 0, (now - datetime.timedelta(hours=8)).strftime('%Y-%m-%d %H:%M:%S'), 'Resolved', 
         'Incorrect shipping label generated for region code.', 
         'Regenerate and print barcode label.', 'Label regenerated and applied.')
    ]
    cursor.executemany('''
        INSERT INTO exceptions (id, type, severity, order_id, product_sku, quantity, detected_at, status, description, recommendation, resolution_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', exceptions_data)
    
    # Mark damaged count on products based on active exceptions
    for exp in exceptions_data:
        eid, etype, eseverity, eorder, esku, eqty, edetected, estatus, edesc, erec, eres = exp
        if estatus == 'Active' and etype == 'Damaged item' and esku != 'None':
            cursor.execute('''
                UPDATE products 
                SET damaged = damaged + ?
                WHERE sku = ?
            ''', (eqty, esku))
            
    # 5. Reorder Recommendations
    reorder_recs = [
        ('P-101', 7, 15, 25, 30, 'Pending', now.strftime('%Y-%m-%d %H:%M:%S')),
        ('P-102', 4, 10, 15, 20, 'Pending', now.strftime('%Y-%m-%d %H:%M:%S')),
        ('P-105', 3, 12, 18, 25, 'Pending', now.strftime('%Y-%m-%d %H:%M:%S')),
        ('P-106', 0, 5, 12, 15, 'Pending', now.strftime('%Y-%m-%d %H:%M:%S')),
        ('P-126', 6, 8, 10, 15, 'Pending', now.strftime('%Y-%m-%d %H:%M:%S'))
    ]
    cursor.executemany('''
        INSERT INTO reorder_recommendations (sku, current_stock, reorder_level, estimated_demand, recommended_qty, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', reorder_recs)
    
    # 6. Workflow Events (Audit Trail for ORD-104 and others)
    events_data = [
        ('ORD-104', 'Creation', 'Order submitted by customer Apex Systems.', (now - datetime.timedelta(minutes=10)).strftime('%Y-%m-%d %H:%M:%S')),
        ('ORD-104', 'Priority Score', 'Engine computed Priority Score: 92/100 (Critical SLA Urgency & Premium Tier).', (now - datetime.timedelta(minutes=9)).strftime('%Y-%m-%d %H:%M:%S')),
        ('ORD-104', 'Stock Shortage Exception', 'System detected inventory shortage: 10 units requested, 7 available.', (now - datetime.timedelta(minutes=8)).strftime('%Y-%m-%d %H:%M:%S')),
        
        ('ORD-1025', 'Creation', 'Order submitted by TechVibe Retail.', (now - datetime.timedelta(hours=2)).strftime('%Y-%m-%d %H:%M:%S')),
        ('ORD-1025', 'Priority Score', 'Priority Score: 78/100 (High Priority).', (now - datetime.timedelta(hours=2, minutes=58)).strftime('%Y-%m-%d %H:%M:%S')),
        ('ORD-1025', 'Allocation', '10 units of Ultra USB-C Charging Cable successfully allocated.', (now - datetime.timedelta(hours=2, minutes=55)).strftime('%Y-%m-%d %H:%M:%S')),
        ('ORD-1025', 'Picking', 'Order items picked from bin location B-01-C-05.', (now - datetime.timedelta(hours=1, minutes=30)).strftime('%Y-%m-%d %H:%M:%S')),
        ('ORD-1025', 'QC Damaged Exception', '1 unit found damaged during packing quality scan.', (now - datetime.timedelta(minutes=45)).strftime('%Y-%m-%d %H:%M:%S')),
    ]
    cursor.executemany('''
        INSERT INTO workflow_events (order_id, event_type, description, created_at)
        VALUES (?, ?, ?, ?)
    ''', events_data)
    
    # 7. Notifications
    notifs_data = [
        ('Critical stock shortage detected for Order #ORD-104. Action required.', 'Critical', 0, now.strftime('%Y-%m-%d %H:%M:%S')),
        ('Low stock warning for SKU P-102 (Smart Bluetooth Speaker). Stock is 4 (Reorder level: 10).', 'Warning', 0, now.strftime('%Y-%m-%d %H:%M:%S')),
        ('Exception: 1 unit damaged during packing QC on Order #ORD-1025.', 'Critical', 0, now.strftime('%Y-%m-%d %H:%M:%S')),
        ('Order #ORD-1011 (Value $512.50) successfully dispatched.', 'Info', 1, (now - datetime.timedelta(hours=1)).strftime('%Y-%m-%d %H:%M:%S')),
        ('Zone A picking bottleneck identified. Route optimization recommended.', 'Info', 0, now.strftime('%Y-%m-%d %H:%M:%S'))
    ]
    cursor.executemany('''
        INSERT INTO notifications (message, severity, read, created_at)
        VALUES (?, ?, ?, ?)
    ''', notifs_data)
    
    # 8. Decision Log
    decisions_data = [
        ('Stock Allocation', 'ORD-1005', 'Allocated 3 units of Ergonomic Mouse (P-105)', 'High order priority and sufficient stock.', 'Fulfill SLA on time.', 'Applied', (now - datetime.timedelta(hours=4)).strftime('%Y-%m-%d %H:%M:%S')),
        ('Reorder Recommendation', 'P-106', 'Proposal created for 15 units of SSD 1TB', 'Stock level fell to 0 (below safety threshold 5).', 'Restock inventory before stockout costs.', 'Applied', (now - datetime.timedelta(hours=3)).strftime('%Y-%m-%d %H:%M:%S')),
        ('Route Optimization', 'Batch #12', 'Optimized picking route to Zones A-01 -> A-03 -> A-05', 'Picker John Doe starting batch picking sequence.', 'Reduced picker walking distance by 160m (38% efficiency gain).', 'Applied', (now - datetime.timedelta(hours=2)).strftime('%Y-%m-%d %H:%M:%S')),
        ('Exception Resolution', 'ORD-1035', 'Replaced defective retail package with custom bubble box.', 'Damage reported during packing scan.', 'Prevented delayed customer dispatch.', 'Applied', (now - datetime.timedelta(hours=1)).strftime('%Y-%m-%d %H:%M:%S')),
    ]
    cursor.executemany('''
        INSERT INTO decision_log (type, entity_id, decision, reason, impact, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', decisions_data)
    
    conn.commit()
    conn.close()
    print("Database successfully seeded with realistic sample data!")

if __name__ == '__main__':
    seed_database()

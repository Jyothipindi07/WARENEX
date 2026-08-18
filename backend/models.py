from database import get_db_connection

def create_tables():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Products
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            sku TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            location TEXT NOT NULL,
            available INTEGER DEFAULT 0,
            reserved INTEGER DEFAULT 0,
            damaged INTEGER DEFAULT 0,
            reorder_level INTEGER DEFAULT 10,
            cost REAL DEFAULT 0.0,
            price REAL DEFAULT 0.0
        )
    ''')

    
    # 2. Orders
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            customer TEXT NOT NULL,
            value REAL DEFAULT 0.0,
            priority TEXT DEFAULT 'Medium',
            priority_score INTEGER DEFAULT 50,
            sla_deadline TEXT NOT NULL,
            status TEXT DEFAULT 'New',
            risk TEXT DEFAULT 'Low',
            risk_score INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        )
    ''')
    
    # 3. Order Items
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL,
            sku TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            allocated INTEGER DEFAULT 0,
            picked INTEGER DEFAULT 0,
            packed INTEGER DEFAULT 0,
            damaged INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Pending',
            FOREIGN KEY (order_id) REFERENCES orders (id),
            FOREIGN KEY (sku) REFERENCES products (sku)
        )
    ''')
    
    # 4. Exceptions
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS exceptions (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            severity TEXT NOT NULL,
            order_id TEXT,
            product_sku TEXT,
            quantity INTEGER DEFAULT 0,
            detected_at TEXT NOT NULL,
            status TEXT DEFAULT 'Active',
            description TEXT,
            recommendation TEXT,
            resolution_notes TEXT,
            FOREIGN KEY (order_id) REFERENCES orders (id),
            FOREIGN KEY (product_sku) REFERENCES products (sku)
        )
    ''')
    
    # 5. Pickers
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pickers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'Idle',
            zone TEXT NOT NULL,
            active_batch_id INTEGER
        )
    ''')
    
    # 6. Picking Batches
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS picking_batches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            picker_id INTEGER,
            status TEXT DEFAULT 'Pending',
            created_at TEXT NOT NULL,
            optimized_route TEXT,
            FOREIGN KEY (picker_id) REFERENCES pickers (id)
        )
    ''')
    
    # 7. Reorder Recommendations
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reorder_recommendations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku TEXT NOT NULL,
            current_stock INTEGER NOT NULL,
            reorder_level INTEGER NOT NULL,
            estimated_demand INTEGER NOT NULL,
            recommended_qty INTEGER NOT NULL,
            status TEXT DEFAULT 'Pending',
            created_at TEXT NOT NULL,
            FOREIGN KEY (sku) REFERENCES products (sku)
        )
    ''')
    
    # 8. Workflow Events
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS workflow_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders (id)
        )
    ''')
    
    # 9. Notifications
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message TEXT NOT NULL,
            severity TEXT DEFAULT 'Info',
            read INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        )
    ''')
    
    # 10. Decision Log
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS decision_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            entity_id TEXT,
            decision TEXT NOT NULL,
            reason TEXT NOT NULL,
            impact TEXT NOT NULL,
            status TEXT DEFAULT 'Applied',
            created_at TEXT NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()

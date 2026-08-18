import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'warenex.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    # WAL mode: allows concurrent reads without blocking writes
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    return conn


def init_db():
    from .models import create_tables
    create_tables()

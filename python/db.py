import sqlite3

DB_PATH = "usecases.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS usecases (
            id TEXT PRIMARY KEY,
            title TEXT,
            body TEXT,
            ai_tool TEXT,
            time_saved_minutes TEXT
        )
        """
    )
    conn.commit()
    conn.close()

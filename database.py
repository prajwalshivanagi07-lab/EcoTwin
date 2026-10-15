import sqlite3

DB_NAME = "ecotwin.db"

def create_database():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sensor_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        building TEXT,
        energy REAL,
        water REAL,
        occupancy INTEGER,
        temperature REAL,
        waste REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()


def insert_data(building, energy, water, occupancy, temperature, waste):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO sensor_data
    (building, energy, water, occupancy, temperature, waste)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (building, energy, water, occupancy, temperature, waste))

    conn.commit()
    conn.close()


def get_data():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
    SELECT * FROM sensor_data
    ORDER BY timestamp DESC
    """)
    
    data = cursor.fetchall()
    conn.close()

    return data
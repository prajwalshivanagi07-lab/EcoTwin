
import random
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

from database import create_database

DB_PATH = Path(__file__).resolve().parent / "ecotwin.db"
DAYS_OF_HISTORY = 7

# These names must match the buildings used by data_generator.py.
BUILDINGS = {
    "Academic Building": (120, 180, 3000, 5000, 8, 15, 12),
    "A Block - SOE": (100, 160, 2000, 4000, 6, 12, 10),
    "B Block - AI": (100, 160, 2000, 4000, 6, 12, 10),
    "BBA & B.Com Building": (70, 120, 1500, 3000, 5, 10, 7),
    "Nursing Building": (70, 120, 1500, 3000, 5, 10, 6),
    "CDSIMER Medical College": (180, 280, 5000, 8000, 15, 25, 10),
    "Library": (60, 100, 500, 1200, 2, 5, 5),
    "Canteen": (80, 140, 3000, 5000, 20, 35, 5),
    "Boys Hostel - 4 Sharing 1": (100, 160, 6000, 9000, 12, 20, 8),
    "Boys Hostel - 4 Sharing 2": (100, 160, 6000, 9000, 12, 20, 8),
    "Boys Hostel - 2 Sharing": (90, 140, 4000, 6500, 8, 15, 5),
    "Girls Hostel - 4 Sharing 1": (100, 160, 6000, 9000, 12, 20, 8),
    "Girls Hostel - 4 Sharing 2": (100, 160, 6000, 9000, 12, 20, 8),
    "Girls Hostel - 2 Sharing": (90, 140, 4000, 6500, 8, 15, 5),
    "Staff Quarters Tower 1": (40, 70, 2000, 3500, 4, 8, 3),
    "Staff Quarters Tower 2": (40, 70, 2000, 3500, 4, 8, 3),
    "Football Ground": (10, 25, 500, 1500, 2, 6, 2),
    "Cricket Ground": (10, 25, 500, 1500, 2, 6, 2),
    "Basketball Courts": (8, 20, 200, 600, 1, 3, 2),
    "Volleyball Courts": (5, 15, 150, 400, 1, 3, 1),
    "Pickleball Courts": (5, 15, 100, 300, 1, 2, 1),
    "Main Arena": (20, 80, 500, 2000, 3, 15, 2),
    "ICICI Bank": (15, 30, 200, 500, 1, 3, 1),
}


def main():
    create_database()

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Use a metadata table so this demo history is added only once.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS demo_metadata (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)

    cursor.execute(
        "SELECT value FROM demo_metadata WHERE key = ?",
        ("seven_day_history_v1",)
    )

    if cursor.fetchone():
        print("Seven-day demo history already exists.")
        print("No duplicate history was inserted.")
        conn.close()
        return

    # Create one reading per building per hour for seven days.
    # All inserted records are explicitly marked as simulated in metadata.
    end_time = datetime.now().replace(minute=0, second=0, microsecond=0)
    start_time = end_time - timedelta(days=DAYS_OF_HISTORY)

    rows = []
    current = start_time

    while current < end_time:
        hour = current.hour

        if 9 <= hour < 17:
            occupancy_fraction = 0.70
        elif 17 <= hour < 22:
            occupancy_fraction = 0.50
        elif 6 <= hour < 9:
            occupancy_fraction = 0.45
        else:
            occupancy_fraction = 0.25

        for building, values in BUILDINGS.items():
            energy_min, energy_max, water_min, water_max, waste_min, waste_max, weight = values

            occupancy = round(
                10000 * occupancy_fraction
                * weight / sum(v[6] for v in BUILDINGS.values())
                * random.uniform(0.85, 1.15)
            )

            energy = random.uniform(energy_min, energy_max)
            water = random.uniform(water_min, water_max)
            waste = random.uniform(waste_min, waste_max)
            temperature = random.uniform(23, 32)

            # Use the existing sensor_data schema.
            rows.append((
                building,
                round(energy, 2),
                round(water, 2),
                max(0, occupancy),
                round(temperature, 1),
                round(waste, 2),
                current.strftime("%Y-%m-%d %H:%M:%S")
            ))

        current += timedelta(hours=1)

    try:
        cursor.executemany("""
            INSERT INTO sensor_data
            (building, energy, water, occupancy, temperature, waste, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, rows)

        cursor.execute("""
            INSERT INTO demo_metadata (key, value)
            VALUES (?, ?)
        """, (
            "seven_day_history_v1",
            "SIMULATED - generated for prototype demonstration"
        ))

        conn.commit()

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()

    print("Seven-day simulated history created successfully.")
    print("Buildings:", len(BUILDINGS))
    print("Historical records inserted:", len(rows))
    print("Database:", DB_PATH)
    print("Existing records were preserved.")


if __name__ == "__main__":
    main()

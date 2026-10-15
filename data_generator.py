
import random
from datetime import datetime

from database import create_database, insert_data


# -----------------------------------------
# CAMPUS SETTINGS
# -----------------------------------------

TOTAL_POPULATION = 10000

campus_areas = {
    "Academic Building": {
        "energy": (120, 180), "water": (3000, 5000),
        "waste": (8, 15), "weight": 12, "type": "academic"
    },
    "A Block - SOE": {
        "energy": (100, 160), "water": (2000, 4000),
        "waste": (6, 12), "weight": 10, "type": "academic"
    },
    "B Block - AI": {
        "energy": (100, 160), "water": (2000, 4000),
        "waste": (6, 12), "weight": 10, "type": "academic"
    },
    "BBA & B.Com Building": {
        "energy": (70, 120), "water": (1500, 3000),
        "waste": (5, 10), "weight": 7, "type": "academic"
    },
    "Nursing Building": {
        "energy": (70, 120), "water": (1500, 3000),
        "waste": (5, 10), "weight": 6, "type": "academic"
    },
    "CDSIMER Medical College": {
        "energy": (180, 280), "water": (5000, 8000),
        "waste": (15, 25), "weight": 10, "type": "medical"
    },
    "Library": {
        "energy": (60, 100), "water": (500, 1200),
        "waste": (2, 5), "weight": 5, "type": "academic"
    },
    "Canteen": {
        "energy": (80, 140), "water": (3000, 5000),
        "waste": (20, 35), "weight": 5, "type": "food"
    },
    "Boys Hostel - 4 Sharing 1": {
        "energy": (100, 160), "water": (6000, 9000),
        "waste": (12, 20), "weight": 8, "type": "hostel"
    },
    "Boys Hostel - 4 Sharing 2": {
        "energy": (100, 160), "water": (6000, 9000),
        "waste": (12, 20), "weight": 8, "type": "hostel"
    },
    "Boys Hostel - 2 Sharing": {
        "energy": (90, 140), "water": (4000, 6500),
        "waste": (8, 15), "weight": 5, "type": "hostel"
    },
    "Girls Hostel - 4 Sharing 1": {
        "energy": (100, 160), "water": (6000, 9000),
        "waste": (12, 20), "weight": 8, "type": "hostel"
    },
    "Girls Hostel - 4 Sharing 2": {
        "energy": (100, 160), "water": (6000, 9000),
        "waste": (12, 20), "weight": 8, "type": "hostel"
    },
    "Girls Hostel - 2 Sharing": {
        "energy": (90, 140), "water": (4000, 6500),
        "waste": (8, 15), "weight": 5, "type": "hostel"
    },
    "Staff Quarters Tower 1": {
        "energy": (40, 70), "water": (2000, 3500),
        "waste": (4, 8), "weight": 3, "type": "residential"
    },
    "Staff Quarters Tower 2": {
        "energy": (40, 70), "water": (2000, 3500),
        "waste": (4, 8), "weight": 3, "type": "residential"
    },
    "Football Ground": {
        "energy": (10, 25), "water": (500, 1500),
        "waste": (2, 6), "weight": 2, "type": "sports"
    },
    "Cricket Ground": {
        "energy": (10, 25), "water": (500, 1500),
        "waste": (2, 6), "weight": 2, "type": "sports"
    },
    "Basketball Courts": {
        "energy": (8, 20), "water": (200, 600),
        "waste": (1, 3), "weight": 2, "type": "sports"
    },
    "Volleyball Courts": {
        "energy": (5, 15), "water": (150, 400),
        "waste": (1, 3), "weight": 1, "type": "sports"
    },
    "Pickleball Courts": {
        "energy": (5, 15), "water": (100, 300),
        "waste": (1, 2), "weight": 1, "type": "sports"
    },
    "Main Arena": {
        "energy": (20, 80), "water": (500, 2000),
        "waste": (3, 15), "weight": 2, "type": "event"
    },
    "ICICI Bank": {
        "energy": (15, 30), "water": (200, 500),
        "waste": (1, 3), "weight": 1, "type": "office"
    }
}


# -----------------------------------------
# TIME-BASED OCCUPANCY
# -----------------------------------------

def get_time_period(hour):
    if 5 <= hour < 9:
        return "Morning"
    elif 9 <= hour < 13:
        return "Classes"
    elif 13 <= hour < 15:
        return "Lunch"
    elif 15 <= hour < 19:
        return "Evening"
    else:
        return "Night"


def get_occupancy_target(period):
    targets = {
        "Morning": 0.55,
        "Classes": 0.72,
        "Lunch": 0.65,
        "Evening": 0.55,
        "Night": 0.35
    }

    proportion = targets[period] + random.uniform(-0.03, 0.03)
    proportion = max(0.0, min(1.0, proportion))

    return round(TOTAL_POPULATION * proportion)


# -----------------------------------------
# DISTRIBUTE PEOPLE ACROSS CAMPUS AREAS
# -----------------------------------------

def get_area_weights(period):
    weights = {}

    for area, details in campus_areas.items():
        weight = details["weight"]
        area_type = details["type"]

        if period == "Night":
            if area_type == "hostel":
                weight *= 3.0
            elif area_type in ("academic", "office", "medical"):
                weight *= 0.15
            elif area_type == "sports":
                weight *= 0.1

        elif period == "Classes":
            if area_type == "academic":
                weight *= 2.5
            elif area_type == "hostel":
                weight *= 0.35

        elif period == "Lunch":
            if area_type == "food":
                weight *= 3.0
            elif area_type == "academic":
                weight *= 0.7

        elif period == "Evening":
            if area_type == "hostel":
                weight *= 1.5
            elif area_type == "sports":
                weight *= 2.5

        elif period == "Morning":
            if area_type == "academic":
                weight *= 1.5
            elif area_type == "hostel":
                weight *= 1.2

        if area_type == "event":
            weight *= random.uniform(0.5, 2.0)

        weights[area] = max(weight, 0.01)

    return weights


def distribute_occupancy(target_occupancy, weights):
    total_weight = sum(weights.values())

    exact_shares = {
        area: target_occupancy * weight / total_weight
        for area, weight in weights.items()
    }

    occupancy = {
        area: int(share)
        for area, share in exact_shares.items()
    }

    remaining = target_occupancy - sum(occupancy.values())

    remainder_order = sorted(
        exact_shares,
        key=lambda area: exact_shares[area] - occupancy[area],
        reverse=True
    )

    for area in remainder_order[:remaining]:
        occupancy[area] += 1

    return occupancy


# -----------------------------------------
# GENERATE SENSOR READINGS
# -----------------------------------------

def generate_readings():
    now = datetime.now()
    period = get_time_period(now.hour)

    target_occupancy = get_occupancy_target(period)
    weights = get_area_weights(period)

    occupancy_by_area = distribute_occupancy(
        target_occupancy, weights
    )

    print("\n" + "=" * 48)
    print("ECOTWIN DSU - CAMPUS SENSOR SIMULATION")
    print("=" * 48)
    print("Timestamp:", now.strftime("%Y-%m-%d %H:%M:%S"))
    print("Time period:", period)
    print("Campus occupancy:", target_occupancy)
    print("Campus areas:", len(campus_areas))

    total_energy = 0
    total_water = 0
    total_waste = 0

    for area, details in campus_areas.items():
        occupancy = occupancy_by_area[area]

        energy_min, energy_max = details["energy"]
        water_min, water_max = details["water"]
        waste_min, waste_max = details["waste"]

        energy = random.uniform(energy_min, energy_max)
        water = random.uniform(water_min, water_max)
        waste = random.uniform(waste_min, waste_max)

        # Scale readings moderately with occupancy.
        expected_occupancy = (
            target_occupancy
            * details["weight"]
            / sum(weights.values())
        )

        if expected_occupancy > 0:
            occupancy_factor = occupancy / expected_occupancy
        else:
            occupancy_factor = 1.0

        occupancy_factor = max(0.5, min(1.5, occupancy_factor))

        energy *= occupancy_factor
        water *= occupancy_factor
        waste *= occupancy_factor

        # Slight time-of-day adjustments.
        if period == "Night":
            if details["type"] == "academic":
                energy *= 0.55
                water *= 0.65
            elif details["type"] == "hostel":
                energy *= 1.1
                water *= 1.15

        temperature = random.uniform(23.0, 32.0)

        # Store readings as positive values.
        energy = round(max(0, energy), 2)
        water = round(max(0, water), 2)
        waste = round(max(0, waste), 2)
        temperature = round(temperature, 1)

        insert_data(
            area,
            energy,
            water,
            occupancy,
            temperature,
            waste
        )

        total_energy += energy
        total_water += water
        total_waste += waste

    # -------------------------------------
    # VALIDATE OCCUPANCY
    # -------------------------------------

    area_occupancy_total = sum(occupancy_by_area.values())

    print("-" * 48)
    print("Target occupancy:", target_occupancy)
    print("Sum of area occupancy:", area_occupancy_total)
    print("Total energy (one simulated interval):", round(total_energy, 2))
    print("Total water (one simulated interval):", round(total_water, 2))
    print("Total waste (one simulated interval):", round(total_waste, 2))

    assert area_occupancy_total == target_occupancy, (
        "ERROR: Area occupancy does not match target occupancy!"
    )

    print("Readings saved successfully.")
    print("Historical readings are retained in the database.")
    print("=" * 48)


# -----------------------------------------
# MAIN
# -----------------------------------------

if __name__ == "__main__":
    create_database()
    generate_readings()

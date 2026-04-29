"""
Seed script — generates 6 months of realistic maintenance report data.
Run with: python3.11 seed.py
"""

import random
import string
from datetime import datetime, timedelta
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://rayhanulislamrumel@localhost:5432/nestcare"
)

# ── Realistic tenant names ────────────────────────────────────────
TENANTS = [
    ("Anna Müller", "Anna"), ("Thomas Schmidt", "Thomas"),
    ("Sarah Weber", "Sarah"), ("Michael Fischer", "Michael"),
    ("Laura Schneider", "Laura"), ("Jan Becker", "Jan"),
    ("Sophie Wagner", "Sophie"), ("Felix Hoffmann", "Felix"),
    ("Emma Koch", "Emma"), ("Lukas Richter", "Lukas"),
    ("Mia Braun", "Mia"), ("Paul Krause", "Paul"),
    ("Hannah Wolf", "Hannah"), ("Niklas Zimmermann", "Niklas"),
    ("Lena Hartmann", "Lena"), ("Maximilian Lange", "Maximilian"),
]

UNITS = ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B", "5A", "5B"]

CONTACT_TYPES = ["whatsapp", "email"]

# ── Issue categories with seasonal weights ────────────────────────
# Format: (category, base_rate, winter_boost, summer_boost)
ISSUE_CONFIG = [
    ("Heating is not functioning",   0.15, 2.8, 0.2),
    ("Window is damaged",            0.12, 1.4, 1.2),
    ("Stove is not working",         0.10, 1.0, 1.0),
    ("Plumbing issue",               0.13, 1.1, 1.3),
    ("Electrical issue",             0.09, 1.2, 0.9),
    ("Other issue",                  0.08, 1.0, 1.0),
]

DESCRIPTIONS = {
    "Heating is not functioning": [
        "The radiator in the living room is completely cold.",
        "No heat since last night, temperature dropped below 16°C.",
        "Heating makes loud banging noises and barely warms the room.",
        "The thermostat is broken, heating won't turn on.",
        "Hot water for heating is not reaching the apartment.",
    ],
    "Window is damaged": [
        "The bedroom window has a crack running across the glass.",
        "Window frame is broken and won't close properly — cold air coming in.",
        "The seal around the window is damaged, condensation building up.",
        "Window handle broke off, can't open or close it.",
        "Double glazing failed, permanent fog between the panes.",
    ],
    "Stove is not working": [
        "Two out of four burners are not igniting.",
        "The oven temperature is completely off, burns everything.",
        "Gas smell when turning on the stove — stopped using it.",
        "Electric stove plate stopped heating up entirely.",
        "The oven door doesn't close properly anymore.",
    ],
    "Plumbing issue": [
        "Slow drain in the bathroom sink for the past week.",
        "Dripping tap in the kitchen, constant water loss.",
        "Water pressure in the shower is very low.",
        "Toilet is running continuously, wasting water.",
        "Small leak under the kitchen sink, water pooling in cabinet.",
    ],
    "Electrical issue": [
        "One circuit keeps tripping the breaker.",
        "Light switch in the hallway stopped working.",
        "Flickering lights in the bedroom, possible loose connection.",
        "Power outlet in the kitchen is sparking slightly.",
        "No power in the bathroom after attempting to reset the breaker.",
    ],
    "Other issue": [
        "Mold appearing on the bathroom ceiling.",
        "Front door lock is very stiff and difficult to open.",
        "Intercom system is not working.",
        "Mice spotted in the kitchen area.",
        "Strong damp smell coming from the walls.",
    ],
}

def generate_ref():
    return f"NC-{random.randint(2024, 2025)}-{random.randint(1000, 9999)}"

def get_season_multiplier(date, winter_boost, summer_boost):
    month = date.month
    if month in [12, 1, 2]:       # Winter
        return winter_boost
    elif month in [6, 7, 8]:      # Summer
        return summer_boost
    elif month in [3, 4, 5]:      # Spring
        return 0.8
    else:                          # Autumn
        return 1.1

def get_weekday_multiplier(date):
    """More reports on Mon/Tue, fewer on weekends."""
    weekday = date.weekday()
    weights = [1.4, 1.3, 1.0, 0.9, 1.1, 0.6, 0.5]
    return weights[weekday]

def should_create_report(date, base_rate, winter_boost, summer_boost):
    season_mult = get_season_multiplier(date, winter_boost, summer_boost)
    weekday_mult = get_weekday_multiplier(date)
    probability = base_rate * season_mult * weekday_mult
    # Add occasional anomaly spike
    if random.random() < 0.02:  # 2% chance of spike day
        probability *= 4
    return random.random() < probability

def seed():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Clear existing seed data
    print("Clearing existing data...")
    cur.execute("DELETE FROM daily_stats")
    cur.execute("DELETE FROM predictions")
    cur.execute("DELETE FROM issue_reports WHERE tenant_name != 'Ray Roo'")  # keep real submissions
    conn.commit()

    start_date = datetime.now() - timedelta(days=365)
    end_date = datetime.now() - timedelta(days=1)

    current_date = start_date
    total_reports = 0
    daily_counts = {}  # {(date, category): count}

    print("Generating reports...")

    while current_date <= end_date:
        for category, base_rate, winter_boost, summer_boost in ISSUE_CONFIG:
            # Determine how many reports this day for this category
            reports_today = 0
            for _ in range(3):  # max 3 reports per category per day
                if should_create_report(current_date, base_rate, winter_boost, summer_boost):
                    reports_today += 1

            for _ in range(reports_today):
                tenant_name, first_name = random.choice(TENANTS)
                contact_type = random.choice(CONTACT_TYPES)
                contact = (
                    f"+49{random.randint(1500000000, 1799999999)}"
                    if contact_type == "whatsapp"
                    else f"{first_name.lower()}.{tenant_name.split()[-1].lower()}@email.de"
                )
                description = random.choice(DESCRIPTIONS[category])
                submitted_at = current_date.replace(
                    hour=random.randint(7, 21),
                    minute=random.randint(0, 59)
                )

                # Insert issue report
                ref = generate_ref()
                cur.execute("""
                    INSERT INTO issue_reports
                        (ref_number, tenant_name, first_name, issue_category,
                         description, contact, contact_type, unit_number, submitted_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (ref_number) DO NOTHING
                """, (
                    ref, tenant_name, first_name, category,
                    description, contact, contact_type,
                    random.choice(UNITS), submitted_at
                ))
                total_reports += 1

                # Track for daily_stats
                key = (current_date.date(), category)
                daily_counts[key] = daily_counts.get(key, 0) + 1

        current_date += timedelta(days=1)

    # Insert daily_stats
    print("Inserting daily stats...")
    for (stat_date, category), count in daily_counts.items():
        cur.execute("""
            INSERT INTO daily_stats (stat_date, issue_category, report_count)
            VALUES (%s, %s, %s)
            ON CONFLICT (stat_date, issue_category)
            DO UPDATE SET report_count = daily_stats.report_count + EXCLUDED.report_count
        """, (stat_date, category, count))

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n✅ Seeding complete!")
    print(f"   Total reports inserted: {total_reports}")
    print(f"   Date range: {start_date.date()} → {end_date.date()}")
    print(f"   Daily stat rows: {len(daily_counts)}")

if __name__ == "__main__":
    seed()
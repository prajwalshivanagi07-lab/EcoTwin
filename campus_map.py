
import os
import sqlite3
import pandas as pd
import plotly.graph_objects as go


def create_campus_map():
    fig = go.Figure()

    fig.update_layout(
        title="EcoTwin DSU — Interactive Campus Digital Twin",
        paper_bgcolor="#101820",
        plot_bgcolor="#dce8d5",
        font=dict(color="white", size=11),
        height=750,
        margin=dict(l=20, r=20, t=60, b=20),
        showlegend=False,
        hovermode="closest",
    )

    fig.add_shape(
        type="rect",
        x0=0, y0=0, x1=100, y1=100,
        fillcolor="#dce8d5",
        line=dict(width=0),
        layer="below",
    )

    # ---------------- ROAD HELPER ----------------
    def road(points, width=5):
        x, y = zip(*points)

        fig.add_trace(go.Scatter(
            x=x, y=y,
            mode="lines",
            line=dict(color="#777c78", width=width + 3),
            hoverinfo="skip",
            showlegend=False,
        ))

        fig.add_trace(go.Scatter(
            x=x, y=y,
            mode="lines",
            line=dict(color="#b9bcb7", width=width),
            hoverinfo="skip",
            showlegend=False,
        ))

    # ---------------- ROAD NETWORK ----------------
    road([
        (13, 0), (16, 12), (23, 24), (30, 36),
        (38, 48), (45, 60), (53, 72), (60, 85), (65, 100)
    ], 7)

    road([(38, 48), (43, 45), (48, 40), (52, 34)], 5)

    road([
        (62, 91), (57, 82), (52, 72), (48, 62),
        (45, 52), (47, 43), (51, 34), (54, 26), (51, 18)
    ], 5)

    road([(57, 82), (66, 85), (73, 79), (78, 69)], 4)

    road([
        (43, 60), (51, 65), (60, 64), (68, 57),
        (72, 48), (67, 39), (58, 35), (51, 34)
    ], 5)

    road([
        (68, 57), (76, 62), (82, 70), (88, 76),
        (91, 67), (89, 56), (84, 47), (78, 40), (72, 48)
    ], 5)

    road([(67, 39), (74, 34), (80, 29), (84, 24)], 4)

    road([(51, 34), (45, 27), (39, 20), (34, 14), (29, 9)], 5)

    road([
        (39, 20), (47, 17), (56, 17), (64, 20),
        (70, 24), (77, 21), (84, 18)
    ], 4)

    road([(64, 20), (66, 27), (67, 39)], 4)
    road([(48, 62), (40, 61), (34, 55)], 3)
    road([(58, 35), (61, 28), (64, 20)], 3)
    road([(76, 62), (74, 54), (78, 40)], 3)

    # ---------------- WATER BODY ----------------
    fig.add_shape(
        type="path",
        path=(
            "M 37,15 Q 42,21 49,19 "
            "Q 56,18 61,14 Q 59,8 52,5 "
            "Q 44,3 39,8 Z"
        ),
        fillcolor="#78b8d0",
        line=dict(color="#5599b5", width=1),
        layer="below",
    )

    # ---------------- BUILDINGS ----------------
    buildings = [
        ("A Block / School of Engineering", 59, 77, 69, 84, "#4c78a8"),
        ("B Block / AI Block", 67, 68, 74, 74, "#4c78a8"),
        ("Academic Building", 50, 55, 59, 62, "#4c78a8"),
        ("BBA & B.Com", 42, 48, 49, 54, "#4c78a8"),
        ("Nursing Building", 58, 48, 65, 54, "#4c78a8"),
        ("CDSIMER Medical College", 61, 39, 70, 46, "#4c78a8"),
        ("Library", 47, 42, 53, 47, "#4c78a8"),
        ("Canteen", 51, 37, 56, 41, "#f2a541"),
        ("ICICI Bank", 72, 42, 77, 46, "#b7a7e5"),
        ("Main Arena", 76, 30, 85, 36, "#8e6bbd"),
        ("Boys Hostel Tower 1", 28, 10, 33, 16, "#e09f7d"),
        ("Boys Hostel Tower 2", 33, 10, 38, 16, "#e09f7d"),
        ("Boys Hostel Tower 3", 29, 5, 34, 10, "#e09f7d"),
        ("Girls Hostel Tower 1", 39, 10, 44, 16, "#d889ad"),
        ("Girls Hostel Tower 2", 44, 10, 49, 16, "#d889ad"),
        ("Girls Hostel Tower 3", 39, 5, 44, 10, "#d889ad"),
        ("Staff Quarters Tower 1", 77, 12, 82, 17, "#d6b66b"),
        ("Staff Quarters Tower 2", 82, 12, 87, 17, "#d6b66b"),
    ]

    # ---------------- SPORTS FACILITIES ----------------
    sports = [
        ("Football Stadium", 86, 68, 97, 82),
        ("Cricket Ground", 88, 54, 97, 64),

        # Three basketball courts
        ("Basketball Court 1", 80, 47, 84, 51),
        ("Basketball Court 2", 84.5, 47, 88.5, 51),
        ("Basketball Court 3", 89, 47, 93, 51),

        # Two volleyball courts
        ("Volleyball Court 1", 80, 41, 84, 44),
        ("Volleyball Court 2", 85, 41, 89, 44),

        # Two pickleball courts, just below volleyball courts
        ("Pickleball Court 1", 80, 37.5, 84, 39.5),
        ("Pickleball Court 2", 85, 37.5, 89, 39.5),
    ]

    # Draw building boxes and their labels
    for name, x0, y0, x1, y1, color in buildings:
        fig.add_shape(
            type="rect",
            x0=x0, y0=y0, x1=x1, y1=y1,
            fillcolor=color,
            line=dict(color="white", width=1),
            layer="above",
        )

        fig.add_annotation(
            x=(x0 + x1) / 2,
            y=(y0 + y1) / 2,
            text=name.replace(" / ", "<br>"),
            showarrow=False,
            font=dict(size=8, color="white"),
            align="center",
            xanchor="center",
            yanchor="middle",
        )

    # Draw sports boxes and labels
    for name, x0, y0, x1, y1 in sports:
        fig.add_shape(
            type="rect",
            x0=x0, y0=y0, x1=x1, y1=y1,
            fillcolor="#4b9b65",
            line=dict(color="white", width=1.2),
            layer="above",
        )

        # Keep smaller court labels compact
        if "Court" in name:
            label = name.replace("Basketball ", "BB ").replace(
                "Volleyball ", "VB "
            ).replace("Pickleball ", "PB ")
            font_size = 6
        else:
            label = name.replace(" ", "<br>")
            font_size = 8

        fig.add_annotation(
            x=(x0 + x1) / 2,
            y=(y0 + y1) / 2,
            text=label,
            showarrow=False,
            font=dict(size=font_size, color="white"),
            align="center",
            xanchor="center",
            yanchor="middle",
        )

    # ---------------- LOAD SENSOR READINGS ----------------
    db_path = os.path.join(os.path.dirname(__file__), "ecotwin.db")
    df = pd.DataFrame()

    try:
        if os.path.exists(db_path):
            with sqlite3.connect(db_path) as conn:
                df = pd.read_sql_query(
                    "SELECT * FROM sensor_data", conn
                )
    except Exception as error:
        print("Could not load sensor readings:", error)

    readings = {}

    if not df.empty and "building" in df.columns:
        if "timestamp" in df.columns:
            df = df.sort_values("timestamp")

        df["building_key"] = (
            df["building"].astype(str).str.lower().str.strip()
        )

        latest = df.groupby("building_key", as_index=False).tail(1)

        readings = {
            row["building_key"]: row.to_dict()
            for _, row in latest.iterrows()
        }

    aliases = {
        "a block / school of engineering": [
            "a block", "school of engineering", "soe", "engineering block"
        ],
        "b block / ai block": [
            "b block", "ai block", "artificial intelligence block"
        ],
        "academic building": ["academic building", "academic block"],
        "bba & b.com": ["bba & b.com", "bba bcom", "commerce block"],
        "nursing building": ["nursing building", "nursing block"],
        "cdsimer medical college": [
            "cdsimer", "cdsimer medical college", "medical college"
        ],
        "library": ["library"],
        "canteen": ["canteen", "food court"],
        "icici bank": ["icici bank", "bank"],
        "main arena": ["main arena", "auditorium", "open auditorium"],
        "football stadium": ["football stadium", "football ground"],
        "cricket ground": ["cricket ground"],
        "boys hostel tower 1": ["boys hostel", "boys hostel tower 1"],
        "boys hostel tower 2": ["boys hostel tower 2"],
        "boys hostel tower 3": ["boys hostel tower 3"],
        "girls hostel tower 1": ["girls hostel", "girls hostel tower 1"],
        "girls hostel tower 2": ["girls hostel tower 2"],
        "girls hostel tower 3": ["girls hostel tower 3"],
        "staff quarters tower 1": [
            "staff quarters", "staff quarters tower 1"
        ],
        "staff quarters tower 2": ["staff quarters tower 2"],
    }

    locations = [
        (name, (x0 + x1) / 2, (y0 + y1) / 2)
        for name, x0, y0, x1, y1, _ in buildings
    ]

    locations.extend([
        (name, (x0 + x1) / 2, (y0 + y1) / 2)
        for name, x0, y0, x1, y1 in sports
    ])

    marker_x, marker_y, hover_texts = [], [], []

    for name, x, y in locations:
        row = None
        possible_names = aliases.get(name.lower(), [name.lower()])

        # Exact name match first
        for alias in possible_names:
            if alias.lower().strip() in readings:
                row = readings[alias.lower().strip()]
                break

        # Partial name match if exact match was not found
        if row is None:
            for key, candidate in readings.items():
                if any(
                    alias in key or key in alias
                    for alias in possible_names
                ):
                    row = candidate
                    break

        if row is None:
            continue

        def reading_value(column, unit=""):
            value = row.get(column)
            if value is None or pd.isna(value):
                return "N/A"
            return f"{value}{unit}"

        hover = (
            f"<b>{name}</b><br>"
            f"Energy: {reading_value('energy', ' kWh')}<br>"
            f"Water: {reading_value('water', ' L')}<br>"
            f"Occupancy: {reading_value('occupancy')}<br>"
            f"Temperature: {reading_value('temperature', ' °C')}<br>"
            f"Waste: {reading_value('waste', '%')}<br>"
        )

        if row.get("timestamp") is not None:
            hover += f"Updated: {row['timestamp']}<br>"

        marker_x.append(x)
        marker_y.append(y)
        hover_texts.append(hover)

    # Interactive sensor markers
    if marker_x:
        fig.add_trace(go.Scatter(
            x=marker_x,
            y=marker_y,
            mode="markers",
            name="Sensor readings",
            marker=dict(
                size=12,
                color="#ffe066",
                opacity=0.95,
                line=dict(color="white", width=1.5),
                symbol="circle",
            ),
            text=hover_texts,
            hovertemplate="%{text}<extra></extra>",
            showlegend=False,
        ))

    # Highway label
    fig.add_annotation(
        x=27, y=35,
        text="HIGHWAY",
        textangle=-53,
        showarrow=False,
        font=dict(size=10, color="#303632"),
        bgcolor="#dce8d5",
    )

    # ---------------- FINAL SETTINGS ----------------
    fig.update_xaxes(
        visible=False,
        range=[0, 100],
        fixedrange=True,
    )

    fig.update_yaxes(
        visible=False,
        range=[0, 100],
        scaleanchor="x",
        scaleratio=1,
        fixedrange=True,
    )

    return fig
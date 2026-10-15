
# ============================================================
# ECOTWIN DSU — SCROLL-ANIMATED SUSTAINABLE CAMPUS DASHBOARD
# Falak-inspired design | Existing map preserved
# ============================================================

import sqlite3
from pathlib import Path

import pandas as pd
import plotly.express as px
import streamlit as st
import streamlit.components.v1 as components
from streamlit_autorefresh import st_autorefresh

from campus_map import create_campus_map


# ============================================================
# PAGE CONFIGURATION
# ============================================================

st.set_page_config(
    page_title="EcoTwin DSU",
    page_icon="🌱",
    layout="wide",
    initial_sidebar_state="expanded",
)

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "ecotwin.db"
CAMPUS_CAPACITY = 10_000

st_autorefresh(interval=30_000, key="ecotwin_refresh")


# ============================================================
# DESIGN + ANIMATION CSS
# ============================================================

st.markdown(
    """
    <style>
    @import url(
      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap'
    );

    :root {
        --eco-bg: #080b20;
        --eco-panel: #11152f;
        --eco-border: #29294d;
        --eco-pink: #ff4fa3;
        --eco-purple: #a78bfa;
        --eco-blue: #62d9ff;
        --eco-text: #f5f3ff;
        --eco-muted: #a6a8c5;
        --eco-green: #42e6a4;
    }

    html {
        scroll-behavior: smooth;
        background: var(--eco-bg);
    }

    .stApp {
        background:
            radial-gradient(
                ellipse at 85% 0%,
                rgba(137, 62, 204, 0.20),
                transparent 38%
            ),
            radial-gradient(
                ellipse at 0% 35%,
                rgba(42, 89, 173, 0.13),
                transparent 38%
            ),
            var(--eco-bg);
        color: var(--eco-text);
        font-family: 'Space Grotesk', sans-serif;
    }

    [data-testid="stHeader"] {
        background: rgba(8, 11, 32, 0.88);
    }

    [data-testid="stAppViewContainer"] {
        background: transparent;
    }

    .main .block-container {
        max-width: 1500px;
        padding-top: 1.5rem;
        padding-bottom: 4rem;
    }

    h1, h2, h3, p, label {
        font-family: 'Space Grotesk', sans-serif;
    }

    h1 {
        font-weight: 700 !important;
        letter-spacing: -1.5px;
    }

    h2 {
        font-weight: 700 !important;
        letter-spacing: -0.7px;
    }

    h3 {
        font-weight: 600 !important;
    }

    [data-testid="stSidebar"] {
        background: linear-gradient(
            180deg,
            #10132d,
            #090b20
        );
        border-right: 1px solid var(--eco-border);
    }

    [data-testid="stSidebar"] * {
        color: var(--eco-text);
    }

    [data-testid="stMetric"] {
        background: linear-gradient(
            145deg,
            rgba(28, 31, 68, 0.96),
            rgba(15, 18, 43, 0.96)
        );
        border: 1px solid var(--eco-border);
        border-radius: 16px;
        padding: 20px;
        min-height: 120px;
        box-shadow: 0 10px 35px rgba(0, 0, 0, 0.12);
        transition:
            transform 0.25s ease,
            border-color 0.25s ease,
            box-shadow 0.25s ease;
    }

    [data-testid="stMetric"]:hover {
        transform: translateY(-4px);
        border-color: var(--eco-pink);
        box-shadow: 0 8px 30px rgba(255, 79, 163, 0.10);
    }

    [data-testid="stMetricLabel"] {
        color: var(--eco-muted) !important;
    }

    [data-testid="stMetricValue"] {
        color: var(--eco-text) !important;
        font-weight: 700;
    }

    [data-testid="stVerticalBlockBorderWrapper"] {
        background: rgba(17, 21, 47, 0.72);
        border-color: var(--eco-border) !important;
        border-radius: 16px;
    }

    hr {
        border-color: var(--eco-border);
    }

    div[data-baseweb="select"] > div,
    div[data-baseweb="input"] > div {
        background: #11152f;
        border-color: var(--eco-border);
        border-radius: 9px;
    }

    .stButton > button {
        border: 1px solid var(--eco-pink);
        border-radius: 10px;
        background: linear-gradient(
            110deg,
            var(--eco-pink),
            #a855f7
        );
        color: white;
        font-weight: 700;
        transition: 0.25s ease;
    }

    .stButton > button:hover {
        border-color: var(--eco-blue);
        box-shadow: 0 0 25px rgba(255, 79, 163, 0.22);
        color: white;
    }

    .stProgress > div > div > div {
        background: linear-gradient(
            90deg,
            var(--eco-pink),
            var(--eco-purple),
            var(--eco-blue)
        );
    }

    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        border-bottom: 1px solid var(--eco-border);
    }

    .stTabs [data-baseweb="tab"] {
        border-radius: 9px 9px 0 0;
        padding: 10px 16px;
    }

    .stTabs [aria-selected="true"] {
        color: var(--eco-pink) !important;
    }

    /* HERO SECTION */

    .eco-hero {
        position: relative;
        overflow: hidden;
        padding: 44px 40px;
        margin-bottom: 30px;
        border: 1px solid #39305e;
        border-radius: 24px;
        background:
            radial-gradient(
                ellipse at 84% 12%,
                rgba(168, 85, 247, 0.36),
                transparent 38%
            ),
            radial-gradient(
                ellipse at 8% 100%,
                rgba(255, 79, 163, 0.18),
                transparent 38%
            ),
            linear-gradient(
                120deg,
                #121632,
                #171238 60%,
                #10162f
            );
    }

    .eco-eyebrow {
        color: #ff83c1;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 3px;
        text-transform: uppercase;
        margin-bottom: 20px;
    }

    .eco-title {
        font-size: clamp(2.7rem, 6vw, 5.5rem);
        line-height: 0.98;
        letter-spacing: -3px;
        font-weight: 700;
        color: white;
        margin: 0;
    }

    .eco-title span {
        background: linear-gradient(
            90deg,
            #ff4fa3,
            #c084fc,
            #62d9ff
        );
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
    }

    .eco-description {
        color: #c4c6df;
        font-size: 1rem;
        line-height: 1.8;
        margin-top: 22px;
        max-width: 700px;
    }

    .eco-status {
        display: inline-block;
        padding: 9px 14px;
        margin-top: 20px;
        color: #d4ffe4;
        background: rgba(52, 211, 153, 0.10);
        border: 1px solid rgba(52, 211, 153, 0.35);
        border-radius: 999px;
        font-size: 0.78rem;
    }

    .eco-label {
        color: var(--eco-pink);
        font-size: 0.73rem;
        font-weight: 700;
        letter-spacing: 2.5px;
        text-transform: uppercase;
        margin-bottom: 5px;
    }

    .eco-muted {
        color: var(--eco-muted);
        font-size: 0.84rem;
        line-height: 1.7;
    }

    /* SCROLL REVEAL
       Content is visible by default.
       JavaScript adds these classes when it detects scrolling.
    */

    @keyframes ecoReveal {
        from {
            opacity: 0;
            transform: translateY(48px) scale(0.985);
            filter: blur(5px);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
        }
    }

    .eco-scroll-section {
        opacity: 1;
        transform: none;
        filter: none;
        transition:
            opacity 0.75s ease,
            transform 0.75s cubic-bezier(0.2, 0.7, 0.2, 1),
            filter 0.75s ease;
        will-change: opacity, transform, filter;
    }

    .eco-scroll-section.eco-not-visible {
        opacity: 0;
        transform: translateY(48px) scale(0.985);
        filter: blur(5px);
        pointer-events: none;
    }

    .eco-scroll-section.eco-revealed {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
        pointer-events: auto;
    }

    .eco-separator {
        height: 1px;
        width: 100%;
        margin: 26px 0;
        background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 79, 163, 0.65),
            rgba(167, 139, 250, 0.65),
            transparent
        );
    }

    @media (max-width: 700px) {
        .main .block-container {
            padding: 1rem 1rem 2rem;
        }

        .eco-hero {
            padding: 28px 22px;
        }

        .eco-title {
            letter-spacing: -1.5px;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        html {
            scroll-behavior: auto;
        }

        .eco-scroll-section,
        .eco-scroll-section.eco-not-visible,
        .eco-scroll-section.eco-revealed {
            opacity: 1 !important;
            transform: none !important;
            filter: none !important;
            transition: none !important;
        }
    }
    </style>
    """,
    unsafe_allow_html=True,
)


# ============================================================
# JAVASCRIPT SCROLL DETECTOR
# Observes the Streamlit page from the components iframe.
# Uses unique keyed sections below.
# ============================================================

components.html(
    """
    <script>
    (() => {
        try {
            const win = window.parent;
            const doc = win.document;

            if (!win.IntersectionObserver) {
                return;
            }

            const sectionNames = [
                "hero",
                "overview",
                "sustainability",
                "score",
                "buildings",
                "map",
                "analysis",
                "comparison",
                "insights",
                "alerts"
            ];

            const selectors = sectionNames.map(
                name => ".st-key-section_" + name
            );

            const observer = new win.IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        const el = entry.target;

                        if (entry.isIntersecting) {
                            el.classList.remove("eco-not-visible");
                            el.classList.add("eco-revealed");
                        } else {
                            el.classList.remove("eco-revealed");
                            el.classList.add("eco-not-visible");
                        }
                    });
                },
                {
                    root: null,
                    threshold: 0.04,
                    rootMargin: "0px 0px -4% 0px"
                }
            );

            function attachAnimations() {
                selectors.forEach((selector) => {
                    doc.querySelectorAll(selector).forEach((el) => {
                        if (
                            el.dataset.ecoRevealAttached === "true"
                        ) {
                            return;
                        }

                        el.dataset.ecoRevealAttached = "true";
                        el.classList.add("eco-scroll-section");
                        observer.observe(el);
                    });
                });
            }

            attachAnimations();

            const mutationObserver = new win.MutationObserver(
                attachAnimations
            );

            mutationObserver.observe(doc.body, {
                childList: true,
                subtree: true
            });

            // Recheck after Streamlit finishes its first render.
            win.requestAnimationFrame(attachAnimations);
            win.setTimeout(attachAnimations, 400);
            win.setTimeout(attachAnimations, 1200);

        } catch (error) {
            // Keep the app usable even if the browser blocks the observer.
            console.warn("EcoTwin scroll animation:", error);
        }
    })();
    </script>
    """,
    height=0,
    scrolling=False,
)


# ============================================================
# CHART STYLE
# Applied to analytics charts only, never to the campus map.
# ============================================================

def style_chart(fig):
    fig.update_layout(
        template="plotly_dark",
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(
            family="Space Grotesk, sans-serif",
            color="#f5f3ff",
        ),
        title_font=dict(size=18, color="#f5f3ff"),
        margin=dict(l=20, r=20, t=60, b=25),
        hoverlabel=dict(
            bgcolor="#171936",
            font_color="#ffffff",
            bordercolor="#a78bfa",
        ),
    )
    fig.update_xaxes(gridcolor="rgba(166,168,197,0.12)")
    fig.update_yaxes(gridcolor="rgba(166,168,197,0.12)")
    return fig


# ============================================================
# DATABASE LOADING
# ============================================================

@st.cache_data(ttl=10)
def load_data(database_path):
    with sqlite3.connect(database_path) as conn:
        data = pd.read_sql_query(
            "SELECT * FROM sensor_data",
            conn,
        )

    if data.empty or "timestamp" not in data.columns:
        return pd.DataFrame()

    data["timestamp"] = pd.to_datetime(
        data["timestamp"],
        errors="coerce",
    )

    data = data.dropna(
        subset=["building", "timestamp"]
    ).copy()

    for col in [
        "energy",
        "water",
        "occupancy",
        "temperature",
        "waste",
    ]:
        if col not in data.columns:
            data[col] = float("nan")
        else:
            data[col] = pd.to_numeric(
                data[col],
                errors="coerce",
            )

    return data.sort_values("timestamp")


try:
    if not DB_PATH.exists():
        st.error(f"Database not found: {DB_PATH}")
        st.info("Keep ecotwin.db in the same folder as app.py.")
        st.stop()

    df = load_data(str(DB_PATH))

except Exception as error:
    st.error(f"Could not load sensor data: {error}")
    st.stop()

if df.empty:
    st.warning("No sensor readings are available yet.")
    st.info("Run data_generator.py, then refresh the dashboard.")
    st.stop()


latest_df = (
    df.sort_values("timestamp")
    .groupby("building", as_index=False)
    .tail(1)
    .sort_values("building")
    .reset_index(drop=True)
)

if latest_df.empty:
    st.warning("No valid timestamped readings are available.")
    st.stop()


# ============================================================
# SIDEBAR FILTERS
# ============================================================

st.sidebar.markdown("## 🌿 EcoTwin DSU")
st.sidebar.caption("CAMPUS CONTROL CENTRE")
st.sidebar.divider()

building_names = sorted(
    latest_df["building"].dropna().unique().tolist()
)

selected_buildings = st.sidebar.multiselect(
    "Buildings to analyse",
    options=building_names,
    default=building_names,
)

if not selected_buildings:
    st.info("Select at least one building in the sidebar.")
    st.stop()

valid_timestamps = df["timestamp"].dropna()

if valid_timestamps.empty:
    st.warning("No valid timestamps are available.")
    st.stop()

earliest_date = valid_timestamps.min().date()
latest_available_date = valid_timestamps.max().date()

st.sidebar.divider()
st.sidebar.markdown("### Date range")

selected_dates = st.sidebar.date_input(
    "Choose date range",
    value=(earliest_date, latest_available_date),
    min_value=earliest_date,
    max_value=latest_available_date,
)

if isinstance(selected_dates, (tuple, list)):
    if len(selected_dates) == 2:
        start_date, end_date = selected_dates
    elif len(selected_dates) == 1:
        start_date = end_date = selected_dates[0]
    else:
        start_date, end_date = earliest_date, latest_available_date
else:
    start_date = end_date = selected_dates

if start_date > end_date:
    st.sidebar.error("Start date must be before end date.")
    st.stop()

st.sidebar.divider()
st.sidebar.markdown("### System status")
st.sidebar.caption("● Auto-refresh: 30 seconds")
st.sidebar.caption(f"Buildings: {len(building_names)}")
st.sidebar.caption(f"Database records: {len(df):,}")
st.sidebar.caption("Prototype readings may be simulated.")


# ============================================================
# APPLY FILTERS
# ============================================================

date_mask = df["timestamp"].dt.date.between(
    start_date,
    end_date,
)

date_filtered_history = df.loc[date_mask].copy()

filtered_history = date_filtered_history[
    date_filtered_history["building"].isin(selected_buildings)
].copy()

filtered_latest = (
    filtered_history.sort_values("timestamp")
    .groupby("building", as_index=False)
    .tail(1)
    .sort_values("building")
    .reset_index(drop=True)
)

if filtered_latest.empty:
    st.warning(
        "No readings found for this date range. "
        "Choose another date range or building."
    )
    st.stop()


# ============================================================
# SECTION 1 — HERO
# ============================================================

with st.container(key="section_hero"):
    st.markdown(
        """
        <div class="eco-hero">
            <div class="eco-eyebrow">
                DSU HAROHALLI · SMART CAMPUS INITIATIVE
            </div>
            <div class="eco-title">
                ECO<span>TWIN</span><br>
                CAMPUS INTELLIGENCE
            </div>
            <div class="eco-description">
                A living digital twin of our campus.
                Monitor energy, water, occupancy and waste.
                Explore building-level readings and discover
                opportunities for a more sustainable campus.
            </div>
            <div class="eco-status">
                ● Dashboard active · Auto-refresh enabled
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


# ============================================================
# SECTION 2 — CAMPUS OVERVIEW
# ============================================================

with st.container(key="section_overview"):
    st.markdown(
        '<div class="eco-label">01 / LIVE CAMPUS SNAPSHOT</div>',
        unsafe_allow_html=True,
    )
    st.header("Campus Overview")

    energy_total = filtered_latest["energy"].sum(min_count=1)
    water_total = filtered_latest["water"].sum(min_count=1)
    waste_total = filtered_latest["waste"].sum(min_count=1)
    occupancy_total = filtered_latest["occupancy"].sum(min_count=1)

    energy_total = 0 if pd.isna(energy_total) else energy_total
    water_total = 0 if pd.isna(water_total) else water_total
    waste_total = 0 if pd.isna(waste_total) else waste_total
    occupancy_total = (
        0 if pd.isna(occupancy_total) else occupancy_total
    )

    c1, c2, c3, c4 = st.columns(4)

    c1.metric("⚡ Energy", f"{energy_total:,.1f} kWh")
    c2.metric("💧 Water", f"{water_total:,.1f} L")
    c3.metric(
        "👥 Recorded occupancy",
        f"{occupancy_total:,.0f} / {CAMPUS_CAPACITY:,}",
    )
    c4.metric("♻️ Waste", f"{waste_total:,.1f} kg")

    last_updated = filtered_latest["timestamp"].max()
    if pd.notna(last_updated):
        st.caption(
            f"Latest selected building readings: "
            f"{last_updated:%d %b %Y, %I:%M %p}"
        )

    st.markdown(
        '<div class="eco-muted">'
        "Totals combine the latest available reading for each selected "
        "building. They are not sums of every historical record and "
        "are not necessarily daily totals."
        "</div>",
        unsafe_allow_html=True,
    )

    if occupancy_total > CAMPUS_CAPACITY:
        st.warning(
            "Recorded occupancy exceeds the 10,000-person reference "
            "capacity. Check whether building counts overlap."
        )


# ============================================================
# SECTION 3 — SUSTAINABILITY INDICATORS
# ============================================================

with st.container(key="section_sustainability"):
    st.markdown(
        '<div class="eco-label">02 / RESOURCE EFFICIENCY</div>',
        unsafe_allow_html=True,
    )
    st.header("Sustainability Indicators")

    energy_per_person = (
        energy_total / occupancy_total
        if occupancy_total > 0 else 0
    )
    water_per_person = (
        water_total / occupancy_total
        if occupancy_total > 0 else 0
    )
    waste_per_person = (
        waste_total / occupancy_total
        if occupancy_total > 0 else 0
    )

    c1, c2, c3 = st.columns(3)

    c1.metric(
        "Energy per recorded person",
        f"{energy_per_person:.2f} kWh/person",
    )
    c2.metric(
        "Water per recorded person",
        f"{water_per_person:.2f} L/person",
    )
    c3.metric(
        "Waste per recorded person",
        f"{waste_per_person:.3f} kg/person",
    )

    st.caption(
        "These are prototype indicators calculated from selected latest "
        "readings. The measurement period and simulated nature of "
        "readings must be considered."
    )


# ============================================================
# SECTION 4 — SUSTAINABILITY SCORE
# ============================================================

with st.container(key="section_score"):
    st.markdown(
        '<div class="eco-label">03 / CAMPUS PERFORMANCE</div>',
        unsafe_allow_html=True,
    )
    st.header("Campus Sustainability Score")

    st.caption(
        "Illustrative prototype score, not an official DSU rating."
    )

    def efficiency_score(actual, target):
        if (
            pd.isna(actual)
            or actual < 0
            or pd.isna(target)
            or target <= 0
        ):
            return 0.0

        score = 75 + 25 * (target - actual) / target
        return round(max(0.0, min(100.0, score)), 1)

    energy_score = efficiency_score(energy_per_person, 5.0)
    water_score = efficiency_score(water_per_person, 100.0)
    waste_score = efficiency_score(waste_per_person, 0.5)

    overall_score = round(
        (energy_score + water_score + waste_score) / 3
    )

    score_col, detail_col = st.columns([1, 2])

    with score_col:
        with st.container(border=True):
            st.markdown("### Overall score")
            st.metric("Prototype score", f"{overall_score}/100")
            st.progress(overall_score / 100)

            if overall_score >= 80:
                st.success("Good prototype score")
            elif overall_score >= 50:
                st.warning("Room for improvement")
            else:
                st.error("Resource use needs attention")

    with detail_col:
        with st.container(border=True):
            st.markdown("### Score breakdown")

            st.write(f"⚡ Energy — **{energy_score:.1f}/100**")
            st.progress(energy_score / 100)

            st.write(f"💧 Water — **{water_score:.1f}/100**")
            st.progress(water_score / 100)

            st.write(f"♻️ Waste — **{waste_score:.1f}/100**")
            st.progress(waste_score / 100)

    st.caption(
        "Targets are illustrative. Validate measurement units, periods "
        "and targets before using this score for real decisions."
    )


# ============================================================
# SECTION 5 — BUILDING CARDS
# ============================================================

with st.container(key="section_buildings"):
    st.markdown(
        '<div class="eco-label">04 / BUILDING STATUS</div>',
        unsafe_allow_html=True,
    )
    st.header("Campus Buildings")

    st.caption(
        "Latest available readings for each building in the selected range."
    )

    card_columns = st.columns(4)

    for index, (_, row) in enumerate(filtered_latest.iterrows()):
        waste = row["waste"]

        if pd.isna(waste):
            status = "⚪ No waste reading"
        elif waste < 50:
            status = "🟢 Lower waste reading"
        elif waste < 80:
            status = "🟡 Moderate waste reading"
        else:
            status = "🔴 High waste reading"

        with card_columns[index % 4]:
            with st.container(border=True):
                st.markdown(f"### {row['building']}")
                st.caption(status)

                for metric, label, unit in [
                    ("energy", "⚡ Energy", "kWh"),
                    ("water", "💧 Water", "L"),
                    ("occupancy", "👥 Occupancy", ""),
                    ("waste", "♻️ Waste", "kg"),
                ]:
                    value = row[metric]

                    if pd.isna(value):
                        st.write(f"{label}: No reading")
                    elif metric == "occupancy":
                        st.write(f"{label}: {value:,.0f}")
                    else:
                        st.write(f"{label}: {value:,.1f} {unit}")


# ============================================================
# SECTION 6 — CAMPUS DIGITAL TWIN
# Original campus_map.py remains untouched.
# ============================================================

with st.container(key="section_map"):
    st.markdown(
        '<div class="eco-label">05 / EXPLORE THE CAMPUS</div>',
        unsafe_allow_html=True,
    )
    st.header("Campus Digital Twin")

    st.caption(
        "Hover over the existing map markers to inspect building readings."
    )

    campus_map = create_campus_map()

    # Keep the original map and hover templates unchanged.
    st.plotly_chart(
        campus_map,
        use_container_width=True,
        key="campus_digital_twin_map",
    )


# ============================================================
# SECTION 7 — BUILDING ANALYSIS + TRENDS
# ============================================================

with st.container(key="section_analysis"):
    st.markdown(
        '<div class="eco-label">06 / DEEP DIVE</div>',
        unsafe_allow_html=True,
    )
    st.header("Building Analysis")

    available_buildings = sorted(
        filtered_latest["building"].dropna().unique().tolist()
    )

    selected_building = st.selectbox(
        "Select a building",
        options=available_buildings,
    )

    building_history = (
        filtered_history[
            filtered_history["building"] == selected_building
        ]
        .sort_values("timestamp")
        .copy()
    )

    if building_history.empty:
        st.info("No historical readings are available for this building.")
    else:
        current = building_history.iloc[-1]

        c1, c2, c3, c4 = st.columns(4)

        c1.metric(
            "⚡ Energy",
            f"{current['energy']:,.1f} kWh"
            if pd.notna(current["energy"]) else "N/A",
        )
        c2.metric(
            "💧 Water",
            f"{current['water']:,.1f} L"
            if pd.notna(current["water"]) else "N/A",
        )
        c3.metric(
            "👥 Occupancy",
            f"{current['occupancy']:,.0f}"
            if pd.notna(current["occupancy"]) else "N/A",
        )
        c4.metric(
            "🌡️ Temperature",
            f"{current['temperature']:.1f} °C"
            if pd.notna(current["temperature"]) else "N/A",
        )

        st.subheader("Consumption Trends")

        if len(building_history) >= 2:
            tabs = st.tabs(["⚡ Energy", "💧 Water", "♻️ Waste"])

            for tab, metric, label, unit in zip(
                tabs,
                ["energy", "water", "waste"],
                ["Energy", "Water", "Waste"],
                ["kWh", "L", "kg"],
            ):
                with tab:
                    plot_data = building_history.dropna(
                        subset=[metric]
                    )

                    if plot_data.empty:
                        st.info(f"No {label.lower()} readings.")
                        continue

                    fig = px.line(
                        plot_data,
                        x="timestamp",
                        y=metric,
                        markers=True,
                        title=f"{label} readings — {selected_building}",
                        labels={
                            "timestamp": "Time",
                            metric: f"{label} ({unit})",
                        },
                    )

                    fig.update_traces(
                        line=dict(color="#ff4fa3", width=3),
                        marker=dict(color="#a78bfa", size=6),
                    )

                    style_chart(fig)

                    st.plotly_chart(
                        fig,
                        use_container_width=True,
                        key=f"trend_{metric}_{selected_building}",
                    )
        else:
            st.info(
                "At least two historical readings are needed for trends."
            )


# ============================================================
# SECTION 8 — BUILDING COMPARISON
# ============================================================

with st.container(key="section_comparison"):
    st.markdown(
        '<div class="eco-label">07 / COMPARE RESOURCES</div>',
        unsafe_allow_html=True,
    )
    st.header("Building Comparison")

    comparison_metric = st.selectbox(
        "Metric to compare",
        options=[
            "energy",
            "water",
            "waste",
            "occupancy",
            "temperature",
        ],
        format_func=lambda value: {
            "energy": "Energy consumption",
            "water": "Water consumption",
            "waste": "Waste",
            "occupancy": "Occupancy",
            "temperature": "Temperature",
        }[value],
    )

    units = {
        "energy": "kWh",
        "water": "L",
        "waste": "kg",
        "occupancy": "people",
        "temperature": "°C",
    }

    comparison_data = (
        filtered_latest.dropna(subset=[comparison_metric])
        .sort_values(comparison_metric, ascending=False)
    )

    if comparison_data.empty:
        st.info("No readings are available for this metric.")
    else:
        fig = px.bar(
            comparison_data,
            x="building",
            y=comparison_metric,
            color=comparison_metric,
            title=f"{comparison_metric.title()} by Building",
            labels={
                "building": "Campus building",
                comparison_metric: units[comparison_metric],
            },
            color_continuous_scale=[
                "#44206b",
                "#a855f7",
                "#ff4fa3",
                "#62d9ff",
            ],
        )

        style_chart(fig)

        st.plotly_chart(
            fig,
            use_container_width=True,
            key="building_comparison_chart",
        )


# ============================================================
# SECTION 9 — SUSTAINABILITY INSIGHTS
# ============================================================

with st.container(key="section_insights"):
    st.markdown(
        '<div class="eco-label">08 / ACTIONABLE FINDINGS</div>',
        unsafe_allow_html=True,
    )
    st.header("Sustainability Insights")

    st.caption(
        "Rule-based observations, not predictions from a trained AI model."
    )

    insights = []

    for metric, icon, label, unit, action in [
        (
            "energy",
            "⚡",
            "energy use",
            "kWh",
            "Review operating hours and electrical loads.",
        ),
        (
            "water",
            "💧",
            "water use",
            "L",
            "Check for leaks and unnecessary water use.",
        ),
        (
            "waste",
            "♻️",
            "waste",
            "kg",
            "Review segregation and collection practices.",
        ),
    ]:
        valid = filtered_latest.dropna(subset=[metric])

        if not valid.empty:
            highest = valid.loc[valid[metric].idxmax()]

            insights.append(
                (
                    icon,
                    f"{highest['building']} has the highest recorded "
                    f"{label} ({highest[metric]:,.1f} {unit}). {action}",
                )
            )

    if insights:
        cols = st.columns(len(insights))

        for index, (icon, message) in enumerate(insights):
            with cols[index]:
                with st.container(border=True):
                    st.markdown(f"### {icon} Insight")
                    st.write(message)
    else:
        st.info("Not enough data to generate insights.")


# ============================================================
# SECTION 10 — SUSTAINABILITY ALERTS
# ============================================================

with st.container(key="section_alerts"):
    st.markdown(
        '<div class="eco-label">09 / THINGS TO REVIEW</div>',
        unsafe_allow_html=True,
    )
    st.header("Sustainability Alerts")

    st.caption(
        "Highlights unusually high readings relative to selected "
        "buildings. These are screening indicators, not safety limits."
    )

    alert_count = 0

    for metric, label, unit in [
        ("energy", "Energy use", "kWh"),
        ("water", "Water use", "L"),
        ("waste", "Waste", "kg"),
    ]:
        valid = filtered_latest.dropna(subset=[metric])

        if len(valid) >= 3:
            threshold = valid[metric].quantile(0.90)
            flagged = valid[valid[metric] > threshold]

            for _, row in flagged.iterrows():
                st.warning(
                    f"{label} is among the highest readings: "
                    f"{row['building']} — {row[metric]:,.1f} {unit}. "
                    "Investigate whether this usage is expected."
                )
                alert_count += 1

    if alert_count == 0:
        st.success(
            "No unusually high readings were identified by "
            "the current comparison rules."
        )


# ============================================================
# FOOTER
# ============================================================

st.markdown(
    """
    <div class="eco-separator"></div>

    <div style="
        text-align: center;
        padding: 24px 8px;
        color: #a6a8c5;
        line-height: 1.9;
    ">
        <strong style="color:#ff83c1;">ECOTWIN DSU</strong><br>
        Sustainable Campus Digital Twin<br>
        <span style="font-size:0.8rem;">
            Prototype dashboard · Readings may be simulated
        </span>
    </div>
    """,
    unsafe_allow_html=True,
)

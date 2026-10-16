
"""
EcoTwin local API for sensor readings and Campus Care.

Run from the project root:
    $env:ECOTWIN_ADMIN_KEY = "your-local-demo-key"
    py -m uvicorn backend.api:app --port 8001

Campus Care and redemption are hackathon prototypes.
Tokens are NOT valid at a canteen until an authorised campus partner
approves the system.
"""

from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Literal
import hmac
import os
import secrets
import sqlite3

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "ecotwin.db"

app = FastAPI(title="EcoTwin Campus API", version="1.4.0")

# CORS: allow local development and the deployed Vercel frontend.
# IMPORTANT: replace the placeholder with your actual Vercel domain.
VERCEL_FRONTEND_URL = (
    "https://eco-twin-dsu.vercel.app"
)

ALLOWED_ORIGINS = (
    [
        f"http://localhost:{port}"
        for port in range(5170, 5180)
    ]
    + [
        f"http://127.0.0.1:{port}"
        for port in range(5170, 5180)
    ]
    + [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        VERCEL_FRONTEND_URL,
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "X-Admin-Key"],
)

REWARDS = {
    "canteen_snack": {"name": "Canteen snack coupon", "points": 60},
    "canteen_drink": {"name": "Refreshment voucher", "points": 40},
    "printing_credits": {"name": "Printing credits", "points": 80},
    "eco_merch": {"name": "Eco merch reward", "points": 180},
}

RESOLUTION_REWARD_POINTS = 20


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def json_value(value: Any):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def connect_db():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_campus_care_tables():
    """Create Campus Care tables and safely migrate older databases."""
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS campus_complaints (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_code TEXT NOT NULL UNIQUE,
                student_name TEXT NOT NULL,
                student_id TEXT NOT NULL,
                category TEXT NOT NULL,
                location TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                priority TEXT NOT NULL DEFAULT 'Normal',
                status TEXT NOT NULL DEFAULT 'submitted',
                points_awarded INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS campus_points_ledger (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                points_delta INTEGER NOT NULL,
                reason TEXT NOT NULL,
                complaint_id INTEGER,
                redemption_id INTEGER,
                created_at TEXT NOT NULL
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS campus_redemptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                redemption_code TEXT NOT NULL UNIQUE,
                student_id TEXT NOT NULL,
                reward_id TEXT NOT NULL,
                reward_name TEXT NOT NULL,
                points_cost INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'DEMO_ONLY',
                created_at TEXT NOT NULL
            )
        """)

        columns = {
            row["name"]
            for row in conn.execute(
                "PRAGMA table_info(campus_redemptions)"
            ).fetchall()
        }

        if "used_at" not in columns:
            conn.execute("""
                ALTER TABLE campus_redemptions
                ADD COLUMN used_at TEXT
            """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_care_complaints_student
            ON campus_complaints(student_id, created_at DESC)
        """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_care_complaints_status
            ON campus_complaints(status, created_at DESC)
        """)


if DB_PATH.exists():
    ensure_campus_care_tables()


def read_rows(limit: int | None = None):
    """Read sensor data; a limit returns the most recent rows in time order."""
    if not DB_PATH.exists():
        return []

    with sqlite3.connect(
        f"file:{DB_PATH.as_posix()}?mode=ro",
        uri=True,
        timeout=5,
    ) as conn:
        conn.row_factory = sqlite3.Row

        if limit:
            rows = conn.execute(
                """
                SELECT *
                FROM sensor_data
                ORDER BY timestamp DESC, id DESC
                LIMIT ?
                """,
                (int(limit),),
            ).fetchall()
            rows = list(reversed(rows))
        else:
            rows = conn.execute(
                "SELECT * FROM sensor_data ORDER BY timestamp ASC, id ASC"
            ).fetchall()

        return [
            {key: json_value(value) for key, value in dict(row).items()}
            for row in rows
        ]


def require_admin(admin_key: str | None):
    """Protect staff actions with the configured admin key."""
    expected = os.getenv("ECOTWIN_ADMIN_KEY", "")

    if not expected:
        raise HTTPException(
            status_code=503,
            detail="Facilities updates are disabled. Set ECOTWIN_ADMIN_KEY.",
        )

    if not admin_key or not hmac.compare_digest(admin_key, expected):
        raise HTTPException(
            status_code=403,
            detail="Facilities desk key is missing or incorrect.",
        )


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "database_exists": DB_PATH.exists(),
        "database_path": str(DB_PATH),
        "mode": "sensor-read-only + campus-care",
    }


@app.get("/api/readings")
def readings():
    """Return the newest reading for each stored building name."""
    if not DB_PATH.exists():
        return {
            "readings": [],
            "updatedAt": None,
            "count": 0,
            "warning": "ecotwin.db was not found at the project root.",
        }

    try:
        records = read_rows()
    except sqlite3.Error as exc:
        return {
            "readings": [],
            "updatedAt": None,
            "count": 0,
            "warning": f"Could not read sensor_data: {exc}",
        }

    latest = {}

    for row in records:
        name = str(row.get("building") or "").strip()
        if not name:
            continue

        key = name.casefold()
        current_key = (
            str(row.get("timestamp") or ""),
            int(row.get("id") or 0),
        )

        if key not in latest:
            latest[key] = row
        else:
            previous = latest[key]
            previous_key = (
                str(previous.get("timestamp") or ""),
                int(previous.get("id") or 0),
            )
            if current_key > previous_key:
                latest[key] = row

    output = list(latest.values())
    newest_stamp = max(
        (str(row.get("timestamp") or "") for row in output),
        default=None,
    )

    return {
        "readings": output,
        "updatedAt": newest_stamp or now_iso(),
        "count": len(output),
    }


@app.get("/api/history")
def history(limit: int = Query(default=8000, ge=100, le=20000)):
    """Return a bounded slice of sensor history for trend charts."""
    if not DB_PATH.exists():
        return {
            "rows": [],
            "count": 0,
            "warning": "ecotwin.db was not found at the project root.",
        }

    try:
        rows = read_rows(limit=limit)
    except sqlite3.Error as exc:
        return {
            "rows": [],
            "count": 0,
            "warning": f"Could not read sensor history: {exc}",
        }

    return {"rows": rows, "count": len(rows)}


class ComplaintCreate(BaseModel):
    student_name: str = Field(min_length=2, max_length=80)
    student_id: str = Field(min_length=3, max_length=32)
    category: Literal[
        "Water & plumbing",
        "Electrical",
        "Waste & cleanliness",
        "Building & classroom",
        "Roads & safety",
        "Wi-Fi & IT",
        "Facilities",
        "Other",
    ]
    location: str = Field(min_length=2, max_length=100)
    title: str = Field(min_length=5, max_length=120)
    description: str = Field(min_length=12, max_length=1200)
    priority: Literal["Normal", "Urgent"] = "Normal"


class ComplaintStatusUpdate(BaseModel):
    status: Literal["acknowledged", "in_progress", "resolved", "declined"]


class RedemptionCreate(BaseModel):
    student_id: str = Field(min_length=3, max_length=32)
    reward_id: Literal[
        "canteen_snack",
        "canteen_drink",
        "printing_credits",
        "eco_merch",
    ]


def complaint_dict(row: sqlite3.Row | dict):
    result = dict(row)
    result["points_awarded"] = int(result.get("points_awarded") or 0)
    return result


@app.get("/api/campus-care/complaints")
def list_complaints(
    student_id: str | None = Query(default=None, min_length=3, max_length=32),
    x_admin_key: str | None = Header(default=None, alias="X-Admin-Key"),
):
    """Students fetch their own tickets; staff fetch the queue."""
    if not DB_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail="The EcoTwin database is not available.",
        )

    ensure_campus_care_tables()

    with connect_db() as conn:
        if student_id:
            rows = conn.execute(
                """
                SELECT *
                FROM campus_complaints
                WHERE student_id = ?
                ORDER BY created_at DESC, id DESC
                """,
                (student_id.strip().upper(),),
            ).fetchall()
        else:
            require_admin(x_admin_key)
            rows = conn.execute(
                """
                SELECT *
                FROM campus_complaints
                ORDER BY
                    CASE priority WHEN 'Urgent' THEN 0 ELSE 1 END,
                    created_at ASC,
                    id ASC
                """
            ).fetchall()

    return {
        "complaints": [complaint_dict(row) for row in rows],
        "count": len(rows),
    }


@app.post("/api/campus-care/complaints", status_code=201)
def create_complaint(body: ComplaintCreate):
    if not DB_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail="The EcoTwin database is not available.",
        )

    ensure_campus_care_tables()
    created = now_iso()

    with connect_db() as conn:
        duplicate = conn.execute(
            """
            SELECT ticket_code
            FROM campus_complaints
            WHERE student_id = ?
              AND category = ?
              AND location = ?
              AND LOWER(title) = LOWER(?)
              AND status NOT IN ('resolved', 'declined')
            LIMIT 1
            """,
            (
                body.student_id.strip().upper(),
                body.category,
                body.location.strip(),
                body.title.strip(),
            ),
        ).fetchone()

        if duplicate:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"A similar report is already open as "
                    f"{duplicate['ticket_code']}. Please track it instead."
                ),
            )

        ticket_code = (
            "EC-"
            + datetime.now(timezone.utc).strftime("%y%m%d")
            + "-"
            + secrets.token_hex(3).upper()
        )

        cursor = conn.execute(
            """
            INSERT INTO campus_complaints (
                ticket_code, student_name, student_id, category,
                location, title, description, priority, status,
                points_awarded, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', 0, ?, ?)
            """,
            (
                ticket_code,
                body.student_name.strip(),
                body.student_id.strip().upper(),
                body.category,
                body.location.strip(),
                body.title.strip(),
                body.description.strip(),
                body.priority,
                created,
                created,
            ),
        )

        row = conn.execute(
            "SELECT * FROM campus_complaints WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()

    return {
        "complaint": complaint_dict(row),
        "ticket_code": ticket_code,
        "message": (
            "Report submitted. EcoPoints are awarded after verified resolution."
        ),
    }


@app.patch("/api/campus-care/complaints/{complaint_id}/status")
def update_complaint_status(
    complaint_id: int,
    body: ComplaintStatusUpdate,
    x_admin_key: str | None = Header(default=None, alias="X-Admin-Key"),
):
    require_admin(x_admin_key)

    if not DB_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail="The EcoTwin database is not available.",
        )

    ensure_campus_care_tables()
    updated = now_iso()
    points_awarded_now = False

    with connect_db() as conn:
        conn.execute("BEGIN IMMEDIATE")

        row = conn.execute(
            "SELECT * FROM campus_complaints WHERE id = ?",
            (complaint_id,),
        ).fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Campus Care ticket not found.",
            )

        points = int(row["points_awarded"] or 0)

        if body.status == "resolved" and points == 0:
            points = RESOLUTION_REWARD_POINTS

            conn.execute(
                """
                INSERT INTO campus_points_ledger (
                    student_id, points_delta, reason, complaint_id, created_at
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    row["student_id"],
                    points,
                    f"Verified resolution · {row['ticket_code']}",
                    complaint_id,
                    updated,
                ),
            )
            points_awarded_now = True

        conn.execute(
            """
            UPDATE campus_complaints
            SET status = ?, points_awarded = ?, updated_at = ?
            WHERE id = ?
            """,
            (body.status, points, updated, complaint_id),
        )

        new_row = conn.execute(
            "SELECT * FROM campus_complaints WHERE id = ?",
            (complaint_id,),
        ).fetchone()

    return {
        "complaint": complaint_dict(new_row),
        "points_awarded_now": points_awarded_now,
    }


@app.get("/api/campus-care/wallet/{student_id}")
def get_wallet(student_id: str):
    if len(student_id.strip()) < 3 or len(student_id) > 32:
        raise HTTPException(
            status_code=422,
            detail="Student ID must be between 3 and 32 characters.",
        )

    if not DB_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail="The EcoTwin database is not available.",
        )

    ensure_campus_care_tables()
    normalized_id = student_id.strip().upper()

    with connect_db() as conn:
        sums = conn.execute(
            """
            SELECT
                COALESCE(SUM(points_delta), 0) AS balance,
                COALESCE(
                    SUM(CASE WHEN points_delta > 0 THEN points_delta ELSE 0 END),
                    0
                ) AS earned,
                COALESCE(
                    SUM(CASE WHEN points_delta < 0 THEN -points_delta ELSE 0 END),
                    0
                ) AS redeemed
            FROM campus_points_ledger
            WHERE student_id = ?
            """,
            (normalized_id,),
        ).fetchone()

        recent = conn.execute(
            """
            SELECT *
            FROM campus_redemptions
            WHERE student_id = ?
            ORDER BY created_at DESC, id DESC
            LIMIT 10
            """,
            (normalized_id,),
        ).fetchall()

    return {
        "student_id": normalized_id,
        "points_balance": int(sums["balance"]),
        "total_earned": int(sums["earned"]),
        "total_redeemed": int(sums["redeemed"]),
        "redemptions": [dict(row) for row in recent],
        "prototype_notice": (
            "Redemption is a prototype and is not valid at a campus outlet "
            "until an authorised partner approves it."
        ),
    }


@app.post("/api/campus-care/redeem", status_code=201)
def redeem_reward(body: RedemptionCreate):
    """Deduct points and create a prototype-only redemption token."""
    if not DB_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail="The EcoTwin database is not available.",
        )

    ensure_campus_care_tables()
    normalized_id = body.student_id.strip().upper()
    reward = REWARDS.get(body.reward_id)

    if reward is None:
        raise HTTPException(status_code=400, detail="Unknown reward.")

    created = now_iso()

    with connect_db() as conn:
        conn.execute("BEGIN IMMEDIATE")

        balance_row = conn.execute(
            """
            SELECT COALESCE(SUM(points_delta), 0) AS balance
            FROM campus_points_ledger
            WHERE student_id = ?
            """,
            (normalized_id,),
        ).fetchone()

        balance = int(balance_row["balance"])

        if balance < reward["points"]:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Not enough EcoPoints. Current balance: {balance}; "
                    f"required: {reward['points']}."
                ),
            )

        redemption_code = "DEMO-" + secrets.token_hex(6).upper()

        cursor = conn.execute(
            """
            INSERT INTO campus_redemptions (
                redemption_code, student_id, reward_id, reward_name,
                points_cost, status, created_at, used_at
            )
            VALUES (?, ?, ?, ?, ?, 'PROTOTYPE_UNUSED', ?, NULL)
            """,
            (
                redemption_code,
                normalized_id,
                body.reward_id,
                reward["name"],
                reward["points"],
                created,
            ),
        )

        conn.execute(
            """
            INSERT INTO campus_points_ledger (
                student_id, points_delta, reason, redemption_id, created_at
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                normalized_id,
                -reward["points"],
                f"Prototype redemption · {reward['name']}",
                cursor.lastrowid,
                created,
            ),
        )

    return {
        "redemption_code": redemption_code,
        "reward_name": reward["name"],
        "points_cost": reward["points"],
        "status": "PROTOTYPE_UNUSED",
        "used_at": None,
        "prototype_only": True,
        "message": (
            "PROTOTYPE ONLY — this token is not valid for payment or "
            "collection at a campus outlet until an authorised canteen "
            "partner approves the system."
        ),
    }


@app.get("/api/campus-care/redemptions/verify/{redemption_code}")
def verify_redemption(
    redemption_code: str,
    x_admin_key: str | None = Header(default=None, alias="X-Admin-Key"),
):
    """Staff-only lookup for a redemption token."""
    require_admin(x_admin_key)

    if not DB_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail="The EcoTwin database is not available.",
        )

    ensure_campus_care_tables()
    code = redemption_code.strip().upper()

    with connect_db() as conn:
        row = conn.execute(
            """
            SELECT id, redemption_code, student_id, reward_id,
                   reward_name, points_cost, status, created_at, used_at
            FROM campus_redemptions
            WHERE redemption_code = ?
            """,
            (code,),
        ).fetchone()

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Redemption token not found.",
        )

    result = dict(row)
    result["prototype_only"] = True
    result["can_mark_used"] = result["status"] == "PROTOTYPE_UNUSED"
    result["message"] = (
        "Prototype verification only. This is not authorisation to provide "
        "goods or services without an approved campus partner."
    )

    return result


@app.patch("/api/campus-care/redemptions/{redemption_code}/use")
def mark_redemption_used(
    redemption_code: str,
    x_admin_key: str | None = Header(default=None, alias="X-Admin-Key"),
):
    """Staff-only, one-time status change for a prototype token."""
    require_admin(x_admin_key)

    if not DB_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail="The EcoTwin database is not available.",
        )

    ensure_campus_care_tables()
    code = redemption_code.strip().upper()
    used_at = now_iso()

    with connect_db() as conn:
        conn.execute("BEGIN IMMEDIATE")

        row = conn.execute(
            """
            SELECT id, redemption_code, student_id, reward_name,
                   points_cost, status, created_at, used_at
            FROM campus_redemptions
            WHERE redemption_code = ?
            """,
            (code,),
        ).fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Redemption token not found.",
            )

        if row["status"] != "PROTOTYPE_UNUSED":
            raise HTTPException(
                status_code=409,
                detail=(
                    "This token cannot be used again. "
                    f"Current status: {row['status']}."
                ),
            )

        cursor = conn.execute(
            """
            UPDATE campus_redemptions
            SET status = 'PROTOTYPE_USED', used_at = ?
            WHERE id = ? AND status = 'PROTOTYPE_UNUSED'
            """,
            (used_at, row["id"]),
        )

        if cursor.rowcount != 1:
            raise HTTPException(
                status_code=409,
                detail="This token has already been used.",
            )

        updated = conn.execute(
            """
            SELECT id, redemption_code, student_id, reward_name,
                   points_cost, status, created_at, used_at
            FROM campus_redemptions
            WHERE id = ?
            """,
            (row["id"],),
        ).fetchone()

    return {
        "redemption": dict(updated),
        "prototype_only": True,
        "message": (
            "Marked as used in the EcoTwin prototype. This does not "
            "authorise a real-world canteen transaction."
        ),
    }

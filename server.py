import json
import mimetypes
import os
import re
import sqlite3
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get("DATA_DIR", ROOT / "data"))
DB_PATH = DATA_DIR / "requests.sqlite3"

ALLOWED_AUTHORS = {"dima", "alexandra"}
ALLOWED_PROFILES = {"dima", "love"}
ALLOWED_KINDS = {"personal", "proposal", "background"}
ALLOWED_CATEGORIES = {"work", "personal", "sport", "date", "study", "family", "background", "other"}
ALLOWED_PARTICIPANTS = {"dima", "alexandra", "both", "background"}
TIME_RE = re.compile(r"^(?:[01]\d|2[0-3]):[0-5]\d$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
DB_LOCK = threading.Lock()

F1_BACKGROUND_EVENTS = [
    ("f1-2026-britain-practice2", "F1: Гран-при Великобритании. Свободная практика 2", "2026-07-03", "00:00", "23:59", ""),
    ("f1-2026-britain-practice1", "F1: Гран-при Великобритании. Свободная практика 1", "2026-07-03", "18:30", "19:30", ""),
    ("f1-2026-britain-sprint-qualifying", "F1: Гран-при Великобритании. Спринт-квалификация", "2026-07-03", "22:30", "23:30", ""),
    ("f1-2026-britain-practice3", "F1: Гран-при Великобритании. Свободная практика 3", "2026-07-04", "00:00", "23:59", ""),
    ("f1-2026-britain-sprint", "F1: Гран-при Великобритании. Спринт", "2026-07-04", "18:00", "19:00", ""),
    ("f1-2026-britain-qualifying", "F1: Гран-при Великобритании. Квалификация", "2026-07-04", "22:00", "23:00", ""),
    ("f1-2026-britain-race", "F1: Гран-при Великобритании. Гонка (52 круга, 306.198 км)", "2026-07-05", "21:00", "23:00", ""),
    ("f1-2026-belgium-sprint-qualifying", "F1: Гран-при Бельгии. Спринт-квалификация", "2026-07-17", "00:00", "23:59", ""),
    ("f1-2026-belgium-practice1", "F1: Гран-при Бельгии. Свободная практика 1", "2026-07-17", "18:30", "19:30", ""),
    ("f1-2026-belgium-practice2", "F1: Гран-при Бельгии. Свободная практика 2", "2026-07-17", "22:00", "23:00", ""),
    ("f1-2026-belgium-sprint", "F1: Гран-при Бельгии. Спринт", "2026-07-18", "00:00", "23:59", ""),
    ("f1-2026-belgium-practice3", "F1: Гран-при Бельгии. Свободная практика 3", "2026-07-18", "17:30", "18:30", ""),
    ("f1-2026-belgium-qualifying", "F1: Гран-при Бельгии. Квалификация", "2026-07-18", "21:00", "22:00", ""),
    ("f1-2026-belgium-race", "F1: Гран-при Бельгии. Гонка (44 круга, 308.052 км)", "2026-07-19", "20:00", "22:00", ""),
    ("f1-2026-hungary-practice1", "F1: Гран-при Венгрии. Свободная практика 1", "2026-07-24", "18:30", "19:30", ""),
    ("f1-2026-hungary-practice2", "F1: Гран-при Венгрии. Свободная практика 2", "2026-07-24", "22:00", "23:00", ""),
    ("f1-2026-hungary-practice3", "F1: Гран-при Венгрии. Свободная практика 3", "2026-07-25", "17:30", "18:30", ""),
    ("f1-2026-hungary-qualifying", "F1: Гран-при Венгрии. Квалификация", "2026-07-25", "21:00", "22:00", ""),
    ("f1-2026-hungary-race", "F1: Гран-при Венгрии. Гонка (70 кругов, 306.630 км)", "2026-07-26", "20:00", "22:00", ""),
    ("f1-2026-netherlands-practice2", "F1: Гран-при Нидерландов. Свободная практика 2", "2026-08-21", "00:00", "23:59", ""),
    ("f1-2026-netherlands-practice1", "F1: Гран-при Нидерландов. Свободная практика 1", "2026-08-21", "17:30", "18:30", ""),
    ("f1-2026-netherlands-sprint-qualifying", "F1: Гран-при Нидерландов. Спринт-квалификация", "2026-08-21", "21:30", "22:30", ""),
    ("f1-2026-netherlands-practice3", "F1: Гран-при Нидерландов. Свободная практика 3", "2026-08-22", "00:00", "23:59", ""),
    ("f1-2026-netherlands-sprint", "F1: Гран-при Нидерландов. Спринт", "2026-08-22", "17:00", "18:00", ""),
    ("f1-2026-netherlands-qualifying", "F1: Гран-при Нидерландов. Квалификация", "2026-08-22", "21:00", "22:00", ""),
    ("f1-2026-netherlands-race", "F1: Гран-при Нидерландов. Гонка (72 круга, 306.587 км)", "2026-08-23", "20:00", "22:00", ""),
    ("f1-2026-italy-practice1", "F1: Гран-при Италии. Свободная практика 1", "2026-09-04", "17:30", "18:30", ""),
    ("f1-2026-italy-practice2", "F1: Гран-при Италии. Свободная практика 2", "2026-09-04", "21:00", "22:00", ""),
    ("f1-2026-italy-practice3", "F1: Гран-при Италии. Свободная практика 3", "2026-09-05", "17:30", "18:30", ""),
    ("f1-2026-italy-qualifying", "F1: Гран-при Италии. Квалификация", "2026-09-05", "21:00", "22:00", ""),
    ("f1-2026-italy-race", "F1: Гран-при Италии. Гонка (53 круга, 306.720 км)", "2026-09-06", "20:00", "22:00", ""),
    ("f1-2026-spain-practice1", "F1: Гран-при Испании. Свободная практика 1", "2026-09-11", "18:30", "19:30", ""),
    ("f1-2026-spain-practice2", "F1: Гран-при Испании. Свободная практика 2", "2026-09-11", "22:00", "23:00", ""),
    ("f1-2026-spain-practice3", "F1: Гран-при Испании. Свободная практика 3", "2026-09-12", "17:30", "18:30", ""),
    ("f1-2026-spain-qualifying", "F1: Гран-при Испании. Квалификация", "2026-09-12", "21:00", "22:00", ""),
    ("f1-2026-spain-race", "F1: Гран-при Испании. Гонка (66 кругов, 307.236 км)", "2026-09-13", "20:00", "22:00", ""),
    ("f1-2026-azerbaijan-practice1", "F1: Гран-при Азербайджана. Свободная практика 1", "2026-09-24", "15:30", "16:30", ""),
    ("f1-2026-azerbaijan-practice2", "F1: Гран-при Азербайджана. Свободная практика 2", "2026-09-24", "19:00", "20:00", ""),
    ("f1-2026-azerbaijan-practice3", "F1: Гран-при Азербайджана. Свободная практика 3", "2026-09-25", "15:30", "16:30", ""),
    ("f1-2026-azerbaijan-qualifying", "F1: Гран-при Азербайджана. Квалификация", "2026-09-25", "19:00", "20:00", ""),
    ("f1-2026-azerbaijan-race", "F1: Гран-при Азербайджана. Гонка (51 круг, 306.049 км)", "2026-09-26", "18:00", "20:00", ""),
    ("f1-2026-singapore-practice2", "F1: Гран-при Сингапура. Свободная практика 2", "2026-10-09", "00:00", "23:59", ""),
    ("f1-2026-singapore-practice1", "F1: Гран-при Сингапура. Свободная практика 1", "2026-10-09", "15:30", "16:30", ""),
    ("f1-2026-singapore-sprint-qualifying", "F1: Гран-при Сингапура. Спринт Квалификация", "2026-10-09", "19:30", "20:30", ""),
    ("f1-2026-singapore-practice3", "F1: Гран-при Сингапура. Свободная практика 3", "2026-10-10", "00:00", "23:59", ""),
    ("f1-2026-singapore-sprint", "F1: Гран-при Сингапура. Спринт", "2026-10-10", "16:00", "17:00", ""),
    ("f1-2026-singapore-qualifying", "F1: Гран-при Сингапура. Квалификация", "2026-10-10", "20:00", "21:00", ""),
    ("f1-2026-singapore-race", "F1: Гран-при Сингапура. Гонка (62 круга, 305.337 км)", "2026-10-11", "19:00", "21:00", ""),
    ("f1-2026-usa-sprint-qualifying", "F1: Гран-при США. Спринт-квалификация", "2026-10-23", "00:00", "23:59", ""),
    ("f1-2026-usa-practice1", "F1: Гран-при США. Свободная практика 1", "2026-10-24", "00:30", "01:30", ""),
    ("f1-2026-usa-practice2", "F1: Гран-при США. Свободная практика 2", "2026-10-24", "04:00", "05:00", ""),
    ("f1-2026-usa-sprint", "F1: Гран-при США. Спринт", "2026-10-24", "00:00", "23:59", ""),
    ("f1-2026-usa-practice3", "F1: Гран-при США. Свободная практика 3", "2026-10-25", "00:30", "01:30", ""),
    ("f1-2026-usa-qualifying", "F1: Гран-при США. Квалификация", "2026-10-25", "04:00", "05:00", ""),
    ("f1-2026-usa-race", "F1: Гран-при США. Гонка (56 кругов, 308.405 км)", "2026-10-26", "03:00", "05:00", ""),
    ("f1-2026-mexico-practice1", "F1: Гран-при Мексики. Свободная практика 1", "2026-10-31", "01:30", "02:30", ""),
    ("f1-2026-mexico-practice2", "F1: Гран-при Мексики. Свободная практика 2", "2026-10-31", "05:00", "06:00", ""),
    ("f1-2026-mexico-practice3", "F1: Гран-при Мексики. Свободная практика 3", "2026-11-01", "00:30", "01:30", ""),
    ("f1-2026-mexico-qualifying", "F1: Гран-при Мексики. Квалификация", "2026-11-01", "04:00", "05:00", ""),
    ("f1-2026-mexico-race", "F1: Гран-при Мексики. Гонка (71 круг, 305.354 км)", "2026-11-02", "03:00", "05:00", ""),
    ("f1-2026-brazil-sprint-qualifying", "F1: Гран-при Бразилии. Спринт-квалификация", "2026-11-06", "00:00", "23:59", ""),
    ("f1-2026-brazil-practice1", "F1: Гран-при Бразилии. Свободная практика 1", "2026-11-06", "22:30", "23:30", ""),
    ("f1-2026-brazil-practice2", "F1: Гран-при Бразилии. Свободная практика 2", "2026-11-07", "02:00", "03:00", ""),
    ("f1-2026-brazil-sprint", "F1: Гран-при Бразилии. Спринт", "2026-11-07", "00:00", "23:59", ""),
    ("f1-2026-brazil-practice3", "F1: Гран-при Бразилии. Свободная практика 3", "2026-11-07", "21:30", "22:30", ""),
    ("f1-2026-brazil-qualifying", "F1: Гран-при Бразилии. Квалификация", "2026-11-08", "01:00", "02:00", ""),
    ("f1-2026-brazil-race", "F1: Гран-при Бразилии. Гонка (71 круг, 305.879 км)", "2026-11-09", "00:00", "02:00", ""),
    ("f1-2026-las-vegas-practice1", "F1: Гран-при Лас-Вегаса. Свободная практика 1", "2026-11-20", "07:30", "08:30", ""),
    ("f1-2026-las-vegas-practice2", "F1: Гран-при Лас-Вегаса. Свободная практика 2", "2026-11-20", "11:00", "12:00", ""),
    ("f1-2026-las-vegas-practice3", "F1: Гран-при Лас-Вегаса. Свободная практика 3", "2026-11-21", "07:30", "08:30", ""),
    ("f1-2026-las-vegas-qualifying", "F1: Гран-при Лас-Вегаса. Квалификация", "2026-11-21", "11:00", "12:00", ""),
    ("f1-2026-las-vegas-race", "F1: Гран-при Лас-Вегаса. Гонка (50 кругов, 309.958 км)", "2026-11-22", "11:00", "13:00", ""),
    ("f1-2026-qatar-sprint-qualifying", "F1: Гран-при Катара. Спринт-квалификация", "2026-11-27", "00:00", "23:59", ""),
    ("f1-2026-qatar-practice1", "F1: Гран-при Катара. Свободная практика 1", "2026-11-27", "20:30", "21:30", ""),
    ("f1-2026-qatar-practice2", "F1: Гран-при Катара. Свободная практика 2", "2026-11-28", "00:00", "01:00", ""),
    ("f1-2026-qatar-sprint", "F1: Гран-при Катара. Спринт", "2026-11-28", "00:00", "23:59", ""),
    ("f1-2026-qatar-practice3", "F1: Гран-при Катара. Свободная практика 3", "2026-11-28", "21:30", "22:30", ""),
    ("f1-2026-qatar-qualifying", "F1: Гран-при Катара. Квалификация", "2026-11-29", "01:00", "02:00", ""),
    ("f1-2026-qatar-race", "F1: Гран-при Катара. Гонка (57 кругов, 308.611 км)", "2026-11-29", "23:00", "2026-11-30", "01:00", ""),
    ("f1-2026-abu-dhabi-practice1", "F1: Гран-при Абу-Даби. Свободная практика 1", "2026-12-04", "16:30", "17:30", ""),
    ("f1-2026-abu-dhabi-practice2", "F1: Гран-при Абу-Даби. Свободная практика 2", "2026-12-04", "20:00", "21:00", ""),
    ("f1-2026-abu-dhabi-practice3", "F1: Гран-при Абу-Даби. Свободная практика 3", "2026-12-05", "17:30", "18:30", ""),
    ("f1-2026-abu-dhabi-qualifying", "F1: Гран-при Абу-Даби. Квалификация", "2026-12-05", "21:00", "22:00", ""),
    ("f1-2026-abu-dhabi-race", "F1: Гран-при Абу-Даби. Гонка (58 кругов, 306.183 км)", "2026-12-06", "20:00", "22:00", ""),
]


def connect():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_database():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with connect() as db:
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS meeting_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                profile TEXT NOT NULL,
                date TEXT NOT NULL,
                start TEXT NOT NULL,
                end TEXT NOT NULL,
                author TEXT NOT NULL,
                message TEXT NOT NULL DEFAULT '',
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(profile, date, start, end, author)
            )
            """
        )
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS schedule_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_key TEXT UNIQUE,
                title TEXT NOT NULL,
                date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                start TEXT NOT NULL,
                end TEXT NOT NULL,
                kind TEXT NOT NULL,
                category TEXT NOT NULL,
                participant TEXT NOT NULL,
                note TEXT NOT NULL DEFAULT '',
                author TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        columns = {row["name"] for row in db.execute("PRAGMA table_info(schedule_events)").fetchall()}
        if "source_key" not in columns:
            db.execute("ALTER TABLE schedule_events ADD COLUMN source_key TEXT")
        if "end_date" not in columns:
            db.execute("ALTER TABLE schedule_events ADD COLUMN end_date TEXT")
            db.execute("UPDATE schedule_events SET end_date = date WHERE end_date IS NULL")
        db.execute(
            """
            CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_events_source_key
            ON schedule_events(source_key)
            """
        )
        seed_f1_events(db)


def seed_f1_events(db):
    source_keys = [event[0] for event in F1_BACKGROUND_EVENTS]
    placeholders = ",".join("?" for _ in source_keys)
    db.execute(
        f"DELETE FROM schedule_events WHERE source_key LIKE 'f1-2026-%' AND source_key NOT IN ({placeholders})",
        source_keys,
    )
    for event in F1_BACKGROUND_EVENTS:
        if len(event) == 6:
            source_key, title, date, start, end, note = event
            end_date = date
        else:
            source_key, title, date, start, end_date, end, note = event
        db.execute(
            """
            INSERT INTO schedule_events
                (source_key, title, date, start, end_date, end, kind, category, participant, note, author)
            VALUES
                (?, ?, ?, ?, ?, ?, 'background', 'background', 'background', ?, 'dima')
            ON CONFLICT(source_key)
            DO UPDATE SET
                title=excluded.title,
                date=excluded.date,
                start=excluded.start,
                end_date=excluded.end_date,
                end=excluded.end,
                kind=excluded.kind,
                category=excluded.category,
                participant=excluded.participant,
                note=excluded.note,
                updated_at=CURRENT_TIMESTAMP
            """,
            (source_key, title, date, start, end_date, end, note),
        )


def minutes(time_value):
    hours, mins = time_value.split(":")
    return int(hours) * 60 + int(mins)


def validate_time_range(start, end):
    if not TIME_RE.fullmatch(start) or not TIME_RE.fullmatch(end):
        raise ValueError("Некорректное время")
    if minutes(end) <= minutes(start):
        raise ValueError("Конец должен быть позже начала")


def validate_slot(payload):
    profile = str(payload.get("profile", ""))
    date = str(payload.get("date", ""))
    start = str(payload.get("start", ""))
    end = str(payload.get("end", ""))
    author = str(payload.get("author", ""))
    message = str(payload.get("message", "")).strip()
    if profile not in ALLOWED_PROFILES:
        raise ValueError("Неизвестное расписание")
    if author not in ALLOWED_AUTHORS:
        raise ValueError("Неизвестный пользователь")
    if not DATE_RE.fullmatch(date):
        raise ValueError("Некорректная дата")
    validate_time_range(start, end)
    if len(message) > 500:
        raise ValueError("Сообщение слишком длинное")
    return profile, date, start, end, author, message


def validate_event(payload):
    title = str(payload.get("title", "")).strip()
    date = str(payload.get("date", "")).strip()
    end_date = str(payload.get("end_date", payload.get("date", ""))).strip()
    start = str(payload.get("start", "")).strip()
    end = str(payload.get("end", "")).strip()
    kind = str(payload.get("kind", "")).strip()
    category = str(payload.get("category", "")).strip()
    participant = str(payload.get("participant", "")).strip()
    note = str(payload.get("note", "")).strip()
    author = str(payload.get("author", "")).strip()

    if not title:
        raise ValueError("Нужно указать название")
    if len(title) > 120:
        raise ValueError("Название слишком длинное")
    if not DATE_RE.fullmatch(date):
        raise ValueError("Некорректная дата")
    if not DATE_RE.fullmatch(end_date):
        raise ValueError("Некорректная дата окончания")
    if end_date < date:
        raise ValueError("Дата окончания не может быть раньше даты начала")
    if not TIME_RE.fullmatch(start) or not TIME_RE.fullmatch(end):
        raise ValueError("Некорректное время")
    if end_date == date and minutes(end) <= minutes(start):
        raise ValueError("Конец должен быть позже начала")
    if kind not in ALLOWED_KINDS:
        raise ValueError("Неизвестный тип события")
    if category not in ALLOWED_CATEGORIES:
        raise ValueError("Неизвестная категория")
    if participant not in ALLOWED_PARTICIPANTS:
        raise ValueError("Неизвестный участник")
    if author not in ALLOWED_AUTHORS:
        raise ValueError("Неизвестный автор")
    if len(note) > 700:
        raise ValueError("Комментарий слишком длинный")
    if kind == "background":
        category = "background"
        participant = "background"

    return {
        "title": title,
        "date": date,
        "end_date": end_date,
        "start": start,
        "end": end,
        "kind": kind,
        "category": category,
        "participant": participant,
        "note": note,
        "author": author,
    }


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length > 8192:
            raise ValueError("Слишком большой запрос")
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/events":
            with DB_LOCK, connect() as db:
                rows = db.execute(
                    """
                    SELECT id, source_key, title, date, end_date, start, end, kind, category, participant, note, author, created_at, updated_at
                    FROM schedule_events
                    ORDER BY date, start, end_date, end, id
                    """
                ).fetchall()
            self.send_json(200, {"events": [dict(row) for row in rows]})
            return
        if parsed.path == "/api/requests":
            with DB_LOCK, connect() as db:
                rows = db.execute(
                    "SELECT profile, date, start, end, author, message, updated_at FROM meeting_requests ORDER BY updated_at"
                ).fetchall()
            self.send_json(200, {"requests": [dict(row) for row in rows]})
            return
        if parsed.path == "/":
            self.path = "/index.html"
        elif parsed.path not in {"/index.html", "/styles.css", "/app.js"}:
            self.send_error(404, "Not found")
            return
        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/events":
            try:
                event = validate_event(self.read_json())
                with DB_LOCK, connect() as db:
                    cursor = db.execute(
                        """
                        INSERT INTO schedule_events
                            (title, date, end_date, start, end, kind, category, participant, note, author)
                        VALUES
                            (:title, :date, :end_date, :start, :end, :kind, :category, :participant, :note, :author)
                        """,
                        event,
                    )
                    row = db.execute(
                        """
                        SELECT id, source_key, title, date, end_date, start, end, kind, category, participant, note, author, created_at, updated_at
                        FROM schedule_events
                        WHERE id = ?
                        """,
                        (cursor.lastrowid,),
                    ).fetchone()
                self.send_json(201, {"event": dict(row)})
            except (ValueError, json.JSONDecodeError) as error:
                self.send_json(400, {"error": str(error)})
            return
        if parsed.path == "/api/requests":
            try:
                profile, date, start, end, author, message = validate_slot(self.read_json())
                with DB_LOCK, connect() as db:
                    db.execute(
                        """
                        INSERT INTO meeting_requests (profile, date, start, end, author, message, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                        ON CONFLICT(profile, date, start, end, author)
                        DO UPDATE SET message=excluded.message, updated_at=CURRENT_TIMESTAMP
                        """,
                        (profile, date, start, end, author, message),
                    )
                self.send_json(200, {"ok": True})
            except (ValueError, json.JSONDecodeError) as error:
                self.send_json(400, {"error": str(error)})
            return
        self.send_json(404, {"error": "Не найдено"})

    def do_PUT(self):
        parsed = urlparse(self.path)
        event_id = self.event_id_from_path(parsed.path)
        if event_id is None:
            self.send_json(404, {"error": "Не найдено"})
            return
        try:
            event = validate_event(self.read_json())
            with DB_LOCK, connect() as db:
                cursor = db.execute(
                    """
                    UPDATE schedule_events
                    SET title=:title,
                        date=:date,
                        end_date=:end_date,
                        start=:start,
                        end=:end,
                        kind=:kind,
                        category=:category,
                        participant=:participant,
                        note=:note,
                        author=:author,
                        updated_at=CURRENT_TIMESTAMP
                    WHERE id=:id
                    """,
                    {**event, "id": event_id},
                )
                if cursor.rowcount == 0:
                    self.send_json(404, {"error": "Событие не найдено"})
                    return
                row = db.execute(
                    """
                    SELECT id, source_key, title, date, end_date, start, end, kind, category, participant, note, author, created_at, updated_at
                    FROM schedule_events
                    WHERE id = ?
                    """,
                    (event_id,),
                ).fetchone()
            self.send_json(200, {"event": dict(row)})
        except (ValueError, json.JSONDecodeError) as error:
            self.send_json(400, {"error": str(error)})

    def do_DELETE(self):
        parsed = urlparse(self.path)
        event_id = self.event_id_from_path(parsed.path)
        if event_id is not None:
            with DB_LOCK, connect() as db:
                cursor = db.execute("DELETE FROM schedule_events WHERE id = ?", (event_id,))
            if cursor.rowcount == 0:
                self.send_json(404, {"error": "Событие не найдено"})
            else:
                self.send_json(200, {"ok": True})
            return
        if parsed.path == "/api/requests":
            try:
                profile, date, start, end, author, _ = validate_slot(self.read_json())
                with DB_LOCK, connect() as db:
                    db.execute(
                        "DELETE FROM meeting_requests WHERE profile=? AND date=? AND start=? AND end=? AND author=?",
                        (profile, date, start, end, author),
                    )
                self.send_json(200, {"ok": True})
            except (ValueError, json.JSONDecodeError) as error:
                self.send_json(400, {"error": str(error)})
            return
        self.send_json(404, {"error": "Не найдено"})

    @staticmethod
    def event_id_from_path(path):
        match = re.fullmatch(r"/api/events/(\d+)", path)
        return int(match.group(1)) if match else None

    def log_message(self, format_string, *args):
        print(f"{self.address_string()} - {format_string % args}")


if __name__ == "__main__":
    init_database()
    port = int(os.environ.get("PORT", "8080"))
    mimetypes.add_type("text/javascript", ".js")
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"Serving on 0.0.0.0:{port}, database: {DB_PATH}")
    server.serve_forever()

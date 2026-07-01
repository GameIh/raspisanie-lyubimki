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
                title TEXT NOT NULL,
                date TEXT NOT NULL,
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
    validate_time_range(start, end)
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
                    SELECT id, title, date, start, end, kind, category, participant, note, author, created_at, updated_at
                    FROM schedule_events
                    ORDER BY date, start, end, id
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
                            (title, date, start, end, kind, category, participant, note, author)
                        VALUES
                            (:title, :date, :start, :end, :kind, :category, :participant, :note, :author)
                        """,
                        event,
                    )
                    row = db.execute(
                        """
                        SELECT id, title, date, start, end, kind, category, participant, note, author, created_at, updated_at
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
                    SELECT id, title, date, start, end, kind, category, participant, note, author, created_at, updated_at
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

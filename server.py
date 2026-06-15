import json
import mimetypes
import os
import sqlite3
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
DATA_DIR = Path(os.environ.get("DATA_DIR", ROOT / "data"))
DB_PATH = DATA_DIR / "requests.sqlite3"
ALLOWED_AUTHORS = {"dima": "Дима", "alexandra": "Александра"}
ALLOWED_PROFILES = {"dima", "love"}
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
    if len(date) != 10 or len(start) != 5 or len(end) != 5:
        raise ValueError("Некорректное время")
    if len(message) > 500:
        raise ValueError("Сообщение слишком длинное")
    return profile, date, start, end, author, message


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
        if length > 4096:
            raise ValueError("Слишком большой запрос")
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def do_GET(self):
        parsed = urlparse(self.path)
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
        if urlparse(self.path).path != "/api/requests":
            self.send_json(404, {"error": "Не найдено"})
            return
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

    def do_DELETE(self):
        if urlparse(self.path).path != "/api/requests":
            self.send_json(404, {"error": "Не найдено"})
            return
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

    def log_message(self, format_string, *args):
        print(f"{self.address_string()} - {format_string % args}")


if __name__ == "__main__":
    init_database()
    port = int(os.environ.get("PORT", "8080"))
    mimetypes.add_type("text/javascript", ".js")
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"Serving on 0.0.0.0:{port}, database: {DB_PATH}")
    server.serve_forever()

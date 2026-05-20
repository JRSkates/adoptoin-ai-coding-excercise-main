import uuid

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from db import get_db, init_db

app = FastAPI()
init_db()


@app.get("/api/usecases")
def list_usecases():
    conn = get_db()
    rows = conn.execute("SELECT * FROM usecases ORDER BY rowid DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.get("/api/usecases/{usecase_id}")
def get_usecase(usecase_id: str):
    conn = get_db()
    row = conn.execute("SELECT * FROM usecases WHERE id = ?", (usecase_id,)).fetchone()
    conn.close()
    return dict(row)


@app.post("/api/usecases")
async def create_usecase(request: Request):
    data = await request.json()
    new_id = str(uuid.uuid4())
    conn = get_db()
    conn.execute(
        "INSERT INTO usecases (id, title, body, ai_tool, time_saved_minutes) VALUES (?, ?, ?, ?, ?)",
        (
            new_id,
            data["title"],
            data["body"],
            data["ai_tool"],
            data["time_saved_minutes"],
        ),
    )
    conn.commit()
    conn.close()
    return {"id": new_id}


@app.delete("/api/usecases")
def delete_all_usecases():
    conn = get_db()
    cursor = conn.execute("DELETE FROM usecases")
    conn.commit()
    deleted = cursor.rowcount
    conn.close()
    return {"deleted": deleted}


@app.get("/usecase/{rest:path}")
def serve_spa(rest: str):
    return FileResponse("static/index.html")


app.mount("/", StaticFiles(directory="static", html=True), name="static")

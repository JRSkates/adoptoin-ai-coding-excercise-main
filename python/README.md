# Python starter — AI Use Case Tracker

FastAPI + SQLite + vanilla JS. Single process serves both the API and the static UI.

## Setup

```sh
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```sh
uvicorn main:app --reload
```

Then open <http://localhost:8000>.

## Layout

```
main.py            FastAPI app and routes
db.py              SQLite connection and schema
static/            HTML, CSS, JS served by the same process
  index.html
  app.js
  style.css
usecases.db        SQLite file (created on first run)
```

## Tests

`pytest` is installed but there are no tests yet. Run them with:

```sh
pytest
```

import Database from "better-sqlite3";

const dbFile = process.env.VITEST ? ":memory:" : "usecases.db";
const db = new Database(dbFile);

db.exec(`
    CREATE TABLE IF NOT EXISTS usecases (
        id TEXT PRIMARY KEY,
        title TEXT,
        body TEXT,
        ai_tool TEXT,
        time_saved_minutes INTEGER
    )
`);

export default db;

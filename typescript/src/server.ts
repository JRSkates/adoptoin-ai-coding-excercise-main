import express from "express";
import path from "path";
import { randomUUID } from "crypto";
import db from "./db";

export const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/usecases", (req, res) => {
    const rows = db
        .prepare("SELECT * FROM usecases ORDER BY rowid DESC")
        .all();
    res.json(rows);
});

app.get("/api/usecases/:id", (req, res) => {
    const row = db
        .prepare("SELECT * FROM usecases WHERE id = ?")
        .get(req.params.id);
    res.json(row);
});

app.post("/api/usecases", (req, res) => {
    const id = randomUUID();
    const { title, body, ai_tool, time_saved_minutes } = req.body;

    const minutes = Number(time_saved_minutes);

    if (!Number.isInteger(minutes) || minutes < 0) {
        return res.status(400).json({ error: "time_saved_minutes must be a non-negative integer" });
    }
    
    db.prepare(
        "INSERT INTO usecases (id, title, body, ai_tool, time_saved_minutes) VALUES (?, ?, ?, ?, ?)"
    ).run(id, title, body, ai_tool, minutes);
    res.json({ id });
});

app.delete("/api/usecases", (req, res) => {
    const result = db.prepare("DELETE FROM usecases").run();
    res.json({ deleted: result.changes });
});

app.get(["/usecase/*", "/stats"], (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.get("/api/stats", (req, res) => {
    try {
        const totalRow = db
            .prepare<[], { total: number | null }>(
                "SELECT COALESCE(SUM(CAST(time_saved_minutes AS INTEGER)), 0) AS total FROM usecases"
            )
            .get();

        const rawByTool = db
            .prepare<[], { ai_tool: string | null; usecase_count: number | null; total_time_saved: number | null }>(
                `SELECT
                    ai_tool,
                    COUNT(*) AS usecase_count,
                    COALESCE(SUM(CAST(time_saved_minutes AS INTEGER)), 0) AS total_time_saved
                 FROM usecases
                 GROUP BY ai_tool
                 ORDER BY total_time_saved DESC`
            )
            .all();

        const byTool = rawByTool
            .filter((row) =>
                typeof row.ai_tool === "string" &&
                row.ai_tool.trim().length > 0 &&
                Number.isInteger(row.usecase_count) &&
                (row.usecase_count ?? -1) >= 0 &&
                Number.isFinite(row.total_time_saved) &&
                (row.total_time_saved ?? -1) >= 0
            )
            .map((row) => ({
                ai_tool: row.ai_tool!.trim(),
                usecase_count: row.usecase_count!,
                total_time_saved: row.total_time_saved!,
            }));

        const totalTimeSaved = Number.isFinite(totalRow?.total) ? Number(totalRow!.total) : 0;

        res.json({
            totalTimeSaved,
            byTool,
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

if (!process.env.VITEST) {
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`Listening on http://localhost:${PORT}`);
    });
}

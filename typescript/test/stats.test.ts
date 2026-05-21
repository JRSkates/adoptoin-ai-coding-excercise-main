import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import db from "../src/db";
import { app } from "../src/server";

describe.sequential("stats + validation API", () => {
    let server: ReturnType<typeof app.listen>;
    let baseUrl = "";

    beforeAll(async () => {
        server = app.listen(0);
        await new Promise<void>((resolve) => server.once("listening", () => resolve()));
        const address = server.address();
        if (!address || typeof address === "string") {
            throw new Error("Unable to determine test server port");
        }
        baseUrl = `http://127.0.0.1:${address.port}`;
    });

    afterAll(async () => {
        await new Promise<void>((resolve, reject) => {
            server.close((err?: Error) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    });

    beforeEach(() => {
        db.prepare("DELETE FROM usecases").run();
    });

    async function createUsecase(payload: {
        title: string;
        body: string;
        ai_tool: string;
        time_saved_minutes: number;
    }) {
        const res = await fetch(`${baseUrl}/api/usecases`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        expect(res.status).toBe(200);
        const body = await res.json() as { id: string };
        expect(typeof body.id).toBe("string");
        return body.id;
    }

    it("empty DB returns { totalTimeSaved: 0, byTool: [] }", async () => {
        const res = await fetch(`${baseUrl}/api/stats`);
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body).toEqual({
            totalTimeSaved: 0,
            byTool: [],
        });
    });

    it("one use case returns correct total/count", async () => {
        await createUsecase({
            title: "Draft release notes",
            body: "Used AI to summarize commit history",
            ai_tool: "ChatGPT",
            time_saved_minutes: 25,
        });

        const res = await fetch(`${baseUrl}/api/stats`);
        expect(res.status).toBe(200);

        const body = await res.json() as {
            totalTimeSaved: number;
            byTool: Array<{ ai_tool: string; usecase_count: number; total_time_saved: number }>;
        };

        expect(body.totalTimeSaved).toBe(25);
        expect(body.byTool).toEqual([
            {
                ai_tool: "ChatGPT",
                usecase_count: 1,
                total_time_saved: 25,
            },
        ]);
    });

    it("multiple use cases for same tool are grouped", async () => {
        await createUsecase({
            title: "Refactor helper",
            body: "Generated skeleton",
            ai_tool: "Claude",
            time_saved_minutes: 10,
        });
        await createUsecase({
            title: "Write tests",
            body: "Generated test outlines",
            ai_tool: "Claude",
            time_saved_minutes: 15,
        });
        await createUsecase({
            title: "Summarize docs",
            body: "Condensed long doc",
            ai_tool: "ChatGPT",
            time_saved_minutes: 5,
        });

        const res = await fetch(`${baseUrl}/api/stats`);
        expect(res.status).toBe(200);

        const body = await res.json() as {
            totalTimeSaved: number;
            byTool: Array<{ ai_tool: string; usecase_count: number; total_time_saved: number }>;
        };

        expect(body.totalTimeSaved).toBe(30);

        const claude = body.byTool.find((tool) => tool.ai_tool === "Claude");
        expect(claude).toEqual({
            ai_tool: "Claude",
            usecase_count: 2,
            total_time_saved: 25,
        });

        const chatgpt = body.byTool.find((tool) => tool.ai_tool === "ChatGPT");
        expect(chatgpt).toEqual({
            ai_tool: "ChatGPT",
            usecase_count: 1,
            total_time_saved: 5,
        });
    });

    it("invalid time_saved_minutes POST returns 400", async () => {
        const res = await fetch(`${baseUrl}/api/usecases`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: "Bad input",
                body: "Negative value should fail",
                ai_tool: "Claude",
                time_saved_minutes: -3,
            }),
        });

        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body).toEqual({
            error: "Time saved must be a non-negative number",
        });
    });
});

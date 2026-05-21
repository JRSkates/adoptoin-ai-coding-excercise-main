const app = document.getElementById("app");

function navigate(path) {
    history.pushState({}, "", path);
    render();
}

async function render() {
    const path = location.pathname;
    if (path === "/" || path === "") {
        await renderList();
    } else if (path === "/usecase/new") {
        renderCreate();
    } else if (path.startsWith("/usecase/")) {
        const id = path.slice("/usecase/".length);
        await renderView(id);
    } else if (path === "/stats") {
        await renderStats();
    } else {
        app.textContent = "Not found";
    }
}

async function renderList() {
    const res = await fetch("/api/usecases");
    const usecases = await res.json();
    app.innerHTML = `
        <button data-href="/usecase/new">New use case</button>
        <button data-href="/stats">View stats</button>
        <ul class="list">
            ${usecases.map(u => `
                <li>
                    <a href="/usecase/${u.id}" data-link>${u.title}</a>
                    <span class="meta">${u.ai_tool} · ${u.time_saved_minutes} min saved</span>
                </li>
            `).join("")}
        </ul>
    `;

    // await fetchStats();
}

async function renderView(id) {
    const res = await fetch(`/api/usecases/${id}`);
    const u = await res.json();
    app.innerHTML = `
        <button data-href="/">← Back</button>
        <article>
            <h2>${u.title}</h2>
            <p class="meta"><strong>AI tool:</strong> ${u.ai_tool}</p>
            <p class="meta"><strong>Time saved:</strong> ${u.time_saved_minutes} minutes</p>
            <p>${u.body}</p>
        </article>
    `;
}

function renderCreate() {
    try{ 
        app.innerHTML = `
            <button data-href="/">← Back</button>
            <form id="create-form">
                <p id="create-error" class="error" role="alert" style="display:none;"></p>
                <label>Title <input name="title"></label>
                <label>Body <textarea name="body"></textarea></label>
                <label>AI tool used <input name="ai_tool"></label>
                <label>Time saved (minutes) <input name="time_saved_minutes"></label>
                <button type="submit">Create</button>
            </form>
        `;
        document.getElementById("create-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            const errorEl = document.getElementById("create-error");
            errorEl.textContent = "";
            errorEl.style.display = "none";

            const data = Object.fromEntries(new FormData(e.target));
            const res = await fetch("/api/usecases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                let message = "Unable to create use case. Please check your input and try again.";
                try {
                    const body = await res.json();
                    if (typeof body?.error === "string" && body.error.trim()) {
                        message = body.error;
                    }
                } catch (_err) {
                    // Keep fallback message when response is not JSON.
                }

                errorEl.textContent = message;
                errorEl.style.display = "block";
                return;
            }

            const { id } = await res.json();
            navigate(`/usecase/${id}`);
        });
    } catch (err) {
        console.error("Failed to render create form:", err);
        app.innerHTML = `
            <button data-href="/">← Back</button>
            <p>Failed to load form. Please try again later.</p>
        `;
    }

}

async function renderStats() {
    try {
        const res = await fetch("/api/stats");
        if (!res.ok) throw new Error(`HTTP error, status: ${res.status}`);

        const data = await res.json();
        console.log("Stats:", data);
        
        app.innerHTML = `
            <button data-href="/">← Back</button>
            <h2>Statistics</h2>
            <p>Total time saved across all use cases: <strong>${data.totalTimeSaved} minutes</strong></p>
            <ul class="list">
                ${data.byTool.map(t => `
                    <li>
                        <strong>${t.ai_tool}:</strong> ${t.usecase_count} use cases, ${t.total_time_saved} minutes saved
                    </li>
                `).join("")}
            </ul>
        `;
    } catch (err) {
        console.error("Failed to load stats:", err);
        app.innerHTML = `
            <button data-href="/">← Back</button>
            <h2>Statistics</h2>
            <p>Failed to load statistics. Please try again later.</p>
        `;
    }
}

document.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-link]");
    if (link) {
        e.preventDefault();
        navigate(link.getAttribute("href"));
        return;
    }
    const btn = e.target.closest("button[data-href]");
    if (btn) {
        e.preventDefault();
        navigate(btn.getAttribute("data-href"));
    }
});

window.addEventListener("popstate", render);
render();

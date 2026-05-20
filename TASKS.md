# Candidate Tasks — AI Use Case Tracker

The starter has known gaps that authors would hit immediately — no edit, no delete-one, no
validation, raw `innerHTML` injection of user content, `time_saved_minutes` stored as TEXT,
no 404 handling on missing IDs, and the only delete endpoint nukes the whole table.

**Decisions:**
- **Take-home:** Aggregate stats / dashboard (≈1.5 hr)
- **Live coding:** Edit + delete a single use case (≈45–60 min, paired)

The two tasks are intentionally different: the take-home rewards thoughtful design with no
one watching; the live task is small enough to actually finish in a session and surfaces
how the candidate works under observation. Together they cover backend, SQL, frontend, and
REST modelling.

---

## Take-home — Aggregate stats / dashboard

Add a small "stats" view to the app:

- **Total time saved** across all use cases.
- **Count + total time saved per AI tool** (e.g. `Claude — 7 use cases, 230 min`).

### Judgement criteria

Weight these against the candidate's claimed level. A junior who notices the TEXT-typed
`time_saved_minutes` is impressive; a senior who silently ignores it is not.

**Testing (heaviest weight)**
- They wrote tests. The empty `test/` directory was an explicit prompt — leaving it
  empty is the single biggest red flag in this submission.
- The tests target the right boundary: the SQL aggregation / API response shape, not
  trivial `it renders` assertions on the frontend.
- Edge cases are covered or at least acknowledged: empty database, a single use case,
  multiple use cases per AI tool, the TEXT `time_saved_minutes` parsing.
- Tests are runnable with the documented command (`pytest` / `npm test`) without extra
  setup.
- Bonus: a brief note on what they chose **not** to test and why. Strong signal of
  testing taste.

**Backend / SQL (most signal)**
- Aggregation happens in **SQL** (`SUM`, `COUNT`, `GROUP BY`), not by fetching all rows
  and summing in Python/JS. Fetching-then-summing is the single biggest red flag.
- They handle the `time_saved_minutes` TEXT bug somehow — `CAST(... AS INTEGER)`,
  validation on insert, a migration, or at minimum a written acknowledgement that it's
  fragile. Pretending it's already a number is a fail.
- The endpoint has a sensible shape — one request returns everything the page needs, not
  three round-trips.
- Empty database returns sensible zeros, not `null` or a 500.

**Frontend**
- The stats live on their own route (e.g. `/stats`), not jammed into the existing list.
- Numbers are formatted for humans — `7h 30m` or `450 minutes`, not `450.0000`.
- An empty/zero state exists and is readable.

**Red flags**
- No tests at all, despite the explicit `test/` directory and brief.
- Aggregation in JS over a `GET /api/usecases` response.
- Hard-coded list of AI tools instead of `GROUP BY ai_tool`.
- No empty state — the page renders blank or crashes with 0 rows.

Note: scope creep and reaching for a UI library are **not** red flags here. Building
beyond the brief shows initiative; using a library that genuinely lifts the UX shows
judgement. We only push back if the trade-off isn't acknowledged in their note, or if
the extras came at the cost of testing the core feature.

### Follow-up questions (use in the post-submission call)

Pick 3–4 based on what they did:

1. **"Walk me through the stats endpoint. Why one endpoint vs several?"**
   Looking for: API design intuition, awareness of round-trip cost vs flexibility.
2. **"How would this scale to 1M use cases? What changes?"**
   Looking for: indexing, caching, materialised views, "I'd measure first."
3. **"How would you add a date filter — e.g. last 7 days only?"**
   Looking for: query parameter design, default values, whether they want it server-
   or client-side.
4. **"You're storing `time_saved_minutes` as TEXT. Did you notice? What would you do
   about it in a real codebase?"**
   Looking for: did they notice? Migration plan? Compatibility window thinking?
5. **"Where should validation for `time_saved_minutes` live — frontend, backend, or both?
   Why?"**
   Looking for: "trust no one, validate at boundaries," not "frontend is enough."
6. **"What did you cut to fit the time box?"**
   Looking for: self-awareness about scope.
7. **"How would you test this?"**
   Looking for: a real test boundary (the SQL aggregation), not just `it renders`.
8. **"If we wanted real-time stats and the endpoint was hit on every page load by 10k
   users, would you change anything?"**
   Looking for: caching layer, ETag, pre-computed table — and "I'd measure first."

---

## Live coding — Edit + delete a single use case

Pair-programmed in our environment, **60 min total**, run as two parts. By this point
the candidate has already submitted the take-home, so they know the codebase — we use
that to skip cold-start orientation and get straight into substantive work.

The 60 min is tight. Keep Part 1 disciplined so Part 2 has the room it needs.

### Part 1 — Homework walkthrough (~15 min)

The candidate drives a short tour of their take-home submission, then we ask a couple
of follow-up questions from the take-home list.

- Open with: "Walk me through what you built. Show me the change you're proudest of and
  the thing you're least happy with."
- Let them screen-share their own submission and run it. Cap the walkthrough at ~7 min.
- Then pick **2–3** questions from the take-home follow-up list (in the take-home
  section above) — lean on the ones that target what they actually shipped vs.
  hypotheticals.
- Use this part to also calibrate Part 2: if they hit the time-saved-as-TEXT issue
  in homework, you can skip that thread; if they didn't notice, save it for the
  Part 2 follow-ups.

### Part 2 — Edit + delete a single use case (~45 min)

The candidate adds, in our shared environment:

- An **edit screen** for an existing use case.
- A **per-row delete** with confirmation.
- The corresponding API: `PUT` or `PATCH /api/usecases/:id` and `DELETE /api/usecases/:id`.

The interviewer should resist solving it for them but is allowed to nudge if they're
stuck for >5 min on something that isn't the point of the exercise.

### Setup

- Have the take-home submission open and runnable for Part 1. The candidate continues
  in the same checkout for Part 2 — they build on what they already shipped, which is
  realistic and lets them benefit from any structure (routing, helpers, tests) they
  set up in homework.
- If their DB is empty or stale, re-seed via `./scripts/populate.sh`.
- Have the candidate share their screen / drive in the shared environment.
- Tell them up front: "Talk through what you're doing — I want to see how you think,
  not a perfect solution."

### Judgement criteria

Live coding is about **how** they work, not just whether the code runs. Weight the
process at least as heavily as the output.

**Process**
- They start with a quick plan, not blind typing. A sentence or two on what they'll
  build first (API? form? delete?) is enough — they already know the code from the
  take-home, so they shouldn't need a re-orientation phase.
- They reuse patterns from the existing code (and from their own homework) — same
  routing approach, same fetch pattern, same form structure as create.
- Do they ask clarifying questions? ("Should delete be a soft delete?" "Should I navigate
  back to the list after edit, or stay on the page?") This is good — silence isn't.
- Do they actually click through their work in the browser, or just trust the code?
- When something fails, do they read the error or guess?

**Technical**
- REST modelling: PUT/PATCH/DELETE chosen sensibly. Bonus if they articulate the
  difference; not a fail if they pick PUT and move on.
- They handle the missing-ID case — at minimum a 404 from the new DELETE/PUT, ideally
  also notice that the existing GET crashes on missing IDs (`dict(None)`).
- The delete confirmation is a real prompt, not a silent destructive click.
- After delete, they navigate somewhere sensible (back to list), not leave the user on
  a 404 page they just created.
- Edit reuses the create form's structure — DRYness instinct, not copy-paste-and-rename.

**Code quality**
- Names match the rest of the codebase (`update_usecase`, not `editItem`).

**Testing**
- We care about testing here too. The starter has an empty `test/` directory — point
  it out at the start of the session if needed, and expect the candidate to use it.
- At minimum: one test for the new `DELETE` endpoint covering the happy path. A test
  for the 404 case is a strong signal.
- They don't have time to test exhaustively, and that's fine. What matters is the
  instinct: do they reach for a test unprompted, and can they articulate what else
  they'd cover with more time?
- If they ship with no tests at all, treat it as a meaningful negative signal even
  under time pressure.

**Red flags**
- Doesn't run the server / doesn't open the browser. Codes blind.
- Ignores the existing patterns (e.g. invents a different routing approach for the
  edit page than the existing list/view/create).
- Destructive delete with no confirm, no `if (confirm(...))`.
- Deletes a use case, then navigates to its now-404 URL.
- Stuck silent. If they go quiet for 3+ min, prompt: "What are you thinking?"
- Ships with zero tests despite the empty `test/` directory being right there.

### Follow-up questions for Part 2

Part 1's questions come from the take-home follow-up list above. The questions below are
specific to the edit/delete work — use them in-flight as the candidate codes, or saved
for the wrap-up. Pick the ones that match where they are:

1. **"Why PUT and not PATCH?"** (or vice versa)
   Looking for: PATCH = partial update, PUT = full replacement. Either is defensible.
2. **"What happens if two authors edit the same use case at the same time?"**
   Looking for: optimistic concurrency (`If-Match`/version column), or at least the
   acknowledgement that last-write-wins is a real risk.
3. **"How would authorization work — only the original author can edit/delete?"**
   Looking for: where the check goes (backend, not frontend), and that the frontend's
   UI gating is a UX nicety, not security.
4. **"What would you add for the delete to be undoable?"**
   Looking for: soft delete column (`deleted_at`), tombstone, audit log.
5. **"What's missing from your error handling?"**
   Looking for: 404 on missing ID, network error toast on the frontend, optimistic UI
   rollback if delete fails.
6. **"You noticed the existing GET crashes on a bad ID — would you fix it as part of
   this PR or in a separate one?"**
   Looking for: judgement about scope vs convenience. Either answer is fine; reasoning
   matters.
7. **"How would you test this?"**
   Looking for: API tests for the new routes (happy path + 404), at minimum a manual
   test plan they actually executed.
8. **"If the table had 10M rows, would your DELETE worry you?"**
   Looking for: it's a single-row PK delete, so no — but they should know why. Bonus
   for noticing the existing `DELETE /api/usecases` (no ID) is the dangerous one.

---

## Alternate ideas (not selected, kept for reference)

- **Search + filter the list** — `~1 hr`. Reveals where logic lives (front vs back),
  debounce instincts, empty-state thinking.
- **Tags / categories** — `~1.5–2 hr`. Forces schema change + join. Largest of the
  candidate take-homes.
- **Validation end-to-end** — `~1.5 hr`. Tightens the loose JSON contract; surfaces
  schema/typing taste.
- **Live debug:** `dict(None)` 500 on missing ID — `~30 min`. Good warm-up if the live
  task above lands too easy.
- **Live refactor:** `innerHTML` → safe DOM construction — `~30 min`. Vanilla-JS fluency.
- **Live whiteboard:** migrate `time_saved_minutes` TEXT → INTEGER with no downtime —
  `~20 min`. Discussion only.
- **Live code review** of the starter — `~30 min`. Strong senior signal; no coding.

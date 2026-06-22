# Zumi — Adaptive AI Learning Buddy
### Assignment Submission: Conversation Design, Adaptive Engagement Engine & Personalization Architecture

This repo contains the solution for the 3-part Zumi assignment: diagnosing a failed conversation and fixing the system prompt, building a real-time engagement-tracking engine, and designing a cross-session personalization architecture.

---

## 📁 Files

| File | Task | Description |
|---|---|---|
| `task1_prompt.txt` | Task 1 | Failure analysis of the sample conversation + rewritten Zumi system prompt |
| `adaptiveEngine.ts` | Task 2 | `EngagementTracker` class + `getStrategyAdjustment()` function |
| `adaptiveEngine.test.ts` | Task 2 | Inline test assertions validating engine behavior |
| `task3_architecture.md` | Task 3 | Cross-session `ChildProfile` schema and edge architecture |

---

## ✅ Task 1 — Conversation Failure Analysis & Prompt Fix

**What went wrong in the sample transcript:**
1. **Skipped the Hook phase** — jumped from warmup straight into explanation, no suspense built.
2. **Dumped textbook definitions** — delivered "evaporation" as a dry definition instead of letting Aarav discover it.
3. **Poor silence handling** — no playful re-engagement strategy when Aarav went quiet for 30s.
4. **No micro-experiment** — the Explore phase was skipped entirely; a multi-step homework task was dropped on a disengaged child instead.
5. **Static handling of low-effort answers** — "haan"/"nahi" responses were treated as checkboxes rather than signals to adapt tone/energy.

**Fix:** The rewritten system prompt enforces the six-phase structure (Warmup → Hook → Explore → Explain → Check → Ready_for_quiz), mandates dramatic short-answer handling with a fresh follow-up question, and caps every response at 2–3 punchy Hinglish sentences ending in a question or call-to-action — see `task1_prompt.txt` for the full prompt and sample 6-turn conversation.

---

## ✅ Task 2 — Adaptive Engagement Engine

### `EngagementTracker`
Maintains a 0–100 engagement `score` (starts at 70) updated per turn via `processIncomingTurn()`:

| Signal | Effect |
|---|---|
| Timeout (no response) | `-30`, resets short-answer streak |
| Short answer (≤2 words) | `-5`, or `-15` if 2+ in a row (compounding penalty) |
| Full sentence | `+10`, resets short-answer streak |
| Fast reply (<3s) | `+5` |
| Slow reply (>12s) | `-10` |
| Child asks a question | `+25` (curiosity is the strongest positive signal) |

Score is clamped to `[0, 100]` after every turn.

### `getStrategyAdjustment(score)`
Maps the score to a `StrategicAdjustment` the prompt-builder can inject:

| Score range | Action | Question type | Max sentences |
|---|---|---|---|
| 80–100 | `challenge` | open | 3 |
| 50–79 | `maintain` | choice | 2 |
| 25–49 | `energize` | yes_no | 2 |
| 0–24 | `simplify` | choice | 1 |

### Running the tests
```bash
npx ts-node adaptiveEngine.test.ts
```
All 3 inline test cases (high-engagement curiosity, disengaging short-answer loop, full timeout) pass against the current implementation.

---

## ✅ Task 3 — Cross-Session Personalization Architecture

`task3_architecture.md` defines the `ChildProfile` entity persisted between sessions:

- **`metadata`** — identity basics (name, grade, createdAt)
- **`cognitiveState`** — mastered vs. struggling topics, vocabulary tier
- **`personaPreferences`** — preferred hook style, effective engagement triggers, and anti-pattern hooks to avoid

This is the stateless-edge design that lets Zumi load a compact profile slice at session start and inject it into the LLM context without breaking the sub-200ms latency budget.

---

## 🔗 Design Notes

- **Task 1 & 2 work together**: the `EngagementTracker` score feeds directly into the kind of phase/tone decisions Task 1's prompt calls for (e.g., a low score should trigger the dramatic short-answer recovery pattern from the system prompt).
- **Task 2 & 3 work together**: `successfulHooks`/`failedHooks` in `SessionMemory` (and `engagementTriggers`/`failedHooks` in `ChildProfile`) are populated from real-time engagement deltas the `EngagementTracker` produces, so personalization compounds over sessions instead of resetting each time.

import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import { EngagementTracker, getStrategyAdjustment, UserTurnInput } from "./adaptiveEngine";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// In-memory session store: sessionId -> EngagementTracker
const sessions: Record<string, EngagementTracker> = {};

function getOrCreateSession(sessionId: string): EngagementTracker {
  if (!sessions[sessionId]) {
    sessions[sessionId] = new EngagementTracker();
  }
  return sessions[sessionId];
}

// ─── Routes ───────────────────────────────────────────────────

// GET /api/health
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", activeSessions: Object.keys(sessions).length });
});

// POST /api/session — create a new session
app.post("/api/session", (_req: Request, res: Response) => {
  const sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  sessions[sessionId] = new EngagementTracker();
  res.json({ sessionId, score: 70, message: "Session started. Baseline score: 70" });
});

// POST /api/turn — process one conversational turn
// Body: { sessionId, text, responseTimeMs, isTimeout, isQuestionFromChild }
app.post("/api/turn", (req: Request, res: Response) => {
  const { sessionId, text, responseTimeMs, isTimeout, isQuestionFromChild } = req.body;

  if (!sessionId) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const input: UserTurnInput = {
    text: text ?? "",
    responseTimeMs: responseTimeMs ?? 0,
    isTimeout: isTimeout ?? false,
    isQuestionFromChild: isQuestionFromChild ?? false,
  };

  const tracker = getOrCreateSession(sessionId);
  const score = tracker.processIncomingTurn(input);
  const strategy = getStrategyAdjustment(score);

  res.json({ sessionId, score, strategy });
});

// GET /api/score/:sessionId — get current score without processing a turn
app.get("/api/score/:sessionId", (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const tracker = sessions[sessionId];
  if (!tracker) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const score = tracker.getCurrentScore();
  res.json({ sessionId, score, strategy: getStrategyAdjustment(score) });
});

// DELETE /api/session/:sessionId — reset a session
app.delete("/api/session/:sessionId", (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  if (sessions[sessionId]) {
    delete sessions[sessionId];
    res.json({ message: "Session deleted" });
  } else {
    res.status(404).json({ error: "Session not found" });
  }
});

// Fallback to index.html for SPA
app.get("/{*splat}", (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Zumi Adaptive Engine running at http://localhost:${PORT}`);
  console.log(`   API Health:  GET  http://localhost:${PORT}/api/health`);
  console.log(`   Dashboard:        http://localhost:${PORT}\n`);
});

export default app;

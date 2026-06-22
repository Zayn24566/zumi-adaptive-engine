import type { VercelRequest, VercelResponse } from "@vercel/node";
import { EngagementTracker, getStrategyAdjustment, UserTurnInput } from "../adaptiveEngine";

/**
 * POST /api/turn
 *
 * Stateless design: client sends the FULL turn history each request.
 * Server replays all turns through EngagementTracker to recompute score.
 * No session store needed — safe on Vercel's serverless runtime.
 *
 * Body: { turns: UserTurnInput[] }
 * Returns: { score, strategy, history: number[] }
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers so the frontend can call this from any origin
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { turns } = req.body as { turns?: UserTurnInput[] };

  if (!Array.isArray(turns)) {
    return res.status(400).json({ error: "'turns' must be an array of UserTurnInput" });
  }

  // Replay entire history to get current score + per-turn history
  const tracker = new EngagementTracker();
  const history: number[] = [70]; // baseline

  for (const turn of turns) {
    const score = tracker.processIncomingTurn({
      text:                turn.text               ?? "",
      responseTimeMs:      turn.responseTimeMs      ?? 0,
      isTimeout:           turn.isTimeout           ?? false,
      isQuestionFromChild: turn.isQuestionFromChild ?? false,
    });
    history.push(score);
  }

  const score    = tracker.getCurrentScore();
  const strategy = getStrategyAdjustment(score);

  return res.status(200).json({ score, strategy, history });
}

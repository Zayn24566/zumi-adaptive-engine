/**
 * Types and Interfaces
 */

export interface StrategicAdjustment {
  action: "simplify" | "energize" | "challenge" | "maintain";
  promptModifier: string;
  questionType: "yes_no" | "choice" | "open";
  maxSentences: number;
}

export interface UserTurnInput {
  text: string;
  responseTimeMs: number;
  isTimeout: boolean;
  isQuestionFromChild: boolean;
}

export interface TopicMetric {
  topicName: string;
  perceivedDifficulty: "easy" | "medium" | "hard";
  averageEngagementScore: number;
}

/**
 * Requirement 3: SessionMemory Interface
 * Persisted cross-session profile to personalize Zumi's interface over time.
 */
export interface SessionMemory {
  childId: string;
  historicalTopicMetrics: TopicMetric[];
  preferredStyle: "story_lover" | "experiment_lover" | "joke_lover" | "unknown";
  observedVocabularyLevel: "basic" | "intermediate" | "advanced";
  peakEngagementHourRange: { startHour: number; endHour: number };
  successfulHooks: string[];
  failedHooks: string[];
}

/**
 * Requirement 1: EngagementTracker Class
 */
export class EngagementTracker {
  private score: number = 70; // Initialize at a healthy mid-point default baseline
  private consecutiveShortAnswers: number = 0;

  /**
   * Tracks a new conversational turn and updates the internal engagement score (0-100).
   */
  public processIncomingTurn(input: UserTurnInput): number {
    // 1. Critical Dropout / Timeout Check
    if (input.isTimeout) {
      this.score -= 50; // Catastrophic signal — must breach into simplify range from baseline 70
      this.consecutiveShortAnswers = 0;
      this.clampScore();
      return this.score;
    }

    // 2. Evaluate Word Length Density
    const wordCount = input.text.trim().split(/\s+/).filter(Boolean).length;
    const isShortAnswer = wordCount <= 2;

    if (isShortAnswer) {
      this.consecutiveShortAnswers++;
      // Punish harder if they are repeatedly giving low effort answers
      this.score -= this.consecutiveShortAnswers >= 2 ? 15 : 5;
    } else {
      this.consecutiveShortAnswers = 0;
      this.score += 10; // Full sentence boost
    }

    // 3. Evaluate Latency Window
    if (input.responseTimeMs < 3000) {
      this.score += 5; // Rapid engagement bonus
    } else if (input.responseTimeMs > 12000) {
      this.score -= 10; // Slow response penalty
    }

    // 4. Proactive Curiosity Bonus
    if (input.isQuestionFromChild) {
      this.score += 25;
    }

    this.clampScore();
    return this.score;
  }

  public getCurrentScore(): number {
    return this.score;
  }

  private clampScore(): void {
    this.score = Math.max(0, Math.min(100, this.score));
  }
}

/**
 * Requirement 2: getStrategyAdjustment() Function
 */
export function getStrategyAdjustment(score: number): StrategicAdjustment {
  if (score >= 80) {
    return {
      action: "challenge",
      promptModifier: "The child is highly engaged. Challenge their intellect. Ask thought-provoking, open-ended conceptual questions and push them to explain the 'why' behind the science.",
      questionType: "open",
      maxSentences: 3,
    };
  } else if (score >= 50) {
    return {
      action: "maintain",
      promptModifier: "The child is smoothly flowing. Maintain current pace. Balance stories with conversational inquiries, mixing open-ended prompts with choice constraints.",
      questionType: "choice",
      maxSentences: 2,
    };
  } else if (score >= 25) {
    return {
      action: "energize",
      promptModifier: "CRITICAL: The child is losing interest. Inject heavy drama, suspense, and unexpected twists immediately. Use phrases like 'Guess karo!' or 'Shocking secret suno!'. Keep it highly punchy.",
      questionType: "yes_no",
      maxSentences: 2,
    };
  } else {
    return {
      action: "simplify",
      promptModifier: "EMERGENCY: The child is completely checked out. Drop all technical terms and complex concepts entirely. Stick to one simple, highly grounded analogy and ask a direct binary or fun, effortless choice question.",
      questionType: "choice",
      maxSentences: 1,
    };
  }
}
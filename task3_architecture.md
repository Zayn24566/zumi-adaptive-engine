# Architectural Design: Zumi Cross-Session Personalization Engine

This document outlines the stateless-edge architecture for building, persisting, and injecting persistent child profiles into Zumi's LLM context without degrading sub-200ms conversational latencies.

---

## 1. Data Schema & Core Storage Entity (`ChildProfile`)

We maintain a clean separation between raw historical traces and computed metadata values to optimize performance.

```typescript
interface ChildProfile {
  childId: string;               // Unique user identifier (UUIDv4)
  metadata: {
    name: string;                // Child's preferred name
    grade: number;               // Academic standard (e.g., 4)
    createdAt: number;           // Epoch timestamp
  };
  cognitiveState: {
    masteredTopics: string[];    // Topics clearing the ready_for_quiz phase
    strugglingTopics: Record<string, { attempts: number; lastScore: number }>; // Tracks persistent issues
    currentVocabularyTier: "basic" | "intermediate" | "advanced";
  };
  personaPreferences: {
    preferredHookStyle: "mystery" | "story" | "experiment" | "comedy";
    engagementTriggers: string[]; // Highly effective phrases/tokens captured
    failedHooks: string[];       // Anti-patterns to completely avoid
  };
}
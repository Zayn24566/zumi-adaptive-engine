/**
 * Inline Test Validation Assertions
 */
import { EngagementTracker, getStrategyAdjustment } from "./adaptiveEngine";
function runAdaptiveEngineTests() {
  console.log("=== RUNNING ZUMI ADAPTIVE ENGINE TESTS ===");

  // Test Case 1: Highly Engaged/Curious Child Profile
  const tracker1 = new EngagementTracker();
  tracker1.processIncomingTurn({
    text: "But how does the water travel all the way up into the clouds without falling down?",
    responseTimeMs: 2000,
    isTimeout: false,
    isQuestionFromChild: true
  });
  const score1 = tracker1.getCurrentScore();
  const strategy1 = getStrategyAdjustment(score1);
  
  console.assert(score1 >= 80, `Test 1 Failed: Expected high score, got ${score1}`);
  console.assert(strategy1.action === "challenge", `Test 1 Strategy Failed: ${strategy1.action}`);
  console.log(`✅ Test 1 Passed: High engagement triggers '${strategy1.action}' strategy.`);


  // Test Case 2: Disengaging Short Answer Loop
  const tracker2 = new EngagementTracker();
  tracker2.processIncomingTurn({ text: "haan", responseTimeMs: 5000, isTimeout: false, isQuestionFromChild: false });
  tracker2.processIncomingTurn({ text: "nahi", responseTimeMs: 14000, isTimeout: false, isQuestionFromChild: false });
  const score2 = tracker2.getCurrentScore();
  const strategy2 = getStrategyAdjustment(score2);

  console.assert(score2 < 50, `Test 2 Failed: Expected score drop below 50, got ${score2}`);
  console.assert(strategy2.action === "energize", `Test 2 Strategy Failed: Expected energize, got ${strategy2.action}`);
  console.log(`✅ Test 2 Passed: Sluggish short-answer chain safely drops system to '${strategy2.action}'.`);


  // Test Case 3: Complete Timeout Drop Handling
  const tracker3 = new EngagementTracker();
  tracker3.processIncomingTurn({ text: "", responseTimeMs: 0, isTimeout: true, isQuestionFromChild: false });
  const score3 = tracker3.getCurrentScore();
  const strategy3 = getStrategyAdjustment(score3);

  console.assert(score3 <= 40, `Test 3 Failed: Expected steep drop, got ${score3}`);
  console.assert(strategy3.maxSentences === 1, `Test 3 Constraint Failed: Expected max 1 sentence response.`);
  console.log(`✅ Test 3 Passed: Unresponsive child triggers catastrophic '${strategy3.action}' baseline to simplify processing.`);
}

// Execute tests at module runtime if needed
runAdaptiveEngineTests();
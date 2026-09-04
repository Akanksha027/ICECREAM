// Re-export from engine for convenience — counterfactual math lives next to policy.
export {
  computeCounterfactuals,
  estimateGeminiCostInr,
  runConfidenceCheck,
  type CounterfactualLane,
  type CounterfactualResult,
  type ConfidenceCheckResult,
} from "./engine";

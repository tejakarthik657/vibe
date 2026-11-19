import {
  DecisionRequest,
  DecisionResult,
  PolicyAction,
  PolicyConfig,
  PolicyRule,
} from "vibe-dev-decision-core";
import { calculateFinalConfidence } from "./confidence";

export const DEFAULT_POLICY_CONFIG: PolicyConfig = {
  defaultAction: "REVIEW",
  rules: [
    {
      category: "architecture",
      minConfidence: 0.8,
      actionOnLowConfidence: "BLOCK",
      actionOnHighConfidence: "REVIEW",
    },
    {
      category: "authentication",
      minConfidence: 0.9,
      actionOnLowConfidence: "BLOCK",
      actionOnHighConfidence: "REVIEW",
    },
    {
      category: "dependency",
      minConfidence: 0.7,
      actionOnLowConfidence: "REVIEW",
      actionOnHighConfidence: "WARN",
    },
    {
      category: "formatting",
      minConfidence: 0.5,
      actionOnLowConfidence: "ALLOW",
      actionOnHighConfidence: "ALLOW",
    },
    {
      category: "general",
      minConfidence: 0.75,
      actionOnLowConfidence: "REVIEW",
      actionOnHighConfidence: "ALLOW",
    },
  ],
};

export function evaluatePolicy(
  request: DecisionRequest,
  result: DecisionResult,
  config: PolicyConfig = DEFAULT_POLICY_CONFIG
): { action: PolicyAction; finalConfidence: number; ruleApplied?: PolicyRule } {
  const finalConfidence = calculateFinalConfidence(result);
  const category = request.category || "general";
  const highestEvidenceWeight = request.evidence.reduce(
    (highest, evidence) => Math.max(highest, evidence.weight),
    0
  );

  // Deterministic safety evidence must never be downgraded by provider confidence.
  if (highestEvidenceWeight >= 0.85) {
    return {
      action: "BLOCK",
      finalConfidence,
    };
  }
  
  const rule = config.rules.find((r) => r.category === category);
  
  if (!rule) {
    return {
      action: config.defaultAction,
      finalConfidence,
    };
  }

  const isHighConfidence = finalConfidence >= rule.minConfidence;
  let action = isHighConfidence ? rule.actionOnHighConfidence : rule.actionOnLowConfidence;
  if (highestEvidenceWeight >= 0.4 && action === "ALLOW") {
    action = "REVIEW";
  }

  return {
    action,
    finalConfidence,
    ruleApplied: rule,
  };
}

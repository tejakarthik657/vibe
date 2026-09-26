export type DecisionType = "boolean" | "choice" | "score" | "probability";

export type EvidenceType =
  | "architecture-drift"
  | "dependency-change"
  | "requirement-impact"
  | "secret-risk"
  | "test-coverage"
  | "task-scope";

export interface Evidence {
  type: EvidenceType;
  source: string;
  details: string;
  weight: number; // 0.0 to 1.0
}

export interface DecisionRequestContext {
  project: string;
  module?: string;
  filePath?: string;
  diffSummary?: string;
  metadata?: Record<string, unknown>;
}

export interface DecisionRequest {
  id: string;
  type: DecisionType;
  question: string;
  context: DecisionRequestContext;
  options?: string[];
  evidence: Evidence[];
  requiredConfidence?: number;
  category?: "architecture" | "formatting" | "authentication" | "dependency" | "general";
}

export interface DecisionResult {
  requestId: string;
  decision: unknown;
  confidence: number;
  reasoning?: string;
  evidence: Evidence[];
  provider: string;
  timestamp: string;
}

export type ConfidenceLevel = "UNKNOWN" | "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";

export type PolicyAction = "ALLOW" | "WARN" | "REVIEW" | "BLOCK" | "ESCALATE";

export interface PolicyRule {
  category: "architecture" | "formatting" | "authentication" | "dependency" | "general";
  minConfidence: number;
  actionOnLowConfidence: PolicyAction;
  actionOnHighConfidence: PolicyAction;
}

export interface PolicyConfig {
  defaultAction: PolicyAction;
  rules: PolicyRule[];
}

export interface DecisionCapability {
  supportedTypes: DecisionType[];
  supportedCategories: string[];
  isDeterministic: boolean;
}

export interface DecisionProvider {
  name: string;
  capabilities(): DecisionCapability;
  evaluate(request: DecisionRequest): Promise<DecisionResult>;
}

export interface HumanOverrideRecord {
  id: string;
  decisionId: string;
  originalAction: PolicyAction;
  userAction: "ALLOW" | "BLOCK";
  reason: string;
  overrideBy: string;
  timestamp: string;
  adrId?: string;
}

export interface DecisionLogRecord {
  id: string;
  request: DecisionRequest;
  result: DecisionResult;
  calculatedConfidence: number;
  confidenceLevel: ConfidenceLevel;
  resolvedAction: PolicyAction;
  timestamp: string;
  override?: HumanOverrideRecord;
}

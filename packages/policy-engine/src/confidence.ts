import { ConfidenceLevel, DecisionResult, Evidence } from "vibe-dev-decision-core";

export function calculateEvidenceQuality(evidenceList: Evidence[]): number {
  if (!evidenceList || evidenceList.length === 0) return 0.5; // default moderate evidence
  const totalWeight = evidenceList.reduce((acc, ev) => acc + (ev.weight ?? 0.5), 0);
  return Math.min(1.0, Math.max(0.0, totalWeight / evidenceList.length));
}

export function calculateFinalConfidence(result: DecisionResult): number {
  const providerConf = Math.min(1.0, Math.max(0.0, result.confidence ?? 0.5));
  const evidenceQuality = calculateEvidenceQuality(result.evidence);
  
  // Conservative formula: providerConfidence * evidenceQuality
  const rawScore = providerConf * evidenceQuality;
  return parseFloat(rawScore.toFixed(2));
}

export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.9) return "VERY_HIGH";
  if (score >= 0.8) return "HIGH";
  if (score >= 0.6) return "MODERATE";
  if (score >= 0.4) return "LOW";
  return "UNKNOWN";
}

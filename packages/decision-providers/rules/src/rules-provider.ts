import {
  DecisionCapability,
  DecisionProvider,
  DecisionRequest,
  DecisionResult,
} from "vibe-dev-decision-core";

export class RuleProvider implements DecisionProvider {
  public name = "rules";

  public capabilities(): DecisionCapability {
    return {
      supportedTypes: ["boolean", "choice", "score"],
      supportedCategories: ["architecture", "formatting", "authentication", "dependency", "general"],
      isDeterministic: true,
    };
  }

  public async evaluate(request: DecisionRequest): Promise<DecisionResult> {
    const evidence = request.evidence || [];
    let isPositiveDecision = true;
    let reasoning = "All deterministic rule checks passed cleanly.";

    // 1. Architecture drift check
    const driftEvidence = evidence.find((e) => e.type === "architecture-drift");
    if (driftEvidence) {
      isPositiveDecision = false;
      reasoning = `Architecture drift detected: ${driftEvidence.details}`;
    }

    // 2. Secret exposure check
    const secretEvidence = evidence.find((e) => e.type === "secret-risk");
    if (secretEvidence) {
      isPositiveDecision = false;
      reasoning = `Secret exposure risk detected: ${secretEvidence.details}`;
    }

    // 3. Test coverage gap check
    const testEvidence = evidence.find((e) => e.type === "test-coverage");
    if (testEvidence && request.category === "architecture") {
      reasoning += ` Note: ${testEvidence.details}`;
    }

    let decisionValue: unknown = isPositiveDecision;
    if (request.type === "choice") {
      decisionValue = isPositiveDecision ? "ALLOW" : "REVIEW_REQUIRED";
    } else if (request.type === "score") {
      decisionValue = isPositiveDecision ? 1.0 : 0.2;
    }

    return {
      requestId: request.id,
      decision: decisionValue,
      confidence: 1.0, // Rules operate with 100% deterministic certainty
      reasoning,
      evidence,
      provider: this.name,
      timestamp: new Date().toISOString(),
    };
  }
}

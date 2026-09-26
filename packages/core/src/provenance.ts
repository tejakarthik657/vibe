import { VibeState } from "./types";
import { addDecision } from "./decisions";

/**
 * After a scan, auto-record an inferred architecture decision for each detected
 * framework/dependency that isn't already covered by an existing decision.
 * This gives every architectural fact a provenance trail (developer vs inferred)
 * instead of silently treating "what the scanner saw" as project truth.
 */
export function recordInferredDecisions(state: VibeState): string[] {
  if (!state.lastScan) return [];
  const created: string[] = [];

  for (const framework of state.lastScan.frameworks) {
    const already = state.decisions.some((d) => (d.title + d.decision).toLowerCase().includes(framework.toLowerCase()));
    if (already) continue;

    const record = addDecision(
      state,
      `Use ${framework}`,
      "Detected automatically while scanning the repository's dependency manifest.",
      `Project depends on ${framework}.`,
      "Confirm with `vibe decision list` and elevate to an explicit developer decision if this was intentional.",
      { source: "inferred", confidence: 0.75 }
    );
    created.push(record.id);
  }

  return created;
}

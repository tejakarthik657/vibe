import { Decision, VibeState } from "./types";
import { addNode } from "./graph";

export function addDecision(
  state: VibeState,
  title: string,
  context: string,
  decision: string,
  consequences: string,
  opts: { source?: "developer" | "inferred"; confidence?: number } = {}
): Decision {
  const record: Decision = {
    id: `ADR-${String(state.decisions.length + 1).padStart(3, "0")}`,
    title,
    context,
    decision,
    consequences,
    source: opts.source ?? "developer",
    confidence: opts.confidence ?? 1,
    createdAt: new Date().toISOString(),
  };
  state.decisions.push(record);
  addNode(state, "Decision", record.id, { title, decision, source: record.source, confidence: record.confidence });
  return record;
}

export function listDecisions(state: VibeState): Decision[] {
  return state.decisions;
}

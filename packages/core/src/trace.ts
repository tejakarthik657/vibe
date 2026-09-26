import { VibeState } from "./types";

export interface TraceResult {
  requirementId: string;
  requirementText: string;
  linkedFiles: string[];
  likelyTests: string[];
  dependents: string[];
}

function guessTestFiles(state: VibeState, filePath: string): string[] {
  if (!state.lastScan) return [];
  const base = filePath.replace(/\.[jt]sx?$/, "").split("/").pop();
  if (!base) return [];
  return state.lastScan.files
    .filter((f) => /(test|spec)/i.test(f.path) && f.path.toLowerCase().includes(base.toLowerCase()))
    .map((f) => f.path);
}

export function traceRequirement(state: VibeState, reqId: string): TraceResult | null {
  const req = state.requirements.find((r) => r.id === reqId);
  if (!req) return null;

  const likelyTests = Array.from(new Set(req.linkedFiles.flatMap((f) => guessTestFiles(state, f))));

  const fileNodeIds = state.nodes
    .filter((n) => n.type === "File" && req.linkedFiles.includes(n.label))
    .map((n) => n.id);
  const dependents = Array.from(
    new Set(
      state.edges
        .filter((e) => e.type === "DEPENDS_ON" && fileNodeIds.includes(e.to))
        .map((e) => state.nodes.find((n) => n.id === e.from)?.label)
        .filter((x): x is string => !!x)
    )
  );

  return {
    requirementId: req.id,
    requirementText: req.text,
    linkedFiles: req.linkedFiles,
    likelyTests,
    dependents,
  };
}

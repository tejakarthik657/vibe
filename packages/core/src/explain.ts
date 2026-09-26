import { VibeState } from "./types";

export interface ExplainResult {
  module: string;
  files: string[];
  linkedRequirements: { id: string; text: string }[];
  relatedDecisions: { id: string; title: string; decision: string }[];
  externalDependencies: string[]; // files outside this module that this module's files depend on
  externalDependents: string[]; // files outside this module that depend on this module's files
}

export function explainModule(state: VibeState, moduleName: string): ExplainResult | null {
  if (!state.lastScan) return null;
  const files = state.lastScan.files.filter((f) => f.module === moduleName).map((f) => f.path);
  if (files.length === 0) return null;

  const fileSet = new Set(files);

  const linkedRequirements = state.requirements
    .filter((r) => r.linkedFiles.some((f) => fileSet.has(f)))
    .map((r) => ({ id: r.id, text: r.text }));

  const lowerModule = moduleName.toLowerCase();
  const relatedDecisions = state.decisions
    .filter((d) => (d.title + " " + d.decision + " " + d.context).toLowerCase().includes(lowerModule))
    .map((d) => ({ id: d.id, title: d.title, decision: d.decision }));

  const fileNodeIds = new Map<string, string>();
  for (const f of files) {
    const node = state.nodes.find((n) => n.type === "File" && n.label === f);
    if (node) fileNodeIds.set(f, node.id);
  }
  const nodeIdToFile = new Map<string, string>();
  for (const n of state.nodes) if (n.type === "File") nodeIdToFile.set(n.id, n.label);

  const externalDependencies = new Set<string>();
  const externalDependents = new Set<string>();
  for (const [, nodeId] of fileNodeIds) {
    for (const e of state.edges) {
      if (e.type !== "DEPENDS_ON") continue;
      if (e.from === nodeId) {
        const target = nodeIdToFile.get(e.to);
        if (target && !fileSet.has(target)) externalDependencies.add(target);
      }
      if (e.to === nodeId) {
        const source = nodeIdToFile.get(e.from);
        if (source && !fileSet.has(source)) externalDependents.add(source);
      }
    }
  }

  return {
    module: moduleName,
    files,
    linkedRequirements,
    relatedDecisions,
    externalDependencies: Array.from(externalDependencies),
    externalDependents: Array.from(externalDependents),
  };
}

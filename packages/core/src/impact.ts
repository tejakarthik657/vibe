import { VibeState } from "./types";

export interface ImpactResult {
  targetFile: string;
  directDependents: string[];
  transitiveDependents: string[]; // includes direct, BFS up to maxDepth
  affectedRequirements: string[];
  affectedTests: string[];
  riskLevel: "low" | "medium" | "high";
}

export function analyzeImpact(state: VibeState, filePath: string, maxDepth = 6): ImpactResult | null {
  const fileNode = state.nodes.find((n) => n.type === "File" && n.label === filePath);
  if (!fileNode) return null;

  const directDependents = state.edges
    .filter((e) => e.type === "DEPENDS_ON" && e.to === fileNode.id)
    .map((e) => e.from);

  // BFS over DEPENDS_ON edges to find every file transitively affected by a change here
  const visited = new Set<string>([fileNode.id]);
  let frontier = [fileNode.id];
  let depth = 0;
  while (frontier.length > 0 && depth < maxDepth) {
    const next: string[] = [];
    for (const nodeId of frontier) {
      const dependents = state.edges.filter((e) => e.type === "DEPENDS_ON" && e.to === nodeId).map((e) => e.from);
      for (const d of dependents) {
        if (!visited.has(d)) {
          visited.add(d);
          next.push(d);
        }
      }
    }
    frontier = next;
    depth++;
  }
  visited.delete(fileNode.id);
  const transitiveNodeIds = Array.from(visited);
  const transitiveDependents = transitiveNodeIds
    .map((id) => state.nodes.find((n) => n.id === id)?.label)
    .filter((x): x is string => !!x);

  const allAffectedFiles = new Set([filePath, ...transitiveDependents]);
  const affectedRequirements = Array.from(
    new Set(state.requirements.filter((r) => r.linkedFiles.some((f) => allAffectedFiles.has(f))).map((r) => r.id))
  );

  const affectedTests = (state.lastScan?.files ?? [])
    .filter((f) => /(test|spec)/i.test(f.path))
    .filter((f) => {
      const base = f.path.replace(/\.[jt]sx?$/, "").toLowerCase();
      return [...allAffectedFiles].some((af) => base.includes(af.split("/").pop()!.replace(/\.[jt]sx?$/, "").toLowerCase()));
    })
    .map((f) => f.path);

  const score = transitiveDependents.length + affectedRequirements.length * 2;
  const riskLevel: ImpactResult["riskLevel"] = score >= 8 ? "high" : score >= 3 ? "medium" : "low";

  return {
    targetFile: filePath,
    directDependents: directDependents.map((id) => state.nodes.find((n) => n.id === id)?.label ?? id),
    transitiveDependents,
    affectedRequirements,
    affectedTests,
    riskLevel,
  };
}

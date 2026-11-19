import * as path from "path";
import { VibeState } from "./types";
import { normalizePath } from "./ignore";
import { guessTestFiles } from "./trace";

export interface ExplainResult {
  module: string;
  files: string[];
  linkedRequirements: { id: string; text: string }[];
  relatedDecisions: { id: string; title: string; decision: string }[];
  externalDependencies: string[];
  externalDependents: string[];
}

export interface WhyResult {
  target: string;
  resolvedPath: string;
  isModule: boolean;
  meta: Record<string, unknown>;
  requirements: { id: string; text: string }[];
  decisions: { id: string; title: string; decision: string }[];
  constraints: { id: string; text: string; severity: string }[];
  dependents: string[];
  dependencies: string[];
  tests: string[];
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

export function explainWhy(root: string, state: VibeState, query: string): WhyResult | null {
  const normQuery = normalizePath(query);
  const files = state.lastScan?.files ?? [];

  // 1. Check exact or relative path match
  let targetFile: string | null = null;
  let fileNode = state.nodes.find((n) => n.type === "File" && normalizePath(n.label) === normQuery);

  if (!fileNode) {
    // Relative to root
    const absPath = path.isAbsolute(query) ? query : path.join(root, query);
    const relFromRoot = normalizePath(path.relative(root, absPath));
    fileNode = state.nodes.find((n) => n.type === "File" && normalizePath(n.label) === relFromRoot);
  }

  // 2. Basename or fuzzy file match
  if (!fileNode) {
    const basename = path.basename(normQuery).toLowerCase();
    fileNode = state.nodes.find(
      (n) => n.type === "File" && path.basename(n.label).toLowerCase() === basename
    );
  }

  // 3. Symbol match (finding the file declaring this symbol)
  if (!fileNode) {
    const symbolMatch = files.find(
      (f) =>
        f.exportsFunctions.some((fn) => fn.toLowerCase().includes(normQuery.toLowerCase())) ||
        f.exportsClasses.some((c) => c.toLowerCase().includes(normQuery.toLowerCase()))
    );
    if (symbolMatch) {
      fileNode = state.nodes.find((n) => n.type === "File" && n.label === symbolMatch.path);
    }
  }

  if (fileNode) {
    targetFile = fileNode.label;
    const meta = fileNode.meta || {};

    const requirements = state.requirements
      .filter((r) => r.linkedFiles.includes(targetFile!))
      .map((r) => ({ id: r.id, text: r.text }));

    const decisions = state.decisions
      .filter((d) => (d.title + " " + d.decision + " " + d.context).toLowerCase().includes(targetFile!.toLowerCase()))
      .map((d) => ({ id: d.id, title: d.title, decision: d.decision }));

    const constraints = state.constraints.map((c) => ({
      id: c.id,
      text: c.text,
      severity: c.severity,
    }));

    const dependents = state.edges
      .filter((e) => e.type === "DEPENDS_ON" && e.to === fileNode!.id)
      .map((e) => state.nodes.find((n) => n.id === e.from)?.label)
      .filter((x): x is string => !!x);

    const dependencies = state.edges
      .filter((e) => e.type === "DEPENDS_ON" && e.from === fileNode!.id)
      .map((e) => state.nodes.find((n) => n.id === e.to)?.label)
      .filter((x): x is string => !!x);

    const tests = guessTestFiles(state, targetFile!);

    return {
      target: query,
      resolvedPath: targetFile,
      isModule: false,
      meta,
      requirements,
      decisions,
      constraints,
      dependents,
      dependencies,
      tests,
    };
  }

  // 4. Module match
  const moduleMatch = state.lastScan?.modules.find((m) => m.toLowerCase() === normQuery.toLowerCase());
  if (moduleMatch) {
    const modResult = explainModule(state, moduleMatch);
    if (modResult) {
      return {
        target: query,
        resolvedPath: moduleMatch,
        isModule: true,
        meta: { filesCount: modResult.files.length },
        requirements: modResult.linkedRequirements,
        decisions: modResult.relatedDecisions,
        constraints: state.constraints.map((c) => ({ id: c.id, text: c.text, severity: c.severity })),
        dependents: modResult.externalDependents,
        dependencies: modResult.externalDependencies,
        tests: modResult.files.flatMap((f) => guessTestFiles(state, f)),
      };
    }
  }

  return null;
}

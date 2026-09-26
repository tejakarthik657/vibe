import { v4 as uuid } from "uuid";
import { GraphEdge, GraphNode, EdgeType, NodeType, ProjectModel, VibeState } from "./types";

/**
 * Rebuilds the Module/File graph portion from a fresh scan, while preserving
 * Requirement/Decision/Task/Constraint nodes and any manual links to them.
 */
export function rebuildCodeGraph(state: VibeState, model: ProjectModel): void {
  const preserved = state.nodes.filter(
    (n) => n.type === "Requirement" || n.type === "Decision" || n.type === "Task" || n.type === "Constraint"
  );
  const preservedEdges = state.edges.filter((e) => {
    const fromNode = preserved.find((n) => n.id === e.from);
    const toNode = preserved.find((n) => n.id === e.to);
    return !!fromNode || !!toNode;
  });

  const nodes: GraphNode[] = [...preserved];
  const edges: GraphEdge[] = [...preservedEdges];

  const moduleNodeId = (mod: string) => `module:${mod}`;
  const fileNodeId = (filePath: string) => `file:${filePath}`;

  for (const mod of model.modules) {
    nodes.push({ id: moduleNodeId(mod), type: "Module", label: mod });
  }

  for (const file of model.files) {
    const fId = fileNodeId(file.path);
    nodes.push({
      id: fId,
      type: "File",
      label: file.path,
      meta: {
        language: file.language,
        lines: file.lines,
        functions: file.exportsFunctions,
        classes: file.exportsClasses,
      },
    });
    edges.push({ id: uuid(), from: moduleNodeId(file.module), to: fId, type: "CONTAINS" });
  }

  // dependency edges: relative JS/TS imports resolved exactly; Python dotted imports resolved by suffix match
  const byBase = new Map<string, string>(); // basename without ext -> file path
  for (const file of model.files) {
    const base = file.path.replace(/\.[jt]sx?$/, "").replace(/\.py$/, "");
    byBase.set(base, file.path);
  }
  for (const file of model.files) {
    for (const imp of file.imports) {
      let target: string | undefined;

      if (imp.startsWith(".") && (file.language === "TypeScript" || file.language === "JavaScript")) {
        const dir = file.path.split("/").slice(0, -1).join("/");
        const resolved = normalizeImportPath(dir, imp);
        target = byBase.get(resolved);
      } else if (file.language === "Python" && !imp.startsWith(".")) {
        const asPath = imp.replace(/\./g, "/");
        target = model.files.find(
          (f) => f.language === "Python" && f.path.replace(/\.py$/, "").endsWith(asPath)
        )?.path;
      }

      if (target && target !== file.path) {
        edges.push({ id: uuid(), from: fileNodeId(file.path), to: fileNodeId(target), type: "DEPENDS_ON" });
      }
    }
  }

  state.nodes = nodes;
  state.edges = edges;
}

function normalizeImportPath(dir: string, imp: string): string {
  const parts = (dir ? dir.split("/") : []).concat(imp.split("/"));
  const stack: string[] = [];
  for (const p of parts) {
    if (p === "." || p === "") continue;
    if (p === "..") stack.pop();
    else stack.push(p);
  }
  return stack.join("/");
}

export function addNode(state: VibeState, type: NodeType, label: string, meta?: Record<string, unknown>): GraphNode {
  const node: GraphNode = { id: `${type.toLowerCase()}:${uuid()}`, type, label, meta };
  state.nodes.push(node);
  return node;
}

export function addEdge(state: VibeState, from: string, to: string, type: EdgeType): GraphEdge {
  const edge: GraphEdge = { id: uuid(), from, to, type };
  state.edges.push(edge);
  return edge;
}

export function findDependents(state: VibeState, fileNodeId: string): string[] {
  return state.edges.filter((e) => e.to === fileNodeId && e.type === "DEPENDS_ON").map((e) => e.from);
}

export function findDependencies(state: VibeState, fileNodeId: string): string[] {
  return state.edges.filter((e) => e.from === fileNodeId && e.type === "DEPENDS_ON").map((e) => e.to);
}

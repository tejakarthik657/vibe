import { VibeState } from "./types";

export interface TraceResult {
  requirementId: string;
  requirementText: string;
  linkedFiles: string[];
  likelyTests: string[];
  dependents: string[];
  module?: string;
  siblingRequirements?: { id: string; text: string }[];
}

export interface SymbolTraceResult {
  symbol: string;
  definitions: string[];
  likelyTests: string[];
  dependents: string[];
}

function guessTestFiles(state: VibeState, filePath: string): string[] {
  if (!state.lastScan) return [];

  const base = filePath.replace(/\.[jt]sx?$/, "").replace(/\.py$/, "").split("/").pop();
  if (!base) return [];

  // Derive dotted module path from file path (e.g. app/api/routes.py → app.api.routes)
  const dottedModule = filePath
    .replace(/\.[jt]sx?$/, "")
    .replace(/\.py$/, "")
    .replace(/\//g, ".");

  // Source file's directory
  const sourceDir = filePath.includes("/")
    ? filePath.substring(0, filePath.lastIndexOf("/"))
    : "";

  const results = new Set<string>();

  for (const f of state.lastScan.files) {
    if (!/(test|spec)/i.test(f.path)) continue;

    // 1. Existing: filename similarity
    if (f.path.toLowerCase().includes(base.toLowerCase())) {
      results.add(f.path);
      continue;
    }

    // 2. Import-based: test file imports the dotted module path
    if (dottedModule && f.imports && f.imports.some((imp) => imp === dottedModule || imp.endsWith(`.${dottedModule}`))) {
      results.add(f.path);
      continue;
    }

    // 3. Same directory: test file lives in the same dir as the source file
    if (sourceDir && f.path.startsWith(sourceDir + "/")) {
      results.add(f.path);
    }
  }

  return Array.from(results);
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

  // Populate module from first linked file
  const firstFile = req.linkedFiles[0];
  const module = firstFile
    ? state.lastScan?.files.find((f) => f.path === firstFile)?.module
    : undefined;

  // Populate sibling requirements: other reqs linked to files in the same module
  let siblingRequirements: { id: string; text: string }[] | undefined;
  if (module) {
    const filesInModule = new Set(
      (state.lastScan?.files ?? []).filter((f) => f.module === module).map((f) => f.path)
    );
    const siblings = state.requirements.filter(
      (r) =>
        r.id !== req.id &&
        r.linkedFiles.some((f) => filesInModule.has(f))
    );
    if (siblings.length > 0) {
      siblingRequirements = siblings.map((r) => ({ id: r.id, text: r.text }));
    }
  }

  return {
    requirementId: req.id,
    requirementText: req.text,
    linkedFiles: req.linkedFiles,
    likelyTests,
    dependents,
    ...(module !== undefined ? { module } : {}),
    ...(siblingRequirements !== undefined ? { siblingRequirements } : {}),
  };
}

export function traceSymbol(state: VibeState, symbol: string): SymbolTraceResult {
  const query = symbol.toLowerCase();
  const files = state.lastScan?.files ?? [];

  let definitions: string[] = [];

  // Strategy 1: dotted module path → file path match
  if (symbol.includes(".")) {
    const asPath = symbol.replace(/\./g, "/");
    const matched = files.filter((file) => {
      const withoutExt = file.path.replace(/\.[^/.]+$/, "");
      return withoutExt === asPath || withoutExt.endsWith("/" + asPath);
    });
    if (matched.length > 0) {
      definitions = matched.map((f) => f.path);
    }
  }

  // Strategy 2: exact function/class name match (existing logic)
  if (definitions.length === 0) {
    definitions = files
      .filter(
        (file) =>
          file.exportsFunctions.some((name) => name.toLowerCase() === query) ||
          file.exportsClasses.some((name) => name.toLowerCase() === query)
      )
      .map((file) => file.path);
  }

  // Strategy 3: partial match — query is a substring of any exported function/class
  if (definitions.length === 0) {
    definitions = files
      .filter(
        (file) =>
          file.exportsFunctions.some((name) => name.toLowerCase().includes(query)) ||
          file.exportsClasses.some((name) => name.toLowerCase().includes(query))
      )
      .map((file) => file.path);
  }

  // Strategy 4: file basename match (without extension), case-insensitive
  if (definitions.length === 0) {
    definitions = files
      .filter((file) => {
        const basename = file.path.split("/").pop()?.replace(/\.[^/.]+$/, "") ?? "";
        return basename.toLowerCase() === query;
      })
      .map((file) => file.path);
  }

  const likelyTests = definitions.flatMap((file) => guessTestFiles(state, file));
  const fileNodeIds = state.nodes
    .filter((node) => node.type === "File" && definitions.includes(node.label))
    .map((node) => node.id);
  const dependents = Array.from(
    new Set(
      state.edges
        .filter((edge) => edge.type === "DEPENDS_ON" && fileNodeIds.includes(edge.to))
        .map((edge) => state.nodes.find((node) => node.id === edge.from)?.label)
        .filter((value): value is string => !!value)
    )
  );

  return { symbol, definitions, likelyTests: Array.from(new Set(likelyTests)), dependents };
}

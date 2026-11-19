import { VibeState } from "./types";
import { normalizePath } from "./ignore";

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
  definitions: { file: string; kind: "function" | "class" | "route" | "module" }[];
  imports: string[];
  callers: string[];
  dependents: string[];
  likelyTests: string[];
  linkedRequirements: { id: string; text: string }[];
  relatedDecisions: { id: string; title: string; decision: string }[];
}

export function guessTestFiles(state: VibeState, filePath: string): string[] {
  if (!state.lastScan) return [];

  const norm = normalizePath(filePath);
  const base = norm.replace(/\.[jt]sx?$/, "").replace(/\.py$/, "").split("/").pop();
  if (!base) return [];

  const dottedModule = norm
    .replace(/\.[jt]sx?$/, "")
    .replace(/\.py$/, "")
    .replace(/\//g, ".");

  const sourceDir = norm.includes("/") ? norm.substring(0, norm.lastIndexOf("/")) : "";
  const results = new Set<string>();

  for (const f of state.lastScan.files) {
    if (!/(test|spec)/i.test(f.path) && !f.path.startsWith("tests/")) continue;

    if (f.path.toLowerCase().includes(base.toLowerCase())) {
      results.add(f.path);
      continue;
    }

    if (dottedModule && f.imports && f.imports.some((imp) => imp === dottedModule || imp.endsWith(`.${dottedModule}`))) {
      results.add(f.path);
      continue;
    }

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

  const firstFile = req.linkedFiles[0];
  const module = firstFile
    ? state.lastScan?.files.find((f) => f.path === firstFile)?.module
    : undefined;

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

export function traceSymbol(state: VibeState, queryInput: string): SymbolTraceResult {
  const query = queryInput.trim();
  const lowerQuery = query.toLowerCase();
  const files = state.lastScan?.files ?? [];

  const definitions: SymbolTraceResult["definitions"] = [];
  const matchedFilePaths = new Set<string>();

  // Check HTTP Route pattern (e.g. "GET /buyers", "POST /auth/token", "/buyers")
  const routeMatch = query.match(/^(?:(GET|POST|PUT|PATCH|DELETE)\s+)?([/A-Za-z0-9_-]+)$/i);
  if (routeMatch && (routeMatch[1] || routeMatch[2].startsWith("/"))) {
    const method = routeMatch[1] ? routeMatch[1].toUpperCase() : null;
    const routePath = routeMatch[2].startsWith("/") ? routeMatch[2] : `/${routeMatch[2]}`;

    for (const file of files) {
      for (const fn of file.exportsFunctions) {
        if (fn.startsWith("route:")) {
          const parts = fn.split(":");
          // route:GET:/buyers or route:/buyers
          const rMethod = parts.length > 2 ? parts[1] : null;
          const rPath = parts.length > 2 ? parts[2] : parts[1];
          if (rPath.toLowerCase().includes(routePath.toLowerCase())) {
            if (!method || (rMethod && rMethod === method)) {
              definitions.push({ file: file.path, kind: "route" });
              matchedFilePaths.add(file.path);
            }
          }
        }
      }
    }
  }

  // Check fully qualified symbol path (e.g. app.core.deps.get_current_user)
  if (definitions.length === 0 && query.includes(".")) {
    const parts = query.split(".");
    const possibleSymbol = parts.pop()!;
    const possibleModulePath = parts.join("/");

    for (const file of files) {
      const withoutExt = file.path.replace(/\.[^/.]+$/, "");
      if (withoutExt === possibleModulePath || withoutExt.endsWith("/" + possibleModulePath)) {
        if (
          file.exportsFunctions.includes(possibleSymbol) ||
          file.exportsClasses.includes(possibleSymbol)
        ) {
          const kind = file.exportsClasses.includes(possibleSymbol) ? "class" : "function";
          definitions.push({ file: file.path, kind });
          matchedFilePaths.add(file.path);
        }
      }
    }

    // Direct dotted path matching file path
    if (definitions.length === 0) {
      const fullAsPath = query.replace(/\./g, "/");
      for (const file of files) {
        const withoutExt = file.path.replace(/\.[^/.]+$/, "");
        if (withoutExt === fullAsPath || withoutExt.endsWith("/" + fullAsPath)) {
          definitions.push({ file: file.path, kind: "module" });
          matchedFilePaths.add(file.path);
        }
      }
    }
  }

  // Exact function or class name
  if (definitions.length === 0) {
    for (const file of files) {
      if (file.exportsClasses.some((c) => c.toLowerCase() === lowerQuery)) {
        definitions.push({ file: file.path, kind: "class" });
        matchedFilePaths.add(file.path);
      } else if (file.exportsFunctions.some((f) => f.toLowerCase() === lowerQuery)) {
        definitions.push({ file: file.path, kind: "function" });
        matchedFilePaths.add(file.path);
      }
    }
  }

  // Partial match across functions, classes, or routes
  if (definitions.length === 0) {
    for (const file of files) {
      if (file.exportsClasses.some((c) => c.toLowerCase().includes(lowerQuery))) {
        definitions.push({ file: file.path, kind: "class" });
        matchedFilePaths.add(file.path);
      } else if (file.exportsFunctions.some((f) => f.toLowerCase().includes(lowerQuery))) {
        definitions.push({ file: file.path, kind: "function" });
        matchedFilePaths.add(file.path);
      }
    }
  }

  // Basename match
  if (definitions.length === 0) {
    for (const file of files) {
      const basename = file.path.split("/").pop()?.replace(/\.[^/.]+$/, "") ?? "";
      if (basename.toLowerCase() === lowerQuery) {
        definitions.push({ file: file.path, kind: "module" });
        matchedFilePaths.add(file.path);
      }
    }
  }

  const defFilePaths = Array.from(matchedFilePaths);
  const importsSet = new Set<string>();
  for (const df of defFilePaths) {
    const record = files.find((f) => f.path === df);
    if (record) {
      record.imports.forEach((imp) => importsSet.add(imp));
    }
  }

  const likelyTests = Array.from(new Set(defFilePaths.flatMap((f) => guessTestFiles(state, f))));

  const fileNodeIds = state.nodes
    .filter((n) => n.type === "File" && defFilePaths.includes(n.label))
    .map((n) => n.id);

  const callers = Array.from(
    new Set(
      state.edges
        .filter((e) => e.type === "DEPENDS_ON" && fileNodeIds.includes(e.to))
        .map((e) => state.nodes.find((n) => n.id === e.from)?.label)
        .filter((v): v is string => !!v)
    )
  );

  const linkedRequirements = state.requirements
    .filter((r) => r.linkedFiles.some((f) => defFilePaths.includes(f)))
    .map((r) => ({ id: r.id, text: r.text }));

  const relatedDecisions = state.decisions
    .filter((d) =>
      defFilePaths.some((f) =>
        (d.title + " " + d.decision + " " + d.context).toLowerCase().includes(f.toLowerCase())
      ) || (d.title + " " + d.decision).toLowerCase().includes(lowerQuery)
    )
    .map((d) => ({ id: d.id, title: d.title, decision: d.decision }));

  return {
    symbol: query,
    definitions,
    imports: Array.from(importsSet),
    callers,
    dependents: callers,
    likelyTests,
    linkedRequirements,
    relatedDecisions,
  };
}

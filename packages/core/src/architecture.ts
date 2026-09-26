import { DeclaredArchitecture, VibeState } from "./types";

export function setDeclaredArchitecture(
  state: VibeState,
  frameworks: string[],
  database?: string,
  notes?: string
): DeclaredArchitecture {
  const arch: DeclaredArchitecture = {
    frameworks,
    database,
    notes,
    setAt: new Date().toISOString(),
  };
  state.architecture = arch;
  return arch;
}

export interface DriftReport {
  hasDeclaration: boolean;
  undeclaredButDetected: string[]; // detected in code, not declared
  declaredButNotDetected: string[]; // declared, but not seen in code
  matching: string[];
}

export function computeDrift(state: VibeState): DriftReport {
  if (!state.architecture) {
    return { hasDeclaration: false, undeclaredButDetected: [], declaredButNotDetected: [], matching: [] };
  }
  const declared = new Set(state.architecture.frameworks.map((f) => f.toLowerCase()));
  const detected = new Set((state.lastScan?.frameworks ?? []).map((f) => f.toLowerCase()));

  const undeclaredButDetected = [...detected].filter((f) => !declared.has(f));
  const declaredButNotDetected = [...declared].filter((f) => !detected.has(f));
  const matching = [...detected].filter((f) => declared.has(f));

  return { hasDeclaration: true, undeclaredButDetected, declaredButNotDetected, matching };
}

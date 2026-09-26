import * as fs from "fs";
import * as path from "path";
import { VibeState } from "./types";
import { DiffSummary } from "./git";

export interface GuardCheck {
  name: string;
  risk: number; // 0-1
  status: "ok" | "warning" | "block";
  detail: string;
}

export interface GuardReport {
  checks: GuardCheck[];
  overall: "safe" | "review" | "blocked";
  affectedRequirements: string[];
}

function statusFromRisk(risk: number): "ok" | "warning" | "block" {
  if (risk >= 0.85) return "block";
  if (risk >= 0.4) return "warning";
  return "ok";
}

export function runGuard(root: string, state: VibeState, diff: DiffSummary): GuardReport {
  const checks: GuardCheck[] = [];

  // 1. Scope: how many files changed
  const scopeRisk = Math.min(1, diff.changedFiles.length / 30);
  checks.push({
    name: "Change scope",
    risk: scopeRisk,
    status: statusFromRisk(scopeRisk),
    detail: `${diff.changedFiles.length} file(s) changed in working tree.`,
  });

  // 2. Requirement impact: changed files that are linked to requirements
  const affectedRequirements = state.requirements
    .filter((r) => r.linkedFiles.some((f) => diff.changedFiles.includes(f)))
    .map((r) => r.id);
  const reqRisk = affectedRequirements.length > 0 ? Math.min(1, 0.5 + affectedRequirements.length * 0.15) : 0.05;
  checks.push({
    name: "Requirement impact",
    risk: reqRisk,
    status: statusFromRisk(reqRisk),
    detail:
      affectedRequirements.length > 0
        ? `Touches requirement(s): ${affectedRequirements.join(", ")}.`
        : "No tracked requirements touched by this diff.",
  });

  // 3. High fan-in files changed (many dependents = risky to change)
  let maxDependents = 0;
  let riskiestFile = "";
  for (const changed of diff.changedFiles) {
    const fileNode = state.nodes.find((n) => n.type === "File" && n.label === changed);
    if (!fileNode) continue;
    const dependents = state.edges.filter((e) => e.type === "DEPENDS_ON" && e.to === fileNode.id).length;
    if (dependents > maxDependents) {
      maxDependents = dependents;
      riskiestFile = changed;
    }
  }
  const fanInRisk = Math.min(1, maxDependents / 8);
  checks.push({
    name: "Blast radius (dependents)",
    risk: fanInRisk,
    status: statusFromRisk(fanInRisk),
    detail:
      maxDependents > 0
        ? `${riskiestFile} has ${maxDependents} dependent file(s) in the graph.`
        : "No changed file has tracked dependents.",
  });

  // 4. New dependency added to package.json
  let depRisk = 0;
  let depDetail = "No dependency manifest changes detected.";
  if (diff.changedFiles.includes("package.json") && diff.raw) {
    const addedLines = diff.raw.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"));
    const addedDeps = addedLines.filter((l) => /"[a-zA-Z0-9@/_-]+":\s*"[^"]+"/.test(l) && l.includes('"dependencies"') === false);
    if (addedDeps.length > 0) {
      depRisk = 0.5;
      depDetail = `package.json changed — review for newly introduced dependencies.`;
    }
  }
  checks.push({ name: "Dependency changes", risk: depRisk, status: statusFromRisk(depRisk), detail: depDetail });

  // 5. Secret-looking additions in the diff
  let secretRisk = 0;
  let secretDetail = "No obvious secret patterns in diff.";
  if (diff.raw && /(AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC )?PRIVATE KEY-----|api[_-]?key\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["'])/i.test(diff.raw)) {
    secretRisk = 0.95;
    secretDetail = "Diff contains a pattern resembling a hardcoded secret or key.";
  }
  checks.push({ name: "Secret exposure", risk: secretRisk, status: statusFromRisk(secretRisk), detail: secretDetail });

  const maxRisk = Math.max(...checks.map((c) => c.risk));
  const overall: GuardReport["overall"] = maxRisk >= 0.85 ? "blocked" : maxRisk >= 0.4 ? "review" : "safe";

  return { checks, overall, affectedRequirements };
}

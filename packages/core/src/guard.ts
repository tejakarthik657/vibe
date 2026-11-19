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
  metrics: {
    sourceFilesChanged: number;
    ignoredFilesCount: number;
    configFilesChanged: number;
    testFilesChanged: number;
    baseline: string;
  };
}

export function statusFromRisk(risk: number): "ok" | "warning" | "block" {
  if (risk >= 0.80) return "block";
  if (risk >= 0.40) return "warning";
  return "ok";
}

/**
 * Redacts secrets, tokens, private keys, and credential patterns before sending to AI.
 */
export function redactSecrets(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/(AKIA[0-9A-Z]{16})/g, "[REDACTED_AWS_KEY]")
    .replace(/(gsk_[a-zA-Z0-9]{30,})/g, "[REDACTED_GROQ_KEY]")
    .replace(/(ghp_[a-zA-Z0-9]{36})/g, "[REDACTED_GITHUB_TOKEN]")
    .replace(/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC )?PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]")
    .replace(/(api[_-]?key|secret[_-]?key|access[_-]?token|password)\s*[:=]\s*["'][^"'\n]{8,}["']/gi, "$1=[REDACTED]");
}

export function runGuard(root: string, state: VibeState, diff: DiffSummary): GuardReport {
  const checks: GuardCheck[] = [];

  // 1. Change scope: strictly based on application source files
  const sourceCount = diff.sourceFiles ? diff.sourceFiles.length : diff.changedFiles.filter((f) =>
    /\.(py|tsx?|jsx?|java|go|rs|rb|cs|cpp|c|kt|swift)$/i.test(f)
  ).length;

  const scopeRisk = Math.min(1, sourceCount / 20);
  checks.push({
    name: "Change scope",
    risk: scopeRisk,
    status: statusFromRisk(scopeRisk),
    detail: `Source files changed: ${sourceCount} | Ignored/generated files: ${diff.ignoredFilesCount || 0}`,
  });

  // 2. Requirement impact: changed files linked to requirements
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

  // 3. High fan-in files changed (blast radius)
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

  // 4. Dependency manifest changes
  let depRisk = 0;
  let depDetail = "No dependency manifest changes detected.";
  const depManifests = ["package.json", "requirements.txt", "pyproject.toml"];
  const touchedManifest = diff.changedFiles.find((f) => depManifests.includes(f));
  if (touchedManifest && diff.raw) {
    const addedLines = diff.raw.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"));
    if (addedLines.length > 0) {
      depRisk = 0.5;
      depDetail = `${touchedManifest} modified — new dependencies should be reviewed.`;
    }
  }
  checks.push({ name: "Dependency changes", risk: depRisk, status: statusFromRisk(depRisk), detail: depDetail });

  // 5. Secret exposure in diff
  let secretRisk = 0;
  let secretDetail = "No obvious secret patterns in diff.";
  if (
    diff.raw &&
    /(AKIA[0-9A-Z]{16}|gsk_[a-zA-Z0-9]{30,}|ghp_[a-zA-Z0-9]{36}|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----|api[_-]?key\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["'])/i.test(
      diff.raw
    )
  ) {
    secretRisk = 0.95;
    secretDetail = "Diff contains a pattern resembling a hardcoded secret, token, or private key.";
  }
  checks.push({ name: "Secret exposure", risk: secretRisk, status: statusFromRisk(secretRisk), detail: secretDetail });

  // Enforce invariant: critical finding OR risk >= 0.80 => blocked
  const hasBlock = checks.some((c) => c.status === "block" || c.risk >= 0.80);
  const hasWarning = checks.some((c) => c.status === "warning" || c.risk >= 0.40);
  const overall: GuardReport["overall"] = hasBlock ? "blocked" : hasWarning ? "review" : "safe";

  return {
    checks,
    overall,
    affectedRequirements,
    metrics: {
      sourceFilesChanged: sourceCount,
      ignoredFilesCount: diff.ignoredFilesCount || 0,
      configFilesChanged: diff.configFiles ? diff.configFiles.length : 0,
      testFilesChanged: diff.testFiles ? diff.testFiles.length : 0,
      baseline: diff.baseline || "head",
    },
  };
}

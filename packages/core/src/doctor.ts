import * as fs from "fs";
import * as path from "path";
import { VibeState } from "./types";

export interface DoctorFinding {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  evidence?: string;
}

const SECRET_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: "AWS Access Key", regex: /AKIA[0-9A-Z]{16}/ },
  { name: "Generic API key assignment", regex: /(api[_-]?key|secret[_-]?key)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i },
  { name: "Private key block", regex: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
];

/**
 * Derives a dotted Python module path from a file path.
 * e.g. "app/core/deps.py" → "app.core.deps"
 */
function toPythonModulePath(filePath: string): string {
  return filePath
    .replace(/\\/g, "/")
    .replace(/\.py$/, "")
    .replace(/\//g, ".");
}

export function runDoctor(root: string, state: VibeState): DoctorFinding[] {
  const findings: DoctorFinding[] = [];

  if (!fs.existsSync(path.join(root, "README.md"))) {
    findings.push({ severity: "medium", message: "No README.md found at project root." });
  }
  if (!fs.existsSync(path.join(root, ".gitignore"))) {
    findings.push({ severity: "medium", message: "No .gitignore found — risk of committing build output or secrets." });
  }

  const model = state.lastScan;
  if (!model) {
    findings.push({ severity: "high", message: "No scan data available — run `vibe scan` first for full diagnostics." });
    return findings;
  }

  // Test coverage — all languages
  const testFiles = model.files.filter((f) => /(test|spec)/i.test(f.path));
  if (testFiles.length === 0) {
    findings.push({ severity: "critical", message: "No test files detected anywhere in the project." });
  } else {
    // Compare against ALL non-test source files (all languages)
    const nonTestSourceFiles = model.files.filter((f) => !/(test|spec)/i.test(f.path));
    const ratio = testFiles.length / Math.max(1, nonTestSourceFiles.length);
    if (ratio < 0.1) {
      findings.push({
        severity: "high",
        message: `Low test coverage signal: ${testFiles.length} test file(s) vs ${nonTestSourceFiles.length} source file(s).`,
      });
    }
  }

  const largeFiles = model.files.filter((f) => f.lines > 500);
  for (const f of largeFiles.slice(0, 10)) {
    findings.push({ severity: "low", message: `Large file may need decomposition: ${f.path} (${f.lines} lines).` });
  }

  let todoCount = 0;
  for (const f of model.files) {
    try {
      const abs = path.join(root, f.path);
      const content = fs.readFileSync(abs, "utf-8");
      const matches = content.match(/TODO|FIXME/g);
      if (matches) todoCount += matches.length;

      for (const pattern of SECRET_PATTERNS) {
        const m = content.match(pattern.regex);
        if (m) {
          findings.push({
            severity: "critical",
            message: `Possible hardcoded secret (${pattern.name}) in ${f.path}.`,
            evidence: m[0].slice(0, 40),
          });
        }
      }
    } catch {
      /* unreadable, skip */
    }
  }
  if (todoCount > 0) {
    findings.push({ severity: "low", message: `${todoCount} TODO/FIXME marker(s) found across the codebase.` });
  }

  // Requirement verification — improved to handle Python module paths too
  const requirementsWithoutTests = state.requirements.filter((r) => {
    return !r.linkedFiles.some((linkedFile) => {
      const basename = linkedFile.split("/").pop()!.replace(/\.[jt]sx?$/, "").replace(/\.py$/, "").toLowerCase();
      const pyModulePath = toPythonModulePath(linkedFile);

      return testFiles.some((t) => {
        // Check 1: test file path includes the source file's basename
        if (t.path.toLowerCase().includes(basename)) return true;
        // Check 2: test file imports array contains the dotted Python module path
        if (t.imports && t.imports.some((imp) => imp === pyModulePath || imp.endsWith(`.${pyModulePath}`))) return true;
        return false;
      });
    });
  });
  for (const r of requirementsWithoutTests) {
    findings.push({ severity: "high", message: `Requirement ${r.id} has no detected verifying test.` });
  }

  const severityRank = { critical: 0, high: 1, medium: 2, low: 3 };
  findings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  return findings;
}

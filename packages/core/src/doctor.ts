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

  const testFiles = model.files.filter((f) => /(test|spec)/i.test(f.path));
  if (testFiles.length === 0) {
    findings.push({ severity: "critical", message: "No test files detected anywhere in the project." });
  } else {
    const nonTestSourceFiles = model.files.filter(
      (f) => !/(test|spec)/i.test(f.path) && (f.language === "TypeScript" || f.language === "JavaScript")
    );
    const ratio = testFiles.length / Math.max(1, nonTestSourceFiles.length);
    if (ratio < 0.15) {
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

  const requirementsWithoutTests = state.requirements.filter((r) => {
    return !r.linkedFiles.some((f) => testFiles.some((t) => t.path.toLowerCase().includes(f.split("/").pop()!.replace(/\.[jt]sx?$/, "").toLowerCase())));
  });
  for (const r of requirementsWithoutTests) {
    findings.push({ severity: "high", message: `Requirement ${r.id} has no detected verifying test.` });
  }

  const severityRank = { critical: 0, high: 1, medium: 2, low: 3 };
  findings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  return findings;
}

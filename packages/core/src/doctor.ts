import * as fs from "fs";
import * as path from "path";
import { VibeState } from "./types";
import { verifyRequirement } from "./requirements";

export interface DoctorFinding {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  evidence?: string;
}

export interface TestSuiteDetection {
  frameworks: string[];
  testFileCount: number;
  testFiles: string[];
  hasAppSmokeTests: boolean;
  testedRoutesCount: number;
}

const SECRET_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: "AWS Access Key", regex: /AKIA[0-9A-Z]{16}/ },
  { name: "Generic API key assignment", regex: /(api[_-]?key|secret[_-]?key)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i },
  { name: "Private key block", regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/ },
];

export function detectTestSuites(root: string, state: VibeState): TestSuiteDetection {
  const frameworks = new Set<string>();
  const model = state.lastScan;
  const files = model?.files || [];

  const testFiles = files
    .filter((f) => /(test|spec)/i.test(f.path) || f.path.startsWith("tests/"))
    .map((f) => f.path);

  let hasAppSmokeTests = false;
  let testedRoutesCount = 0;

  for (const tf of testFiles) {
    try {
      const content = fs.readFileSync(path.join(root, tf), "utf-8");
      if (content.includes("pytest") || tf.endsWith(".py")) frameworks.add("pytest");
      if (content.includes("jest") || tf.includes("jest.config")) frameworks.add("Jest");
      if (content.includes("vitest") || tf.includes("vitest.config")) frameworks.add("Vitest");
      if (content.includes("@Test") || tf.endsWith("Test.java")) frameworks.add("JUnit");
      if (tf.endsWith("_test.go")) frameworks.add("Go testing");
      if (content.includes("cypress") || tf.includes("cypress/")) frameworks.add("Cypress");
      if (content.includes("playwright") || tf.includes("playwright.config")) frameworks.add("Playwright");

      // Check if testing FastAPI or web routes
      if (content.includes("TestClient") || content.includes("/health") || content.includes("client.get(")) {
        hasAppSmokeTests = true;
        const routeMatches = content.match(/client\.(?:get|post|put|delete)\(\s*["']([^"']+)["']/g);
        if (routeMatches) {
          testedRoutesCount += routeMatches.length;
        }
      }
    } catch {
      /* skip */
    }
  }

  // Check config manifests for test runners
  if (fs.existsSync(path.join(root, "pytest.ini")) || fs.existsSync(path.join(root, "pyproject.toml"))) {
    frameworks.add("pytest");
  }

  return {
    frameworks: Array.from(frameworks),
    testFileCount: testFiles.length,
    testFiles,
    hasAppSmokeTests,
    testedRoutesCount,
  };
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

  // Multi-framework test detection
  const testSuite = detectTestSuites(root, state);
  if (testSuite.testFileCount === 0) {
    findings.push({
      severity: "critical",
      message: "No test files detected anywhere in the project (checked pytest, Jest, Vitest, JUnit, Go).",
    });
  } else {
    const nonTestSourceFiles = model.files.filter(
      (f) => !/(test|spec)/i.test(f.path) && !f.path.startsWith("tests/")
    );
    const ratio = testSuite.testFileCount / Math.max(1, nonTestSourceFiles.length);

    // If project has integration/smoke tests covering application endpoints, report positively
    if (testSuite.hasAppSmokeTests) {
      if (ratio < 0.05 && testSuite.testFileCount <= 1) {
        findings.push({
          severity: "medium",
          message: `Coverage signal: ${testSuite.testFileCount} integration test suite(s) verify application routes (${testSuite.frameworks.join(", ")}). Consider expanding unit tests.`,
        });
      }
    } else if (ratio < 0.1) {
      findings.push({
        severity: "high",
        message: `Low test coverage signal: ${testSuite.testFileCount} test file(s) vs ${nonTestSourceFiles.length} source file(s) (${testSuite.frameworks.join(", ") || "generic"}).`,
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

  // Evidence-based requirement verification
  for (const req of state.requirements) {
    const report = verifyRequirement(root, state, req.id);
    if (report && report.status === "at_risk") {
      findings.push({
        severity: "high",
        message: `Requirement ${req.id} is AT RISK: ${report.findings.join("; ")} (Protected: ${report.protectedRoutes}, Authenticated: ${report.authenticatedRoutes}, Org-scoped: ${report.orgScopedRoutes}, Cross-tenant tests: ${report.crossTenantTests})`,
      });
    } else if (!report || report.verifyingTests.length === 0) {
      findings.push({ severity: "high", message: `Requirement ${req.id} has no detected verifying test.` });
    }
  }

  const severityRank = { critical: 0, high: 1, medium: 2, low: 3 };
  findings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  return findings;
}

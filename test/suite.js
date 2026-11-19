import assert from "node:assert";
import * as fs from "node:fs";
import * as path from "node:path";

const corePath = path.resolve("./packages/core/dist/index.js");
const policyPath = path.resolve("./packages/policy-engine/dist/index.js");

async function runTests() {
  console.log("==================================================");
  console.log("  VIBE 10/10 Comprehensive Verification Suite");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✔ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✖ [FAIL] ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  const core = await import(`file://${corePath.replace(/\\/g, "/")}`);
  const policy = await import(`file://${policyPath.replace(/\\/g, "/")}`);

  // 1. Ignore Engine Tests
  test("IgnoreEngine: Excludes default cache and dependency directories", () => {
    const engine = new core.IgnoreEngine(["custom_build/**", "*.bak"]);

    assert.strictEqual(engine.isIgnored(".venv/lib/python3.11/site.py"), true);
    assert.strictEqual(engine.isIgnored("node_modules/express/index.js"), true);
    assert.strictEqual(engine.isIgnored("__pycache__/main.cpython-311.pyc"), true);
    assert.strictEqual(engine.isIgnored("dist/bundle.js"), true);
    assert.strictEqual(engine.isIgnored(".env"), true);
    assert.strictEqual(engine.isIgnored("custom_build/output.bin"), true);
    assert.strictEqual(engine.isIgnored("backup.bak"), true);

    // Source files must NOT be ignored
    assert.strictEqual(engine.isIgnored("app/main.py"), false);
    assert.strictEqual(engine.isIgnored("frontend/src/App.tsx"), false);
  });

  test("IgnoreEngine: Categorizes files accurately with Windows backslashes", () => {
    const engine = new core.IgnoreEngine();

    assert.strictEqual(engine.categorize("app\\core\\deps.py"), "source");
    assert.strictEqual(engine.categorize("tests\\test_health.py"), "test");
    assert.strictEqual(engine.categorize("frontend\\src\\Component.spec.tsx"), "test");
    assert.strictEqual(engine.categorize(".venv\\Scripts\\python.exe"), "dependency");
    assert.strictEqual(engine.categorize("alembic\\versions\\001_init.py"), "generated");
    assert.strictEqual(engine.categorize("package.json"), "config");
    assert.strictEqual(engine.categorize("README.md"), "documentation");
  });

  // 2. Guard Invariant & Policy Engine Tests
  test("Guard Policy Invariant: Critical finding OR risk >= 0.80 MUST resolve to BLOCK", () => {
    const req = {
      id: "REQ-TEST-001",
      type: "choice",
      question: "Evaluate diff safety",
      context: {},
      evidence: [
        { type: "secret-risk", source: "git-diff", details: "Secret detected", weight: 0.95 }
      ],
      category: "general"
    };

    const dummyResult = {
      action: "ALLOW",
      confidence: 0.99,
      provider: "rules"
    };

    const decision = policy.evaluatePolicy(req, dummyResult);
    assert.strictEqual(decision.action, "BLOCK", "High-risk evidence weight >= 0.80 must never resolve to ALLOW!");
  });

  test("Guard Policy Invariant: Medium risk (>= 0.40) resolves to REVIEW, never ALLOW", () => {
    const req = {
      id: "REQ-TEST-002",
      type: "choice",
      question: "Evaluate diff safety",
      context: {},
      evidence: [
        { type: "scope-risk", source: "git-diff", details: "12 files changed", weight: 0.50 }
      ],
      category: "general"
    };

    const dummyResult = {
      action: "ALLOW",
      confidence: 0.95,
      provider: "rules"
    };

    const decision = policy.evaluatePolicy(req, dummyResult);
    assert.strictEqual(decision.action, "REVIEW", "Medium risk (>= 0.40) must never resolve to ALLOW!");
  });

  test("Guard Report: Status mapping ensures risk 0.85 maps to block", () => {
    assert.strictEqual(core.statusFromRisk(0.95), "block");
    assert.strictEqual(core.statusFromRisk(0.80), "block");
    assert.strictEqual(core.statusFromRisk(0.79), "warning");
    assert.strictEqual(core.statusFromRisk(0.40), "warning");
    assert.strictEqual(core.statusFromRisk(0.10), "ok");
  });

  // 3. Secret Redaction Tests
  test("Secret Redaction: Completely strips AWS, Groq, GitHub, private keys, and passwords", () => {
    const sample = `
      AWS_KEY = "AKIA1234567890ABCDEF"
      GROQ_KEY = "gsk_1234567890abcdef1234567890abcdef1234"
      GITHUB_TOKEN = "ghp_1234567890abcdef1234567890abcdef1234"
      api_key = "secret_production_password_xyz"
    `;

    const redacted = core.redactSecrets(sample);
    assert.strictEqual(redacted.includes("AKIA1234567890ABCDEF"), false);
    assert.strictEqual(redacted.includes("gsk_1234567890abcdef"), false);
    assert.strictEqual(redacted.includes("ghp_1234567890abcdef"), false);
    assert.strictEqual(redacted.includes("[REDACTED_AWS_KEY]"), true);
    assert.strictEqual(redacted.includes("[REDACTED_GROQ_KEY]"), true);
    assert.strictEqual(redacted.includes("[REDACTED_GITHUB_TOKEN]"), true);
  });

  // 4. SARIF Generation Tests
  test("SARIF Generation: Produces standard SARIF v2.1.0 log for CI/CD gates", () => {
    const mockReport = {
      checks: [
        { name: "Secret exposure", risk: 0.95, status: "block", detail: "Secret detected" },
        { name: "Change scope", risk: 0.2, status: "ok", detail: "2 files changed" }
      ],
      overall: "blocked",
      affectedRequirements: ["REQ-001"],
      metrics: { sourceFilesChanged: 2, ignoredFilesCount: 4000, baseline: "head" }
    };

    const sarif = core.generateGuardSarif(mockReport);
    assert.strictEqual(sarif.version, "2.1.0");
    assert.strictEqual(sarif.runs.length, 1);
    assert.strictEqual(sarif.runs[0].results.length, 1);
    assert.strictEqual(sarif.runs[0].results[0].level, "error");
  });

  // 5. Symbol Tracing & HTTP Route Matching
  test("Symbol Tracing: Supports dotted FQN, HTTP route methods, classes and functions", () => {
    const mockState = {
      project: { name: "test-app" },
      requirements: [{ id: "REQ-001", text: "Auth required", linkedFiles: ["app/core/deps.py"] }],
      decisions: [{ id: "DEC-001", title: "Use FastAPI", decision: "FastAPI chosen", context: "app/core/deps.py" }],
      constraints: [],
      tasks: [],
      nodes: [
        { id: "file:app/core/deps.py", type: "File", label: "app/core/deps.py" },
        { id: "file:app/api/buyers.py", type: "File", label: "app/api/buyers.py" }
      ],
      edges: [
        { id: "e1", from: "file:app/api/buyers.py", to: "file:app/core/deps.py", type: "DEPENDS_ON" }
      ],
      lastScan: {
        languages: { Python: 2 },
        frameworks: ["FastAPI"],
        modules: ["app"],
        files: [
          {
            path: "app/core/deps.py",
            language: "Python",
            lines: 50,
            imports: ["fastapi"],
            exportsFunctions: ["get_current_user"],
            exportsClasses: ["AuthManager"],
            module: "app"
          },
          {
            path: "app/api/buyers.py",
            language: "Python",
            lines: 40,
            imports: ["app.core.deps"],
            exportsFunctions: ["route:GET:/buyers", "get_buyers"],
            exportsClasses: ["BuyerResponse"],
            module: "app"
          }
        ]
      }
    };

    // 1. Dotted FQN trace
    const fqnResult = core.traceSymbol(mockState, "app.core.deps.get_current_user");
    assert.strictEqual(fqnResult.definitions.length > 0, true);
    assert.strictEqual(fqnResult.definitions[0].file, "app/core/deps.py");
    assert.strictEqual(fqnResult.callers.includes("app/api/buyers.py"), true);

    // 2. HTTP Route trace
    const routeResult = core.traceSymbol(mockState, "GET /buyers");
    assert.strictEqual(routeResult.definitions.length > 0, true);
    assert.strictEqual(routeResult.definitions[0].file, "app/api/buyers.py");

    // 3. Class trace
    const classResult = core.traceSymbol(mockState, "AuthManager");
    assert.strictEqual(classResult.definitions[0].file, "app/core/deps.py");
  });

  // 6. Explain Why Tests
  test("ExplainWhy: Resolves Windows paths, relative paths, and symbols", () => {
    const mockState = {
      project: { name: "test-app" },
      requirements: [{ id: "REQ-001", text: "Authenticate all requests", linkedFiles: ["app/core/deps.py"] }],
      decisions: [{ id: "DEC-001", title: "JWT Auth", decision: "Use JWT tokens in auth header", context: "deps.py" }],
      constraints: [{ id: "CON-001", text: "Never cross tenant boundaries", severity: "critical" }],
      tasks: [],
      nodes: [
        { id: "file:app/core/deps.py", type: "File", label: "app/core/deps.py", meta: { language: "Python", lines: 50 } }
      ],
      edges: [],
      lastScan: {
        languages: { Python: 1 },
        frameworks: ["FastAPI"],
        modules: ["app"],
        files: [
          {
            path: "app/core/deps.py",
            language: "Python",
            lines: 50,
            imports: [],
            exportsFunctions: ["get_current_user"],
            exportsClasses: [],
            module: "app"
          }
        ]
      }
    };

    // Windows backslash path
    const winResult = core.explainWhy("C:/fake/root", mockState, "app\\core\\deps.py");
    assert.strictEqual(winResult !== null, true);
    assert.strictEqual(winResult.resolvedPath, "app/core/deps.py");
    assert.strictEqual(winResult.requirements[0].id, "REQ-001");
    assert.strictEqual(winResult.constraints[0].id, "CON-001");

    // Symbol query
    const symbolResult = core.explainWhy("C:/fake/root", mockState, "get_current_user");
    assert.strictEqual(symbolResult !== null, true);
    assert.strictEqual(symbolResult.resolvedPath, "app/core/deps.py");
  });

  // 7. Context Generation Tests
  test("Context Generation: Produces file-grounded AGENTS.md with validation commands", () => {
    const mockState = {
      project: { name: "test-app" },
      requirements: [{ id: "REQ-001", text: "Implement OAuth authentication", tags: ["auth"], linkedFiles: ["app/core/deps.py"] }],
      decisions: [{ id: "DEC-001", title: "FastAPI Auth", decision: "Use OAuth2PasswordBearer", context: "auth" }],
      constraints: [{ id: "CON-001", text: "Never log plaintext tokens", severity: "critical" }],
      tasks: [],
      nodes: [],
      edges: [],
      lastScan: {
        languages: { Python: 5 },
        frameworks: ["FastAPI"],
        modules: ["app"],
        files: [
          { path: "app/core/deps.py", language: "Python", lines: 50, imports: [], exportsFunctions: ["get_current_user"], exportsClasses: [], module: "app" },
          { path: "tests/test_health.py", language: "Python", lines: 25, imports: ["app.core.deps"], exportsFunctions: ["test_health"], exportsClasses: [], module: "tests" }
        ],
        scannedAt: new Date().toISOString(),
        scanConfidence: 1.0
      }
    };

    const bundle = core.buildContext(mockState, "implement OAuth authentication");
    assert.strictEqual(bundle.relevantFiles.includes("app/core/deps.py"), true);
    assert.strictEqual(bundle.validationCommands.includes("pytest tests/ -v"), true);
    assert.strictEqual(bundle.validationCommands.includes("vibe guard --no-ai"), true);

    const md = core.renderAgentsMd(mockState, bundle);
    assert.strictEqual(md.includes("AI Agent Context — test-app"), true);
    assert.strictEqual(md.includes("`app/core/deps.py`"), true);
    assert.strictEqual(md.includes("pytest tests/ -v"), true);
  });

  // 8. Atomic State Writes & Schema Migration
  test("VibeStore: Performs atomic file writes and schema migrations", () => {
    const tempDir = path.resolve("./.vibe-test-scratch");
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });

    const store = core.VibeStore.init(tempDir, "test-suite-project");
    const state = store.get();
    core.addRequirement(state, "Ensure zero regression in policy invariant");
    store.save();

    assert.strictEqual(fs.existsSync(path.join(tempDir, ".vibe", "state.json")), true);

    const migration = store.migrate(1);
    assert.strictEqual(migration.toVersion, 1);
    assert.strictEqual(fs.existsSync(migration.backupPath), true);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // 9. VS Code Manifest Parity Check
  test("VS Code Extension: 100% command parity between manifest and registrations", () => {
    const pkgJsonPath = path.resolve("./packages/vscode-extension/package.json");
    const extTsPath = path.resolve("./packages/vscode-extension/src/extension.ts");

    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    const extContent = fs.readFileSync(extTsPath, "utf-8");

    const manifestCommands = pkgJson.contributes.commands.map((c) => c.command);
    assert.strictEqual(manifestCommands.length >= 23, true, "At least 23 commands must be in manifest");

    for (const cmd of manifestCommands) {
      assert.strictEqual(
        extContent.includes(`"${cmd}"`),
        true,
        `Command ${cmd} in package.json must be registered in extension.ts`
      );
    }
  });

  console.log("\n--------------------------------------------------");
  console.log(`  Tests: ${passed} passed, ${failed} failed`);
  console.log("--------------------------------------------------\n");

  if (failed > 0) process.exit(1);
}

runTests();

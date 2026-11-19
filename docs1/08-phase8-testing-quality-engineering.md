# Phase 8: Testing & Quality Engineering
**Document Ref**: `docs1/08-phase8-testing-quality-engineering.md`  
**System**: VIBE (Vibe Intent & Boundary Engine)  
**Phase**: Phase 8 of 10 — Test Suites, Pathological Fixtures & Verification

---

## Executive Overview: The Intent of Phase 8
Phase 8 defines how individual modules and the complete application are tested and validated: unit testing, integration testing, synthetic graph fixtures, secret injection testing, and CI dogfooding.

---

## 53. Unit Testing
*Test individual functions, components, algorithms, and services.*

- `packages/core/test/guard.test.ts`: Validates Shannon entropy calculation accuracy across character sets.
- `packages/core/test/graph.test.ts`: Verifies DFS 3-coloring cycle detection against directed graphs.
- `packages/core/test/impact.test.ts`: Verifies BFS reverse reachability depth and dependent file counts.
- `packages/policy-engine/test/confidence.test.ts`: Validates mathematical formula calculations.

---

## 54. Integration Testing
*Test interactions between compiler AST, SQLite database, and Git.*

- Tests execute against isolated temporary directories initialized with real Git repositories.
- Verifies that `vibe scan` parses sample files and writes consistent node/edge tables to SQLite.

---

## 55. API Testing
*Endpoint behavior, schemas, exit codes, error responses.*

- Verifies that `vibe guard` returns exit code `0` (`ALLOW`) when clean, exit code `1` (`REVIEW`) on warnings, and exit code `2` (`BLOCK`) when secrets or high-risk changes are staged.
- Asserts that `--json` output emits 100% pure JSON on stdout with zero ANSI color codes.
- Asserts that `-f sarif` emits standard OASIS SARIF v2.1.0 JSON logs with error-level entries on blocks.

---

## 56. End-to-End Testing & 13-Test Comprehensive Suite (`test/suite.js`)
*Test complete developer workflows & VS Code extension execution.*

The automated test runner (`npm test`) executes 13 rigorous integration and unit assertions:
1. **IgnoreEngine Default Exclusions**: Cache and dependency folder isolation.
2. **IgnoreEngine Path Normalization**: Cross-platform Windows backslash (`\`) handling.
3. **Guard Policy Invariant**: Critical findings / weight $\ge 0.80$ strictly resolve to `BLOCK`.
4. **Guard Policy Invariant**: Medium risk ($\ge 0.40$) resolves to `REVIEW`, never `ALLOW`.
5. **Guard Status Mapping**: Verifies risk thresholds ($0.85 \to$ `block`, $0.50 \to$ `warning`, $0.10 \to$ `ok`).
6. **Secret Redaction**: Strips AWS, Groq, GitHub, and private keys completely.
7. **SARIF Generation**: Verifies standard SARIF v2.1.0 schema validity.
8. **Symbol Tracing**: Verifies dotted FQN, HTTP route methods (`GET /buyers`), and classes.
9. **ExplainWhy**: Verifies Windows paths and symbol-based explainability.
10. **Context Generation**: Verifies file-grounded `AGENTS.md` context document formatting.
11. **Atomic State Storage**: Verifies `.tmp` write, `fsync`, atomic rename, and schema backups.
12. **VS Code Extension Manifest Parity**: 100% parity across manifest commands and registered handlers.
13. **VS Code Extension Automated Command Execution**: Invokes all 23 extension command handlers without unhandled promise rejections.

---

## 57. Performance Testing
*Load testing, latency budgets, scalability profiling.*

- Automated benchmarks verify that staged diff scans complete in $< 120\text{ ms}$.
- Asserts AST scanning of 500 files completes in $< 1.5\text{ seconds}$.

---

## 58. Security Testing
*Vulnerability scanning, secret injection, entropy false positives.*

- Verifies that 15 known API token formats (AWS, GitHub, Groq, Stripe) are caught by `guard.ts`.
- Verifies that 60-character camelCase variable names do not trigger false-positive blocks.

---

## 59. AI Testing
*Prompt tests, model regression, hallucination testing, fallback tests.*

- Validates that the Groq provider payload generation complies with JSON schema requirements.
- Tests fallback chain behavior by simulating network timeouts and asserting that the deterministic rule engine executes seamlessly.

---

## 60. Quality Assurance & Dogfooding
*Test plans, regression testing, bug tracking, CI dogfooding.*

- **Monorepo Dogfooding**: The GitHub Actions CI pipeline executes `vibe doctor` against the VIBE monorepo itself on every pull request, ensuring our own codebase maintains zero circular imports.

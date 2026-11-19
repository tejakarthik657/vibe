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

- Verifies that `vibe guard --staged` returns exit code `0` when clean, and exit code `1` when secrets are staged.
- Asserts that `--json` output emits 100% pure JSON on stdout with zero ANSI color codes.

---

## 56. End-to-End Testing
*Test complete developer workflows.*

Simulates the developer lifecycle:
1. Initialize repository (`vibe init`).
2. Add an ADR forbidding direct DB calls in UI (`vibe adr add ...`).
3. Stage a code change violating the ADR.
4. Execute pre-commit hook and assert commit is blocked with exit code `1`.

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

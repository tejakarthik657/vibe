# VIBE — Autonomous Compiler-Level Architectural Governance & Decision Intelligence System

> **"AI generates the code. VIBE governs the engineering."**

[![NPM Version](https://img.shields.io/npm/v/vibe-dev.svg?style=flat-square&color=007acc)](https://www.npmjs.com/package/vibe-dev)
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/devframes.vibe-vscode-extension.svg?style=flat-square&color=blueviolet)](https://marketplace.visualstudio.com/items?itemName=devframes.vibe-vscode-extension)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## What is VIBE?

**VIBE** is the engineering decision-intelligence layer designed for modern software development. As teams rapidly adopt AI coding assistants (GitHub Copilot, Cursor, Claude Code, ChatGPT), code is produced at unprecedented velocity. However, AI assistants introduce critical architectural blind spots:

1. **Context Blindness**: They lack knowledge of your project's architectural decisions (ADRs), non-negotiable security constraints, and tenancy boundaries.
2. **Silent Architectural Drift**: They casually introduce unapproved third-party dependencies, duplicate libraries, or bypass architectural layers.
3. **Hallucinated Truth**: When prompted to evaluate safety, LLMs often invent confidence and approve destructive changes.

VIBE bridges this gap with an uncompromising four-layer invariant:
```text
       Deterministic Facts (AST, Git Diffs, Ignore Engine, Test Evidence)
                                      ▼
             Confidence-Aware AI Interpretation (Groq LLM / Rules)
                                      ▼
               Mathematical Policy Decision (ALLOW, REVIEW, BLOCK)
                                      ▼
          Permanent Governance Ledger & Audit Trail (.vibe/vibe.db, ADRs)
```

---

## Key Capabilities at a Glance

- **Deterministic AST Code Graph**: Parses Python and JavaScript/TypeScript codebases into an in-memory graph of modules, files, routes, classes, exports, and call-sites.
- **Evidence-Based Requirements**: Verifies requirements against actual source code and automated test cases (e.g. confirming that protected routes enforce authentication and cross-tenant isolation).
- **Architecture Drift Detection**: Compares declared production stacks against actual imports to eliminate rogue libraries before deployment.
- **Guard & Pre-Commit Protection**: Evaluates working tree and CI git diffs in sub-120ms to detect secret leaks, high blast-radius edits, and scope explosion (`exit code 2 = BLOCK`).
- **AI Agent Context Generator (`AGENTS.md`)**: Dynamically scopes tasks for autonomous coding agents, preventing context drift and hallucinations.
- **Interactive VS Code Extension**: Live 4-panel Activity Bar sidebar (Requirements, Decisions, Constraints, Tasks) with 23 Command Palette shortcuts.

---

## Quickstart (Under 2 Minutes)

### 1. Installation
Install the VIBE CLI engine globally:
```bash
npm install -g vibe-dev
```

### 2. Initialize Any Repository
Navigate to your repository and initialize VIBE:
```bash
vibe init
```

### 3. Scan Codebase & Build Graph
```bash
vibe scan
```

### 4. Install Git Pre-Commit Hook
```bash
vibe install-hooks
```

### 5. Inspect Architectural Health
```bash
vibe doctor
```

---

## Complete CLI Command Reference (`vibe-dev`)

Here is the exhaustive reference of all 29 commands and subcommands available in the VIBE CLI, accompanied by real-world inputs, production outputs, and explanations of why each command is essential.

---

### Domain 1: Project Lifecycle & Setup

#### 1. `vibe init`
Initializes VIBE in the workspace, sets up `.vibe/` storage, and auto-generates a safe `.gitignore`.

* **Command**:
  ```bash
  vibe init [--name <project-name>]
  ```
* **Real-World Input**:
  ```bash
  vibe init --name "real-estate-bi"
  ```
* **Real-World Output**:
  ```text
  ℹ Initialized VIBE for "real-estate-bi"
  ✔ Created safe .gitignore protecting secrets and dependency caches.
  Created .vibe/state.json
  ```
* **Why It's Useful**: Establishes project metadata and automatically ignores dependency folders (`.venv/`, `node_modules/`, `dist/`), preventing massive 5,000+ file diff explosions in Git.

---

#### 2. `vibe scan` (alias: `vibe adopt`)
Parses ASTs, extracts functions, classes, and HTTP route decorators (e.g., `@router.get("")`), constructs the dependency graph, and verifies requirement evidence.

* **Command**:
  ```bash
  vibe scan [-f text|json] [--quiet]
  ```
* **Real-World Input**:
  ```bash
  vibe scan
  ```
* **Real-World Output**:
  ```text
  - Scanning repository...
  √ Scan complete.

  Languages:
    Python: 73 file(s)
    JavaScript: 15 file(s)

  Frameworks detected: Vite, React, FastAPI, PostgreSQL, SQLAlchemy, Celery, Redis, Qdrant, Docker, Alembic
  Modules: alembic, app, frontend, tests
  Total files analyzed: 88 (Confidence: 100%)
  Graph nodes: 109 edges: 289
  ```
* **Why It's Useful**: Provides deterministic ground truth about every symbol, dependency, and framework in the repository without AI hallucinations.

---

#### 3. `vibe status`
Displays a comprehensive health snapshot of requirements, ADRs, constraints, and tasks.

* **Command**:
  ```bash
  vibe status [-f text|json]
  ```
* **Real-World Input**:
  ```bash
  vibe status
  ```
* **Real-World Output**:
  ```text
  VIBE — real-estate-bi

  Requirements: 1
    REQ-001 [verified] Keep every route org-scoped and authenticated

  Decisions: 11
    ADR-001 (inferred, conf 0.75) Use FastAPI
    ADR-002 (developer, conf 1.00) FastAPI backend with React frontend
    ADR-003 (inferred, conf 0.75) Use Vite
    ADR-004 (inferred, conf 0.75) Use PostgreSQL/SQLAlchemy

  Constraints: 4
    [warning] Never cross organization tenant boundaries
    [warning] Never commit secret API keys or private tokens to git history

  Last scan: 2026-11-19T09:21:20.956Z (88 files across 4 modules)
  ```
* **Why It's Useful**: Gives developers and engineering leaders an instant architectural overview in a single command.

---

#### 4. `vibe onboard` (alias: `vibe welcome`)
Provides an interactive architectural walkthrough for new developers joining the codebase.

* **Command**:
  ```bash
  vibe onboard
  ```
* **Real-World Input**:
  ```bash
  vibe onboard
  ```
* **Real-World Output**:
  ```text
  ============================================================
    ONBOARDING: real-estate-bi
  ============================================================

  Primary Stack: FastAPI (Python), React/Vite (JavaScript/TypeScript)
  Core Modules:
    - app/ (FastAPI backend services, core database models, API routers)
    - frontend/ (React UI dashboard and visualization charts)
    - tests/ (Pytest test suite with tenant isolation assertions)

  Key Architectural Invariants:
    1. REQ-001: Every route must depend on get_current_user and filter by org_id.
    2. CON-001: Never cross tenant boundaries.

  Recommended Next Steps:
    1. Run `vibe doctor` to verify test coverage and dependencies.
    2. Run `vibe guard` before submitting any PR.
  ```
* **Why It's Useful**: Replaces stale onboarding documentation with real-time, verified architecture rules extracted directly from code.

---

#### 5. `vibe bootstrap`
Bootstraps foundational constraints and decisions from built-in industry presets.

* **Command**:
  ```bash
  vibe bootstrap [--preset fullstack|microservice|library]
  ```
* **Real-World Input**:
  ```bash
  vibe bootstrap --preset fullstack
  ```
* **Real-World Output**:
  ```text
  ✔ Injected 4 foundational constraints for Fullstack architecture.
  ✔ Injected baseline ADR-001: Separation of concerns between API and Client.
  ✔ Configured default IgnoreEngine rules.
  ```
* **Why It's Useful**: Sets up production-grade engineering rules in seconds.

---

#### 6. `vibe config`
Configures local VIBE settings, LLM provider API keys, and reasoning modes.

* **Commands**:
  ```bash
  vibe config set <key> <value>
  vibe config show
  ```
* **Real-World Input**:
  ```bash
  vibe config set groq_api_key gsk_abc123456789example
  vibe config set ai true
  vibe config show
  ```
* **Real-World Output**:
  ```text
  LOCAL VIBE CONFIGURATION
  =============================================================
    groq_api_key: gsk_ab...mple
    ai: true
    storage: sqlite
  ```
* **Why It's Useful**: Securely stores API keys in `.vibe/config.json` with token masking to prevent credential leaks.

---

### Domain 2: Architecture Governance & Drift Detection

#### 7. `vibe architect set`
Declares the intended technology stack, supported libraries, and persistence layers. Multi-word framework names (e.g., `Voyage AI`) are fully supported.

* **Command**:
  ```bash
  vibe architect set -f "<frameworks>" --database "<dbs>" [-n "<notes>"]
  ```
* **Real-World Input**:
  ```bash
  vibe architect set -f "FastAPI, React, Vite, PostgreSQL, SQLAlchemy, Celery, Redis, Qdrant, Voyage AI, Docker, Alembic" --database "PostgreSQL,Redis,Qdrant" -n "Production real estate BI stack"
  ```
* **Real-World Output**:
  ```text
  ✔ Declared architecture: FastAPI, React, Vite, PostgreSQL, SQLAlchemy, Celery, Redis, Qdrant, Voyage AI, Docker, Alembic + PostgreSQL,Redis,Qdrant
  ```
* **Why It's Useful**: Establishes the authoritative stack specification for your repository.

---

#### 8. `vibe drift`
Audits the code graph against the declared architecture to identify unauthorized frameworks or missing components.

* **Command**:
  ```bash
  vibe drift [-f text|json]
  ```
* **Real-World Input**:
  ```bash
  vibe drift
  ```
* **Real-World Output**:
  ```text
  ARCHITECTURE DRIFT

  ✓ Matching: vite, react, fastapi, postgresql, sqlalchemy, celery, redis, qdrant, voyage ai, docker, alembic
  ✔ No drift detected.
  ```
* **Why It's Useful**: Detects unauthorized libraries (e.g. an AI agent casually importing `mongodb` into a PostgreSQL project) before code merges.

---

### Domain 3: Requirements Engineering & Evidence Verification

#### 9. `vibe requirement add`
Registers a functional or security requirement to be monitored by VIBE.

* **Command**:
  ```bash
  vibe requirement add "<text>" [-t "<tags>"]
  ```
* **Real-World Input**:
  ```bash
  vibe requirement add "Keep every route org-scoped and authenticated" -t "auth,security,multi-tenant"
  ```
* **Real-World Output**:
  ```text
  ✔ Added requirement REQ-001: "Keep every route org-scoped and authenticated" [tags: auth, security, multi-tenant]
  ```
* **Why It's Useful**: Turns text specifications into tracked entities linked directly to code and tests.

---

#### 10. `vibe requirement link`
Explicitly binds a requirement to a source file or API router.

* **Command**:
  ```bash
  vibe requirement link <reqId> <filePath>
  ```
* **Real-World Input**:
  ```bash
  vibe requirement link REQ-001 app/core/deps.py
  ```
* **Real-World Output**:
  ```text
  ✔ Linked REQ-001 to app/core/deps.py
  ```
* **Why It's Useful**: Enables precision blast-radius tracking when files implementing key requirements are modified.

---

#### 11. `vibe requirement list`
Lists all active requirements with their automated evidence verification status.

* **Command**:
  ```bash
  vibe requirement list
  ```
* **Real-World Output**:
  ```text
  REQUIREMENTS (1 total)
  -------------------------------------------------------------
  REQ-001 [verified] Keep every route org-scoped and authenticated
          Tags: auth, security, multi-tenant
          Linked: app/core/deps.py, app/api/routes/buyers.py
  ```
* **Why It's Useful**: Shows which requirements are validated by tests and which are currently at risk.

---

### Domain 4: Architectural Decision Records (ADRs) & Overrides

#### 12. `vibe decision add`
Records an Architectural Decision Record (ADR) capturing technical choices and rationale.

* **Command**:
  ```bash
  vibe decision add "<title>" -d "<decision>" -c "<context>" [--status accepted]
  ```
* **Real-World Input**:
  ```bash
  vibe decision add "Use PostgreSQL with SQLAlchemy ORM" -d "All relational entities will use SQLAlchemy 2.0 mapped models" -c "Need reliable multi-tenant isolation with ACID transactions"
  ```
* **Real-World Output**:
  ```text
  ✔ Added decision ADR-004: "Use PostgreSQL with SQLAlchemy ORM" [status: accepted]
  ```
* **Why It's Useful**: Prevents architectural regression by preserving institutional knowledge in the codebase.

---

#### 13. `vibe decisions`
Displays the immutable audit ledger of all decision evaluations and human overrides.

* **Command**:
  ```bash
  vibe decisions
  ```
* **Real-World Output**:
  ```text
  EVALUATED DECISIONS & AUDIT TRAIL (10 records)
  =============================================================
  DEC-010  2026-11-19 14:49:34  rules      ALLOW   1.00  HEAD diff verified safe
  DEC-008  2026-11-19 14:49:03  rules      BLOCK   0.79  Blast radius on app/core/database.py
  DEC-007  2026-11-19 14:30:12  groq-llm   REVIEW  0.55  New dependencies added in requirements.txt
  ```
* **Why It's Useful**: Provides a complete audit trail for compliance, security reviews, and engineering retrospectives.

---

#### 14. `vibe override`
Overrides an automated `BLOCK` or `REVIEW` action with an explicit developer justification. Automatically records an ADR.

* **Command**:
  ```bash
  vibe override <decisionId> -r "<justification>"
  ```
* **Real-World Input**:
  ```bash
  vibe override DEC-008 -r "Approved schema refactoring: all downstream consumers tested and verified"
  ```
* **Real-World Output**:
  ```text
  ✔ Recorded Human Override on DEC-008
  ✔ Auto-created ADR-009: Override: Evaluate git diff change safety
    Rationale: Approved schema refactoring: all downstream consumers tested and verified
  ```
* **Why It's Useful**: Allows senior engineers to bypass automated gates without creating unrecorded technical debt.

---

### Domain 5: Architectural Constraints

#### 15. `vibe constraint add`
Adds a non-negotiable architectural invariant enforced across commits.

* **Command**:
  ```bash
  vibe constraint add "<text>" [-s critical|warning|info]
  ```
* **Real-World Input**:
  ```bash
  vibe constraint add "Never cross organization tenant boundaries" -s critical
  ```
* **Real-World Output**:
  ```text
  ✔ Added constraint CON-001 [critical]: "Never cross organization tenant boundaries"
  ```
* **Why It's Useful**: Enforces boundary and security rules across both human engineers and AI coding agents.

---

#### 16. `vibe constraint list`
Lists all active architectural constraints.

* **Command**:
  ```bash
  vibe constraint list
  ```
* **Real-World Output**:
  ```text
  CONSTRAINTS (4 total)
  -------------------------------------------------------------
  [critical] CON-001: Never cross organization tenant boundaries
  [warning]  CON-002: Never commit secret API keys or private tokens
  [warning]  CON-003: Keep all file sizes under 500 lines
  ```
* **Why It's Useful**: Keeps architectural constraints visible and reviewable.

---

### Domain 6: Task Tracking

#### 17. `vibe task add`
Creates a development work item linked directly to a requirement.

* **Command**:
  ```bash
  vibe task add "<title>" [-r <reqId>] [--status todo|in_progress|done]
  ```
* **Real-World Input**:
  ```bash
  vibe task add "Implement cross-tenant isolation test cases" -r REQ-001 --status in_progress
  ```
* **Real-World Output**:
  ```text
  ✔ Added task TSK-001: "Implement cross-tenant isolation test cases" [in_progress, req: REQ-001]
  ```
* **Why It's Useful**: Maps sprint tasks directly to code and requirements inside your IDE sidebar.

---

#### 18. `vibe task list`
Lists all active tasks.

* **Command**:
  ```bash
  vibe task list
  ```
* **Real-World Output**:
  ```text
  TASKS (2 total)
  -------------------------------------------------------------
  TSK-001 [in_progress] Implement cross-tenant isolation test cases (REQ-001)
  TSK-002 [todo]        Add rate limiting middleware to auth endpoints
  ```
* **Why It's Useful**: Keeps engineering tasks aligned with codebase state.

---

### Domain 7: Guard & CI/CD Protection

#### 19. `vibe guard`
The core safety gate of VIBE. Analyzes diffs against AST dependencies, secret patterns, and blast radius.

* **Command**:
  ```bash
  vibe guard [--no-ai] [-f text|json|md|sarif] [-b ci-merge-base|head|auto] [--allow-warn]
  ```
* **Real-World Input**:
  ```bash
  vibe guard --no-ai
  ```
* **Real-World Output (BLOCK Invariant)**:
  ```text
  VIBE GUARD (Decision Intelligence V2)
  Source files changed: 91 | Ignored/generated: 8 | Baseline: head

  [FAIL] Change scope                 risk 1.00  Source files changed: 91 | Ignored/generated files: 8
  [WARN] Requirement impact           risk 0.65  Touches requirement(s): REQ-001.
  [FAIL] Blast radius (dependents)    risk 1.00  app/core/database.py has 27 dependent file(s) in graph.
  [WARN] Dependency changes           risk 0.50  requirements.txt modified — new dependencies should be reviewed.
  [OK]   Secret exposure              risk 0.00  No obvious secret patterns in diff.

  Evaluated Decision: DEC-008 (Provider: rules, Confidence: 0.79 [MODERATE])
  Action:             BLOCK
  Affected requirements: REQ-001

    Tip: Run `vibe decisions` to inspect evidence, or `vibe override DEC-008 -r "reason"` to override.
  ```
* **Exit Codes**:
  - `0`: `ALLOW` (Safe to commit / merge)
  - `1`: `REVIEW` (Requires review or developer confirmation)
  - `2`: `BLOCK` (Blocked due to critical findings or high blast radius)
  - `3`: Configuration / Execution error
* **Why It's Useful**: Halts risky changes before they enter Git history or pass CI/CD.

---

#### 20. `vibe install-hooks` (alias: `vibe hooks`)
Installs `vibe guard` as an automated Git pre-commit hook in `.git/hooks/pre-commit`.

* **Command**:
  ```bash
  vibe install-hooks
  ```
* **Real-World Input**:
  ```bash
  vibe install-hooks
  ```
* **Real-World Output**:
  ```text
  ✔ Installed VIBE pre-commit hook in .git/hooks/pre-commit
  ```
* **Why It's Useful**: Ensures zero commits can be made without passing architectural safety checks.

---

### Domain 8: Diagnostics & Code Health

#### 21. `vibe doctor`
Performs an automated diagnostic scan across test detection, cross-tenant isolation, declared frameworks, and `.gitignore` setup.

* **Command**:
  ```bash
  vibe doctor [-f text|json|sarif]
  ```
* **Real-World Input**:
  ```bash
  vibe doctor
  ```
* **Real-World Output**:
  ```text
  ✔ No issues found. Repository passes all diagnostic checks.
  ```
* **Doctor Finding Example**:
  ```text
  VIBE DOCTOR — 1 finding(s)

   HIGH  Requirement REQ-001 is AT RISK: Zero automated cross-tenant isolation test cases detected. (Protected: 41, Authenticated: 41, Org-scoped: 41, Cross-tenant tests: 0)
  ```
* **Why It's Useful**: Discovers gaps between declared security requirements and actual automated test coverage.

---

### Domain 9: Graph Intelligence & Symbol Tracing

#### 22. `vibe explain`
Explains the architectural responsibility of a module, folder, or file.

* **Command**:
  ```bash
  vibe explain [target]
  ```
* **Real-World Input**:
  ```bash
  vibe explain app
  ```
* **Real-World Output**:
  ```text
  MODULE: app
  ============================================================
  Files: 35 | Lines: 4,820 | Primary Language: Python
  Frameworks: FastAPI, SQLAlchemy, Alembic

  Architectural Role:
    Core backend application service containing API routes, authentication dependencies,
    and relational data models.

  Key Dependencies:
    - Depends on: PostgreSQL, Redis, Qdrant
    - Depended upon by: tests, frontend (via HTTP API)
  ```
* **Why It's Useful**: Helps developers instantly understand complex modules without manual code spelunking.

---

#### 23. `vibe why`
Explains why a file exists, its linked requirements, and its callers.

* **Command**:
  ```bash
  vibe why <filePath>
  ```
* **Real-World Input**:
  ```bash
  vibe why app/core/deps.py
  ```
* **Real-World Output**:
  ```text
  WHY: app/core/deps.py
  ============================================================
  Role: Shared authentication and org-scoping dependency injector
  Linked Requirements:
    - REQ-001: Keep every route org-scoped and authenticated
  Active Constraints:
    - CON-001: Never cross organization tenant boundaries
  Dependent Routers (Callers):
    - app/api/routes/buyers.py
    - app/api/routes/deals.py
    - app/api/routes/properties.py
  Verifying Tests:
    - tests/test_auth_tenancy.py
  ```
* **Why It's Useful**: Answers *"Why was this written this way?"* and *"What depends on it?"* before editing.

---

#### 24. `vibe trace`
Traces any symbol (function, class, or HTTP route) across definitions, callers, and tests.

* **Command**:
  ```bash
  vibe trace <symbol>
  ```
* **Real-World Input**:
  ```bash
  vibe trace "GET /buyers"
  ```
* **Real-World Output**:
  ```text
  TRACE: GET /buyers
  ============================================================
  Definition:
    File: app/api/routes/buyers.py:46
    Handler: list_buyers(current_user: User = Depends(get_current_user))
  Authentication:
    Required: Yes (OAuth2 Bearer)
    Tenant Scoped: Yes (Buyer.org_id == current_user.org_id)
  Verifying Tests:
    - tests/test_auth_tenancy.py::test_unauthorized_requests_rejected
  ```
* **Why It's Useful**: Traces symbols and HTTP endpoints through the entire code graph in one step.

---

#### 25. `vibe impact`
Traverses reverse dependency edges to calculate the blast radius of modifying a file.

* **Command**:
  ```bash
  vibe impact <filePath> [-d <depth>] [-f text|json]
  ```
* **Real-World Input**:
  ```bash
  vibe impact app/core/database.py
  ```
* **Real-World Output**:
  ```text
  BLAST RADIUS: app/core/database.py
  ============================================================
  Direct Dependents: 12
  Transitive Dependents: 27 files (31% of codebase)

  High Risk Consumers:
    - app/core/deps.py
    - app/api/routes/buyers.py
    - app/api/routes/deals.py
    - app/services/scoring.py

  Recommendation: Require full regression testing on database schema changes.
  ```
* **Why It's Useful**: Warns developers before modifying shared foundational code that impacts many downstream files.

---

#### 26. `vibe context`
Generates a grounded, high-precision `AGENTS.md` context document for AI coding assistants.

* **Command**:
  ```bash
  vibe context "<task-description>" [-o <output-file>]
  ```
* **Real-World Input**:
  ```bash
  vibe context "implement webhook notification for buyer deals" -o AGENTS.md
  ```
* **Real-World Output**:
  ```text
  ✔ Generated AI Agent Context in AGENTS.md (scoped to 6 files, 1 requirement, 2 ADRs)
  ```
* **Why It's Useful**: Restricts AI models (Claude, Cursor, Copilot) to files strictly relevant to the task, eliminating context drift and file bloat.

---

### Domain 10: Snapshots, Storage & Provider Benchmarks

#### 27. `vibe checkpoint`
Manages atomic state snapshots of the engineering graph.

* **Commands**:
  ```bash
  vibe checkpoint create [message]
  vibe checkpoint list
  vibe checkpoint restore <checkpointId>
  ```
* **Real-World Input**:
  ```bash
  vibe checkpoint create "Before upgrading SQLAlchemy to v2"
  vibe checkpoint list
  ```
* **Real-World Output**:
  ```text
  ✔ Created checkpoint chk-1732009234: "Before upgrading SQLAlchemy to v2"

  CHECKPOINTS (3 total)
  -------------------------------------------------------------
  chk-1732009234  2026-11-19 14:20  Before upgrading SQLAlchemy to v2
  chk-1731998412  2026-11-19 11:13  Initial baseline scan
  ```
* **Why It's Useful**: Reverts architectural state safely during complex refactoring experiments.

---

#### 28. `vibe test-providers`
Benchmarks configured decision providers (`rules` vs `groq-llm`) against standardized test cases.

* **Command**:
  ```bash
  vibe test-providers
  ```
* **Real-World Input**:
  ```bash
  vibe test-providers
  ```
* **Real-World Output**:
  ```text
  PROVIDER BENCHMARK
  =============================================================
  Rules Provider:    Action: BLOCK   | Conf: 0.90 | Latency: 2ms   | Agreement: 100%
  Groq LLM Provider: Action: BLOCK   | Conf: 0.85 | Latency: 180ms | Agreement: 100%
  Hybrid Consensus:  Action: BLOCK   | Status: PASS
  ```
* **Why It's Useful**: Confirms that AI reasoning aligns with deterministic safety rules.

---

#### 29. `vibe migrate-storage`
Migrates JSON-based state (`.vibe/state.json`) to an embedded SQLite database (`.vibe/vibe.db`).

* **Command**:
  ```bash
  vibe migrate-storage
  ```
* **Real-World Input**:
  ```bash
  vibe migrate-storage
  ```
* **Real-World Output**:
  ```text
  ✔ Migrated storage from JSON to SQLite (.vibe/vibe.db)
  ✔ Backup saved to .vibe/state.json.bak
  ```
* **Why It's Useful**: Scales state storage performance for large enterprise repositories.

---

## CI/CD GitHub Actions Integration

Automate architectural validation in GitHub pull requests:

```yaml
name: VIBE Architectural Guard

on:
  pull_request:
    branches: [ main, master ]

jobs:
  guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install VIBE
        run: npm install -g vibe-dev

      - name: Run VIBE Guard
        run: vibe guard -b ci-merge-base -f sarif > vibe-report.sarif

      - name: Upload SARIF to GitHub Security Tab
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: vibe-report.sarif
```

---

## Monorepo Architecture Overview

VIBE is built as a modular TypeScript monorepo:
```text
packages/
├── decision-core/          # Pure domain contracts (zero dependencies)
├── core/                   # AST parser, DAG builder, diff engine, secret scanner, IgnoreEngine
├── decision-providers/
│   ├── rules/              # Zero-network deterministic rule provider
│   └── llm/                # High-throughput Groq LPU inference adapter
├── policy-engine/          # Confidence calculus and strict policy invariants
├── storage/                # Node 22 native SQLite and atomic JSON adapters
├── cli/                    # 29 Commander commands, preprocessor, and git hooks
└── vscode-extension/       # Reactive IDE client with 4 TreeView providers
```

---

## License

MIT © [DevFrames](https://github.com/tejakarthik657/vibe)

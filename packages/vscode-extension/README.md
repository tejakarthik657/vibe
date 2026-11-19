# VIBE by DevFrames — Engineering & Decision Intelligence

[![Version](https://img.shields.io/badge/version-0.4.8-blue.svg)](https://marketplace.visualstudio.com/items?itemName=devframes.vibe-vscode-extension)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/tejakarthik657/vibe)
[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-purple.svg)](https://marketplace.visualstudio.com/items?itemName=devframes.vibe-vscode-extension)

> **The Architectural & Decision Intelligence Layer for Modern Development.**  
> Transform abstract syntax trees (ASTs), dependency graphs, and Git diffs into explainable, confidence-weighted architectural decisions. Protect your codebase from unauthorized dependencies, secret exposure, broken tenant boundaries, and silent AI-generated regressions.

---

## Why VIBE?

As developers and teams increasingly rely on AI coding assistants (GitHub Copilot, Cursor, Claude, ChatGPT), code is generated faster than ever. However, AI assistants suffer from three critical blind spots:
1. **Context Blindness**: They do not know your project's architectural decisions, non-negotiable constraints, or tenancy boundaries.
2. **Architectural Drift**: They frequently import duplicate libraries, introduce unapproved frameworks, or violate separation of concerns.
3. **Hallucinated Truth**: When asked if a change is safe, AI models often invent confidence and approve unsafe diffs.

**VIBE solves this through a strict four-layer invariant:**

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

## Interactive VS Code Extension Interface

Click the **VIBE** icon in your VS Code Activity Bar to open four live, reactive tree panels:

### 1. Requirements Panel (`vibeRequirements`)
Displays all active business and technical goals.
- **Visual Status Badges**:
  - `✔ VERIFIED` (Green): Verified with automated test cases and org-scoped routes.
  - `⚠ AT_RISK` (Red/Yellow): Lacks cross-tenant tests or unauthenticated route coverage.
  - `○ ACTIVE` (Gray): Under active development.
- **One-Click Navigation**: Click any requirement to open its linked implementation file in the editor.

### 2. Decisions Panel (`vibeDecisions`)
Displays all Architectural Decision Records (ADRs) and AI-evaluated decisions.
- Shows confidence scores (e.g. `1.00 [HIGH]`, `0.75 [MODERATE]`), decision rationale, and provider provenance (`rules`, `groq-llm`).
- Interactive override directly from the context menu.

### 3. Constraints Panel (`vibeConstraints`)
Enforces your team's architectural non-negotiables:
- Categorized by severity: `CRITICAL`, `WARNING`, `INFO`.
- Example: *"Never cross organization tenant boundaries"*, *"Keep file sizes under 500 lines"*.

### 4. Tasks Panel (`vibeTasks`)
Tracks granular development tasks mapped to specific requirements:
- Status tags: `TODO`, `IN_PROGRESS`, `DONE`.
- Automatically keeps engineering goals aligned with source code.

---

## Dynamic Runtime Compatibility

The VIBE extension automatically detects and resolves your CLI environment in priority order:
1. Workspace-local binary: `./node_modules/.bin/vibe`
2. Custom configured path: `vibe.cliPath` in VS Code Settings
3. Global executable in `PATH`: `vibe`

On activation, the **VIBE Output Channel** reports:
```text
VIBE extension: 0.4.8 | CLI: 0.4.8 (global) | Compatibility: supported
```

---

## Complete CLI Command Reference (`vibe-dev`)

Every command is available in your terminal and directly mapped to the **VS Code Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`).

---

### Domain 1: Project Lifecycle & Setup

#### 1. `vibe init`
Initializes VIBE in the current workspace, creates the `.vibe/` directory, and generates a safe `.gitignore`.

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
* **Why It's Useful**: Sets up the state storage, configures ignore filters to prevent `.venv/` and `node_modules/` from blowing up diffs, and establishes the project baseline.

---

#### 2. `vibe scan` (alias: `vibe adopt`)
Parses ASTs across all files, detects frameworks, extracts exports/imports/routes, builds the dependency graph, and verifies requirement coverage.

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
* **Why It's Useful**: Gives VIBE complete deterministic awareness of every symbol, router prefix, database model, and cross-file import without guessing.

---

#### 3. `vibe status`
Displays a comprehensive health snapshot of your requirements, decisions, constraints, tasks, and recent scans.

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
* **Why It's Useful**: Provides a quick terminal dashboard for developers and tech leads to inspect architectural posture before starting new work.

---

#### 4. `vibe onboard` (alias: `vibe welcome`)
Interactive developer walkthrough explaining the project's tech stack, entry points, architecture decisions, and active requirements.

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
* **Why It's Useful**: Reduces developer onboarding time from days to minutes by surfacing verified architecture rules rather than outdated wiki pages.

---

#### 5. `vibe bootstrap`
Bootstraps initial architectural decisions and constraints using built-in production presets.

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
* **Why It's Useful**: Instantly equips new or existing repositories with sensible engineering standards without writing manual configurations.

---

#### 6. `vibe config`
Manages local configuration such as LLM provider keys and AI reasoning toggles.

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
* **Why It's Useful**: Keeps API credentials safely stored in `.vibe/config.json` (git-ignored) with automatic masking in logs.

---

### Domain 2: Architecture Governance & Drift Detection

#### 7. `vibe architect set`
Explicitly declares your intended production technology stack and database layers. Supports multi-word frameworks like `Voyage AI` and `Anthropic/Claude`.

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
* **Why It's Useful**: Establishes the authoritative standard for what technologies are permitted in your repository.

---

#### 8. `vibe drift`
Compares declared architecture against detected imports and dependencies in the code graph.

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
* **Drift Detected Example Output**:
  ```text
  ARCHITECTURE DRIFT

  ✓ Matching: fastapi, react
  ⚠ Detected but not declared: mongodb
    This may indicate an unauthorized dependency or unintended architecture change.
  ⚠ Declared but not detected: postgresql
  ```
* **Why It's Useful**: Stops rogue dependencies or accidental architectural swaps before they make it into production.

---

### Domain 3: Requirements Engineering & Evidence Verification

#### 9. `vibe requirement add`
Adds a business or technical requirement to be tracked and verified against source code and tests.

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
* **Why It's Useful**: Embeds functional invariants directly into your repository where VIBE can continuously audit them.

---

#### 10. `vibe requirement link`
Links a requirement to a specific source file or router.

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
* **Why It's Useful**: Connects abstract product specifications directly to concrete AST nodes and file paths.

---

#### 11. `vibe requirement list`
Lists all active requirements with their current verification status.

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
* **Why It's Useful**: Gives developers immediate clarity on which requirements are backed by automated tests and which are at risk.

---

### Domain 4: Architectural Decision Records (ADRs) & Overrides

#### 12. `vibe decision add`
Records an Architectural Decision Record (ADR) capturing context, choices, and consequences.

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
* **Why It's Useful**: Prevents architectural amnesia by documenting why technical paths were chosen directly in the repository history.

---

#### 13. `vibe decisions`
Displays the complete audit history of AI-evaluated change assessments and human overrides.

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
* **Why It's Useful**: Provides a tamper-evident governance ledger showing every decision made by VIBE and your team.

---

#### 14. `vibe override`
Overrides an automated `BLOCK` or `REVIEW` action with an explicit developer justification. Automatically logs a new ADR.

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
* **Why It's Useful**: Empowers senior developers to bypass automated gates safely while maintaining 100% accountability in the audit trail.

---

### Domain 5: Architectural Constraints

#### 15. `vibe constraint add`
Adds a project constraint enforced by `vibe guard` and `vibe doctor`.

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
* **Why It's Useful**: Enforces organizational security standards across human developers and autonomous AI coding agents.

---

#### 16. `vibe constraint list`
Lists all declared project constraints.

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
* **Why It's Useful**: Keeps guardrails visible and top-of-mind during code reviews.

---

### Domain 6: Task Management

#### 17. `vibe task add`
Adds an engineering task mapped to a requirement.

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
* **Why It's Useful**: Connects day-to-day coding tickets directly to high-level architectural requirements.

---

#### 18. `vibe task list`
Lists all active project tasks.

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
* **Why It's Useful**: Visible inside the VS Code Tasks tree view for real-time progress tracking.

---

### Domain 7: Guard & CI/CD Protection

#### 19. `vibe guard`
The premier safety engine of VIBE. Analyzes working tree or CI merge base diffs against the architecture graph, secret patterns, and blast radius.

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
* **Why It's Useful**: Prevents regressions, leaked API keys, and unauthorized schema changes before code reaches Git history.

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
* **Why It's Useful**: Ensures that every commit made by any team member or AI agent is automatically validated before leaving the local machine.

---

### Domain 8: Diagnostics & Code Health

#### 21. `vibe doctor`
Performs an exhaustive health check across test coverage, tenancy assertions, framework declarations, and `.gitignore` safety.

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
* **Why It's Useful**: Highlights silent vulnerabilities—such as having authenticated routes but zero multi-tenant boundary test cases.

---

### Domain 9: Graph Intelligence & Symbol Tracing

#### 22. `vibe explain`
Explains the architectural role of a module or file in the dependency graph.

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
* **Why It's Useful**: Gives developers instant context on what a module does and who depends on it.

---

#### 23. `vibe why`
Explains why a specific file exists, linking it to requirements, callers, ADRs, and tests.

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
* **Why It's Useful**: Answers *"Why was this written this way?"* and *"What will break if I touch it?"* before you make a change.

---

#### 24. `vibe trace`
Traces any symbol (class, function, route, or dotted FQN) across definitions, callers, and tests. Supports HTTP routes like `GET /buyers` and dotted paths like `app.core.deps.get_current_user`.

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
* **Why It's Useful**: Lets you audit any HTTP route or function from terminal or editor in a single step.

---

#### 25. `vibe impact`
Calculates the blast radius of editing a file by traversing reverse dependency edges in the code graph.

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
* **Why It's Useful**: Warns you before you edit a critical foundation file that impacts dozens of downstream modules.

---

#### 26. `vibe context`
Generates a grounded, high-precision `AGENTS.md` context document tailored for AI coding agents (Claude Code, Cursor, Copilot).

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
* **Generated File Snippet (`AGENTS.md`)**:
  ```markdown
  # AI Agent Context — real-estate-bi
  > Generated by VIBE. Treat this as the definitive scope boundary.

  ## Current Task
  implement webhook notification for buyer deals

  ## Relevant Requirements
  - **REQ-001**: Keep every route org-scoped and authenticated

  ## Files In Scope
  - `app/api/routes/deals.py`
  - `app/models/deal.py`
  - `app/services/webhooks.py`

  ## Validation Commands
  - `pytest tests/ -v`
  - `vibe guard --no-ai`
  ```
* **Why It's Useful**: Prevents AI assistants from wandering outside task boundaries, hallucinating libraries, or rewriting unrelated files.

---

### Domain 10: Snapshots, Storage & Provider Benchmarks

#### 27. `vibe checkpoint`
Creates or restores atomic snapshots of the engineering state graph.

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
* **Why It's Useful**: Lets you experiment with large refactorings and revert your architectural state if needed.

---

#### 28. `vibe test-providers`
Runs a live benchmark comparing decision evaluations across the deterministic `rules` provider and the `groq-llm` provider.

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
* **Why It's Useful**: Validates that your configured AI providers agree with deterministic safety rules before relying on them in CI/CD.

---

#### 29. `vibe migrate-storage`
Migrates `.vibe/state.json` into a production-grade SQLite embedded database (`.vibe/vibe.db`) with automatic backup.

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
* **Why It's Useful**: Scales storage performance for large enterprise codebases with thousands of files and edges.

---

## CI/CD GitHub Actions Integration

Add VIBE to your continuous integration pipeline to block unsafe PRs automatically:

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

## License

MIT © [DevFrames](https://github.com/tejakarthik657/vibe)

# VIBE by DevFrames — Decision Intelligence for VS Code

![VIBE Cover](resources/icon.jpg)

**VIBE** is the engineering decision-intelligence layer for modern software development. It transforms deterministic static facts, AST dependency graphs, and git diffs into confidence-aware, explainable architectural decisions without allowing AI to hallucinate as the source of truth.

> **Foundational Principle**: Facts remain deterministic. AI interprets facts. Policy decides actions.

---

## Architecture and Core Philosophy

In software teams and AI-augmented coding environments, developers frequently introduce silent regressions, unauthorized third-party libraries, or drift from documented architecture. VIBE solves this through a four-stage execution pipeline:

1. **Deterministic Static Verification**: Inspects abstract syntax trees (ASTs), discovers framework imports, evaluates requirement test coverage, and scans for secret leaks.
2. **Confidence-Weighted AI Interpretation**: Synthesizes verified evidence into structured risk assessments using high-speed reasoning (Groq LLM) with automatic fallback to deterministic rules.
3. **Policy Resolution**: Applies mathematical thresholds to map confidence and evidence severity into actionable directives (`ALLOW`, `WARN`, `REVIEW`, `BLOCK`).
4. **Permanent Governance Ledger**: Maintains a queryable audit history and supports explicit developer overrides with automatic Architectural Decision Record (ADR) generation.

---

## Interactive Sidebar Interface

Click the **VIBE** icon in your VS Code Activity Bar to access four live, reactive panels:

- **Requirements**: Active business and technical goals with status verification (`verified`, `at_risk`, `unverified`).
- **Decisions**: Architectural Decision Records (ADRs) and AI evaluations with confidence indicators and provider provenance.
- **Constraints**: Architectural non-negotiables, boundary constraints, and security rules (`critical`, `warning`, `info`).
- **Tasks**: Active sprint work items mapped to requirements (`todo`, `in_progress`, `done`).

The sidebar updates automatically whenever `.vibe/state.json` or `.vibe/vibe.db` changes on disk.

---

## Complete CLI Command Reference (`vibe-dev`)

The following reference documents all 29 commands and flags available in the VIBE CLI engine, organized by functional domain.

### Domain 1: Installation, Initialization & Configuration

#### 1. `npm install -g vibe-dev`
Installs the VIBE CLI engine globally on your system.

```bash
npm install -g vibe-dev
```

#### 2. `vibe init`
Initializes VIBE in the current repository, creating the `.vibe/` directory and foundational metadata.

```bash
vibe init
```

*Example Output:*
```text
[INFO] Initialized VIBE for project "my-service"
Created .vibe/state.json
```

#### 3. `vibe config set groq_api_key <key>`
Stores your Groq API key securely in `.vibe/config.json`. This file is git-ignored and never committed.

```bash
vibe config set groq_api_key gsk_sample_api_key_here
```

#### 4. `vibe config set ai false` / `vibe config set ai true`
Toggles AI reasoning globally. When set to `false`, forces 100% deterministic baseline rules for offline or air-gapped workflows.

```bash
vibe config set ai false
```

#### 5. `vibe config show`
Displays local configuration with sensitive tokens safely masked.

```bash
vibe config show
```

*Example Output:*
```text
LOCAL VIBE CONFIGURATION
=============================================================
  groq_api_key: gsk_hfG...cg7J
  ai: true
```

---

### Domain 2: Codebase Scanning & Graph Analysis

#### 6. `vibe scan`
Parses the codebase AST, extracts internal and external dependencies, and updates the architectural graph.

```bash
vibe scan
```

#### 7. `vibe status`
Summarizes project health, tracked requirements, decisions, constraints, tasks, and recent scan timestamps.

```bash
vibe status
```

#### 8. `vibe trace <symbol>`
Traces a function, class, or interface across the dependency graph to identify definitions, imports, and downstream callers.

```bash
vibe trace StorageAdapter
```

#### 9. `vibe why <filepath>`
Explains why a given file exists by tracing its links to requirements, sprint tasks, and architectural decisions.

```bash
vibe why packages/policy-engine/src/store.ts
```

#### 10. `vibe drift`
Compares declared architecture manifests against actual AST imports to detect unauthorized frameworks or libraries.

```bash
vibe drift
```

---

### Domain 3: Governance, ADRs, Constraints & Tasks

#### 11. `vibe requirement add "<text>"` *(Alias: `vibe req add`)*
Registers a business or technical requirement into the project graph.

```bash
vibe req add "OAuth2 authentication for Google and GitHub"
```

#### 12. `vibe decision add "<title>" -c "<context>" -d "<decision>"` *(Alias: `vibe adr add`)*
Documents an Architectural Decision Record (ADR) with business context and rationale.

```bash
vibe adr add "Database Engine" -c "Need high-performance relational analytics" -d "Use PostgreSQL and Redis"
```

#### 13. `vibe constraint add "<rule>"` *(Alias: `vibe con add`)*
Enforces an architectural non-negotiable or security invariant across future diffs.

```bash
vibe con add "Do not commit API secrets to repository"
```

#### 14. `vibe task add "<title>"`
Registers a scoped sprint task mapped to active requirements.

```bash
vibe task add "Implement JWT token refresh mechanism"
```

---

### Domain 4: Risk Analysis & Decision Intelligence

#### 15. `vibe guard`
Evaluates uncommitted working-tree changes for scope churn, secret exposure, dependency drift, and blast radius using AI reasoning.

```bash
vibe guard
```

*Example Output:*
```text
VIBE GUARD (Decision Intelligence V2)
13 file(s) changed

[WARN] Change scope                 risk 0.43  13 file(s) changed in working tree.
[OK] Requirement impact           risk 0.05  No tracked requirements touched by this diff.
[OK] Blast radius (dependents)    risk 0.13  packages/cli/src/commands/guard.ts has 1 dependent(s).
[WARN] Dependency changes           risk 0.50  package.json modified.
[OK] Secret exposure              risk 0.00  No secret patterns detected.

Evaluated Decision: DEC-004 (Provider: groq-llm, Confidence: 0.40 [LOW])
Action:             REVIEW

  Tip: Run `vibe decisions` to inspect evidence, or `vibe decision accept DEC-004` to override.
```

#### 16. `vibe guard --no-ai`
Runs the guard pipeline in 100% deterministic, offline mode without invoking remote inference.

```bash
vibe guard --no-ai
```

#### 17. `vibe guard -f md`
Outputs the guard evaluation as GitHub-flavored Markdown for CI/CD pipelines and pull-request comments.

```bash
vibe guard -f md
```

*Example Output:*
```markdown
### VIBE Guard (Decision Intelligence V2)
13 file(s) changed.

| Check | Risk | Detail |
|---|---|---|
| [WARN] Change scope | 0.43 | 13 file(s) changed |
| [OK] Secret exposure | 0.00 | No secrets found |

**Evaluated Decision:** DEC-004 (Provider: groq-llm, Confidence: 0.40)
**Resolved Action:** **REVIEW**
```

#### 18. `vibe impact <filepath>`
Calculates the transitive blast radius of a file and provides AI-driven risk interpretation.

```bash
vibe impact packages/core/src/index.ts
```

*Example Output:*
```text
IMPACT ANALYSIS — packages/core/src/index.ts
Direct dependents: 3 | Transitive dependents: 12
Risk Level: MODERATE

AI Reasoning & Risk Interpretation:
  Provider: groq-llm (Confidence: 0.88)
  Rationale: Modifying index.ts alters core AST contracts imported across multiple CLI command modules.
```

---

### Domain 5: Storage Architecture & Provider Benchmarking

#### 19. `vibe migrate-storage`
Migrates JSON files (`.vibe/state.json`, `.vibe/decisions.json`) into Node 22 native relational SQLite (`.vibe/vibe.db`).

```bash
vibe migrate-storage
```

*Example Output:*
```text
VIBE STORAGE MIGRATOR
Migrating .vibe/state.json and .vibe/decisions.json to .vibe/vibe.db...
✔ Storage Migration Completed Successfully!
  State Migrated:         YES
  Decision Logs Migrated: 5 record(s)
  Database created at: .vibe/vibe.db (Node 22 SQLite Engine)
```

#### 20. `vibe test-providers`
Executes side-by-side benchmark scenarios comparing accuracy, latency, and confidence between deterministic Rules and Groq LLM inference.

```bash
vibe test-providers
```

*Example Output:*
```text
VIBE V2 — DECISION PROVIDER BENCHMARK & COMPARISON MATRIX
==========================================================================

Scenario 001: Clean Repo (No risks)
  [rules-provider]   Decision: ALLOW | Conf: 1.00 | Latency: 1ms
  [groq-llm]         Decision: REVIEW_REQUIRED | Conf: 0.00 | Latency: 1448ms

Scenario 002: Undeclared Database Drift (MongoDB added)
  [rules-provider]   Decision: REVIEW_REQUIRED | Conf: 1.00 | Latency: 0ms
  [groq-llm]         Decision: REVIEW_REQUIRED | Conf: 0.93 | Latency: 1003ms

Scenario 003: High Secret Exposure Risk
  [rules-provider]   Decision: REVIEW_REQUIRED | Conf: 1.00 | Latency: 0ms
  [groq-llm]         Decision: BLOCK | Conf: 0.95 | Latency: 888ms
```

---

### Domain 6: Audit Ledger & Human Overrides

#### 21. `vibe decisions`
Displays the full decision audit history with assigned confidence tiers and provider provenance.

```bash
vibe decisions
```

#### 22. `vibe decision accept <id> -r "<reason>"`
Overrides an automated `REVIEW` or `BLOCK` decision and automatically generates an Architectural Decision Record (ADR).

```bash
vibe decision accept DEC-004 -r "MongoDB introduced intentionally for analytics service"
```

---

### Domain 7: Diagnostics, Scaffolding & Git Hooks

#### 23. `vibe doctor`
Performs comprehensive repository diagnostics, checking for uncommitted drift, missing documentation, and policy gaps.

```bash
vibe doctor
```

#### 24. `vibe explain`
Generates an evidence-grounded structural explanation of how project components, requirements, and decisions interlink.

```bash
vibe explain
```

#### 25. `vibe context`
Generates a scoped `AGENTS.md` file designed to provide autonomous AI coding agents with verified architectural context.

```bash
vibe context
```

#### 26. `vibe checkpoint`
Creates an immutable snapshot of current project state prior to large refactoring sessions.

```bash
vibe checkpoint
```

#### 27. `vibe onboard` *(Alias: `vibe welcome`)*
Interactive onboarding walkthrough explaining the project's architecture, requirements, and non-negotiables for new team members.

```bash
vibe onboard
```

#### 28. `vibe bootstrap`
Scaffolds pre-configured architecture templates and constraint presets (e.g., Next.js, Express, Microservices).

```bash
vibe bootstrap
```

#### 29. `vibe install-hooks`
Installs pre-commit hooks in `.git/hooks/pre-commit` to ensure `vibe guard` validates every commit before it reaches Git history.

```bash
vibe install-hooks
```

---

## VS Code Command Palette Reference (`Ctrl+Shift+P` / `Cmd+Shift+P`)

All CLI features are accessible natively through the VS Code Command Palette:

| Command Palette Entry | Executed Action |
|---|---|
| `VIBE: Guard Current Changes (Decision Intelligence)` | Runs `vibe guard` and opens the output channel with evaluated risk. |
| `VIBE: Analyze File Impact & Blast Radius` | Analyzes the active editor file for transitive blast radius and dependencies. |
| `VIBE: Check Architecture Drift` | Runs `vibe drift` to inspect undeclared framework imports. |
| `VIBE: Show Decision History & Audit Trail` | Opens the decision log history (`vibe decisions`). |
| `VIBE: Accept & Override Decision` | Prompts for a Decision ID and reason, executing `vibe decision accept`. |
| `VIBE: Test Decision Providers Benchmark` | Runs `vibe test-providers` benchmark suite in the editor. |
| `VIBE: Migrate Storage to SQLite` | Migrates state into `.vibe/vibe.db` without leaving VS Code. |
| `VIBE: Trace Symbol Definition & Callers` | Prompts for a symbol name and displays graph references (`vibe trace`). |
| `VIBE: Why Does This File Exist?` | Inspects requirement and ADR linkages for the active file (`vibe why`). |
| `VIBE: Run Doctor Diagnostics` | Executes `vibe doctor` repository health checks. |
| `VIBE: Scan Project` | Runs AST scanner and refreshes sidebar graph views. |
| `VIBE: Explain Architecture Graph` | Generates architectural explanations for components (`vibe explain`). |
| `VIBE: Generate AI Agent Context` | Scopes codebase sub-graphs into `AGENTS.md` (`vibe context`). |
| `VIBE: Create Checkpoint` | Captures an immutable state snapshot (`vibe checkpoint`). |
| `VIBE: Onboard Developer Walkthrough` | Launches the interactive developer onboarding guide (`vibe onboard`). |
| `VIBE: Bootstrap Architecture Presets` | Bootstraps architecture presets for common tech stacks (`vibe bootstrap`). |
| `VIBE: Show Project Status` | Displays system metrics in the VIBE output panel (`vibe status`). |
| `VIBE: Show Configuration` | Inspects local configuration and API settings (`vibe config show`). |
| `VIBE: Add Requirement` | Interactive prompt to register a new requirement (`vibe req add`). |
| `VIBE: Add Decision (ADR)` | Multi-step prompt to record title, context, and decision (`vibe adr add`). |
| `VIBE: Add Constraint` | Interactive prompt to register an architectural rule (`vibe con add`). |
| `VIBE: Add Task` | Interactive prompt to register a scoped sprint task (`vibe task add`). |
| `VIBE: Refresh Sidebar` | Forces an immediate refresh of all Activity Bar tree views. |

---

## Extension Specifications

- **Publisher**: `devframes`
- **Extension ID**: `devframes.vibe-vscode-extension`
- **Supported Environments**: VS Code, Cursor, Windsurf (`^1.85.0`)
- **Repository**: [https://github.com/tejakarthik657/vibe.git](https://github.com/tejakarthik657/vibe.git)
- **Marketplace Listing**: [https://marketplace.visualstudio.com/items?itemName=devframes.vibe-vscode-extension](https://marketplace.visualstudio.com/items?itemName=devframes.vibe-vscode-extension)
- **Design Guidelines**: Pure technical documentation, zero emojis, professional tone.

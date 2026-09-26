# VIBE by DevFrames — Decision Intelligence for VS Code

VIBE is the engineering decision-intelligence layer for AI-assisted development. It transforms deterministic code facts, AST graphs, and git diffs into auditable, confidence-aware decision reasoning.

Facts remain deterministic. AI interprets facts. Policy decides actions.

---

## Key Features

### 1. Change Guard & Risk Analysis
Evaluates uncommitted git diffs against architectural drift, secret exposure risks, dependency manifest changes, and requirement coverage before code is merged.

### 2. File Impact & Blast Radius Analysis
Performs transitive dependency graph walking across modules to predict the ripple effects of code modifications before changes are committed.

### 3. Interactive Engineering Sidebar UI
Displays live, reactive tree views of your workspace architecture:
- **Requirements**: Tracked business and technical goals with status verification.
- **Decisions**: Formal Architectural Decision Records (ADRs) and AI decision logs.
- **Constraints**: Critical code policies and boundary rules.
- **Tasks**: Scoped engineering tasks linked to requirements.

### 4. Auditable Decision & Human Override Engine
Logs every evaluated decision with explicit confidence scores, provider provenance (Rules vs LLM), and structural evidence lists. Includes human override capabilities (`vibe decision accept`) with automatic ADR generation.

### 5. Multi-Provider Fallback & Storage Engine
Leverages high-speed reasoning (Groq LLM) with automatic fallback to baseline deterministic rules if offline. Uses local Node 22 relational SQLite storage (`.vibe/vibe.db`).

---

## Command Palette Reference (`Ctrl+Shift+P`)

Access all VIBE intelligence tools directly inside VS Code:

- **`VIBE: Guard Current Changes (Decision Intelligence)`**: Evaluates working tree diff risk.
- **`VIBE: Analyze File Impact & Blast Radius`**: Analyzes transitive file impact.
- **`VIBE: Show Decision History & Audit Trail`**: Displays decision audit records.
- **`VIBE: Accept & Override Decision`**: Overrides a review/block decision with an ADR.
- **`VIBE: Test Decision Providers Benchmark`**: Compares Rules vs LLM latency and accuracy.
- **`VIBE: Migrate Storage to SQLite`**: Migrates JSON state to relational SQLite storage.
- **`VIBE: Explain Architecture Graph`**: Summarizes module and requirement connections.
- **`VIBE: Generate AI Agent Context`**: Generates scoped sub-graphs for AI agents (`AGENTS.md`).
- **`VIBE: Run Doctor Diagnostics`**: Prioritizes repository health issues and fixes.
- **`VIBE: Check Architecture Drift`**: Detects undeclared imports and frameworks.
- **`VIBE: Scan Project`**: Scans codebase AST and updates engineering graph.
- **`VIBE: Create Checkpoint`**: Creates a state snapshot.
- **`VIBE: Add Requirement`**: Interactively registers a new requirement.
- **`VIBE: Add Decision (ADR)`**: Interactively registers a new ADR.
- **`VIBE: Add Constraint`**: Interactively registers a new constraint rule.
- **`VIBE: Add Task`**: Interactively registers a new scoped task.
- **`VIBE: Show Project Status`**: Displays overview of project metrics.
- **`VIBE: Show Configuration`**: Displays local VIBE settings.
- **`VIBE: Refresh Sidebar`**: Force refreshes the VIBE activity bar sidebar.

---

## Requirements & Setup

1. Install the CLI engine globally or in your workspace:
   ```bash
   npm install -g vibe-dev
   ```
2. Open any workspace directory containing a VIBE configuration or run `vibe init` via terminal.
3. Configure your API key locally (git-ignored in `.vibe/config.json`):
   ```bash
   vibe config set groq_api_key <your_api_key>
   ```

---

## Extension Settings

VIBE uses workspace settings and local `.vibe/config.json` configuration. You can toggle AI reasoning on or off globally using:

```bash
vibe config set ai false
```

---

## Publisher Information

Developed and maintained by **DevFrames** (`devframes`).  
Repository: [https://github.com/tejakarthik657/vibe.git](https://github.com/tejakarthik657/vibe.git)

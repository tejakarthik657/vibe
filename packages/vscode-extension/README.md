# VIBE by DevFrames — Decision Intelligence for VS Code

![VIBE Cover](resources/icon.jpg)

**VIBE** is the engineering decision-intelligence layer for AI-assisted software development. It transforms deterministic code facts, AST graphs, and git diffs into auditable, confidence-aware decision reasoning.

> **Core Principle**: Facts remain deterministic. AI interprets facts. Policy decides actions.

---

## Overview

When developers use autonomous coding agents or generative tools, architectural drift and regressions frequently slip through due to context blindness. VIBE solves this by decoupling static code verification from semantic interpretation:

1. **Deterministic Static Verification**: Inspects AST imports, detects framework drift, evaluates test coverage, and scans for secret leaks.
2. **Confidence-Weighted AI Interpretation**: Synthesizes verified evidence to identify subtle architectural risks and blast-radius ripple effects.
3. **Policy Enforcement**: Automatically resolves governance actions: `ALLOW`, `WARN`, `REVIEW`, or `BLOCK`.
4. **Permanent Audit Trail**: Records decision history and human overrides with automatic Architectural Decision Record (ADR) generation.

---

## Interactive Sidebar Interface

Click the **VIBE** icon in your VS Code Activity Bar to access 4 live, reactive panels:

- **Requirements**: Track business and technical goals with automated status indicators (`verified`, `at_risk`, `unverified`).
- **Decisions**: Formal Architectural Decision Records (ADRs) and decision logs complete with confidence scores.
- **Constraints**: Architectural non-negotiables and safety rules with severity levels (`critical`, `warning`, `info`).
- **Tasks**: Active engineering sprint tasks mapped directly to requirements (`todo`, `in_progress`, `done`).

The sidebar updates automatically whenever your project state or SQLite database changes.

---

## Command Palette Reference (`Ctrl+Shift+P` / `Cmd+Shift+P`)

Execute any VIBE capability without leaving your editor:

### Governance & Risk
- `VIBE: Guard Current Changes (Decision Intelligence)` — Evaluates working-tree changes against architectural rules, drift, and secret exposure.
- `VIBE: Analyze File Impact & Blast Radius` — Inspects the active file's transitive dependent graph and risk level.
- `VIBE: Check Architecture Drift` — Identifies undeclared packages, databases, and framework imports.
- `VIBE: Show Decision History & Audit Trail` — Displays the decision ledger with confidence scores and provider provenance.
- `VIBE: Accept & Override Decision` — Records an explicit human override with an auto-generated ADR.

### Diagnostics & Intelligence
- `VIBE: Run Doctor Diagnostics` — Surfaces prioritized repository health issues with guided remediation.
- `VIBE: Scan Project` — Parses the codebase AST and updates the architectural dependency graph.
- `VIBE: Explain Architecture Graph` — Provides evidence-grounded structural explanations of component connections.
- `VIBE: Generate AI Agent Context` — Generates a scoped `AGENTS.md` sub-graph for external coding agents.
- `VIBE: Test Decision Providers Benchmark` — Compares latency and confidence between deterministic Rules and LLM inference.

### Storage & Project Memory
- `VIBE: Migrate Storage to SQLite` — Performs lossless migration from JSON state to Node 22 relational SQLite (`.vibe/vibe.db`).
- `VIBE: Create Checkpoint` — Captures an instant snapshot of project state before refactoring.
- `VIBE: Show Project Status` — Summarizes requirements, ADRs, constraints, and scanned module counts.
- `VIBE: Show Configuration` — Inspects local configuration and API settings.
- `VIBE: Refresh Sidebar` — Manually refreshes all tree views in the Activity Bar.

### Architectural Authoring
- `VIBE: Add Requirement` — Interactively registers a new business or technical requirement.
- `VIBE: Add Decision (ADR)` — Interactively documents a new architectural decision.
- `VIBE: Add Constraint` — Registers an architectural rule or security constraint.
- `VIBE: Add Task` — Registers a scoped sprint task.

---

## Quick Start

### 1. Install the CLI Engine
The VS Code extension interfaces with the `vibe-dev` command-line engine. Install it globally:

```bash
npm install -g vibe-dev
```

### 2. Initialize VIBE in Your Workspace
Open your project in VS Code, open the integrated terminal, and run:

```bash
vibe init
```

### 3. Optional: Configure AI Provider
For semantic reasoning via Groq LLM, set your API key locally (stored securely in `.vibe/config.json`, which is git-ignored):

```bash
vibe config set groq_api_key <your_groq_api_key>
```

*(If no API key is provided or if network connectivity is unavailable, VIBE transparently falls back to 100% deterministic local rules.)*

---

## Configuration & Toggles

VIBE reads workspace configuration from `.vibe/config.json`. Useful configuration commands:

- **Disable AI Globally**: Force deterministic, offline-only evaluation:
  ```bash
  vibe config set ai false
  ```
- **Inspect Configuration**: View masked keys and active settings:
  ```bash
  vibe config show
  ```

---

## Extension Specifications

- **Publisher**: `devframes`
- **Identifier**: `devframes.vibe-vscode-extension`
- **Repository**: [https://github.com/tejakarthik657/vibe.git](https://github.com/tejakarthik657/vibe.git)
- **Marketplace**: [https://marketplace.visualstudio.com/items?itemName=devframes.vibe-vscode-extension](https://marketplace.visualstudio.com/items?itemName=devframes.vibe-vscode-extension)
- **Supported Editors**: VS Code, Cursor, Windsurf (`^1.85.0`)
- **Tone**: Clean, professional, documentation-grade (no emojis)

# VIBE CLI (`vibe-dev`) — Developer & Architecture Intelligence

> **The Command-Line Engineering Intelligence Layer for AI-Assisted Development.**

[![NPM Version](https://img.shields.io/npm/v/vibe-dev.svg?style=flat-square&color=007acc)](https://www.npmjs.com/package/vibe-dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## Installation

Install globally via npm:
```bash
npm install -g vibe-dev
```

Or run via npx:
```bash
npx vibe-dev status
```

---

## Why VIBE CLI?

AI coding tools (Copilot, Cursor, Claude Code) generate code without architectural awareness. The VIBE CLI gives you deterministic compiler-level governance over:
- **Architectural Drift**: Compares actual AST imports against your declared production stack.
- **Change Safety (Guard)**: Evaluates git diffs in sub-120ms against blast radius, secret patterns, and requirements (`BLOCK = exit code 2`).
- **Evidence Verification**: Verifies requirements against actual route decorators and cross-tenant tests.
- **AI Agent Scoping**: Generates file-grounded `AGENTS.md` context packets to keep AI agents from wandering.

---

## Complete Command Reference (All 29 Commands)

### Domain 1: Project Lifecycle & Setup
- **`vibe init [--name <name>]`**: Initializes `.vibe/` directory and auto-generates safe `.gitignore`.
- **`vibe scan [-f text|json]`** (alias: `vibe adopt`): Builds the AST dependency graph and verifies requirement evidence.
- **`vibe status [-f text|json]`**: Displays current architectural posture, requirements, ADRs, and constraints.
- **`vibe onboard`** (alias: `vibe welcome`): Interactive walkthrough for new engineers explaining the stack and rules.
- **`vibe bootstrap [--preset fullstack|microservice]`**: Injects baseline constraints and architectural decisions.
- **`vibe config set <key> <value>` / `vibe config show`**: Manages local settings and Groq LLM API keys safely.

### Domain 2: Architecture Governance & Drift
- **`vibe architect set -f "<frameworks>" --database "<dbs>"`**: Declares authorized technologies (supports multi-word names like `Voyage AI`).
- **`vibe drift [-f text|json]`**: Audits code graph against declared stack to detect unauthorized dependencies.

### Domain 3: Requirements Engineering & Evidence
- **`vibe requirement add "<text>" [-t "<tags>"]`**: Adds functional or security requirements.
- **`vibe requirement link <reqId> <filePath>`**: Binds requirements directly to source files.
- **`vibe requirement list`**: Lists requirements with live automated verification badges (`verified`, `at_risk`).

### Domain 4: Architectural Decision Records (ADRs) & Overrides
- **`vibe decision add "<title>" -d "<decision>" -c "<context>"`**: Codifies architectural decisions into the repository.
- **`vibe decisions`**: Inspects the immutable audit log of AI evaluations and human overrides.
- **`vibe override <decisionId> -r "<reason>"`**: Allows senior developers to override automated gates with full audit trails.

### Domain 5: Architectural Constraints
- **`vibe constraint add "<text>" [-s critical|warning|info]`**: Declares non-negotiable architectural boundaries.
- **`vibe constraint list`**: Displays all active constraints.

### Domain 6: Task Tracking
- **`vibe task add "<title>" [-r <reqId>]`**: Adds engineering tickets linked directly to requirements.
- **`vibe task list`**: Displays active tasks with requirement links.

### Domain 7: Guard & CI/CD Gates
- **`vibe guard [--no-ai] [-f text|json|md|sarif] [-b ci-merge-base|head]`**: Strict safety gate. Blocks high-risk diffs (`exit code 2 = BLOCK`).
- **`vibe install-hooks`**: Installs `vibe guard` into `.git/hooks/pre-commit`.

### Domain 8: Diagnostics & Code Health
- **`vibe doctor [-f text|json|sarif]`**: Scans for test coverage, cross-tenant isolation, framework gaps, and `.gitignore` health.

### Domain 9: Graph Intelligence & Tracing
- **`vibe explain [target]`**: Explains the architectural purpose of any module or directory.
- **`vibe why <filePath>`**: Explains why a file exists, its callers, its ADRs, and its tests.
- **`vibe trace <symbol>`**: Traces functions, classes, and HTTP routes (`GET /buyers`) across the codebase.
- **`vibe impact <filePath>`**: Calculates the blast radius and downstream consumers of editing a file.
- **`vibe context "<task>" [-o AGENTS.md]`**: Generates scoped context files for autonomous AI agents.

### Domain 10: Snapshots, Storage & Benchmarks
- **`vibe checkpoint create [message]` / `list` / `restore <id>`**: Manages atomic state graph snapshots.
- **`vibe test-providers`**: Benchmarks deterministic rules vs Groq LLM reasoning.
- **`vibe migrate-storage`**: Upgrades JSON storage to embedded SQLite (`.vibe/vibe.db`).

---

## License

MIT © [DevFrames](https://github.com/tejakarthik657/vibe)

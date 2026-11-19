# 05. Codebase Organization & File-by-File Technical Accountability
**Document**: `docs/05-codebase-organization.md`  
**System**: VIBE (Vibe Intent & Boundary Engine)  
**Perspective**: The Tour of the Monorepo, File Responsibilities & Design Intent

---

## 5.1 The Philosophy: Clean Separation of Concerns
When an unfamiliar developer opens a repository, they shouldn't have to guess where business logic ends and presentation begins. 

A poorly organized codebase has database queries inside CLI command files, AST parsers mixed with prompt engineering templates, and UI components writing directly to disk. When something breaks, debugging feels like searching for a needle in a haystack.

In VIBE, we followed one golden rule:
> **"Every file has a single, unambiguous reason to change."**

- If TypeScript releases a new syntax feature, only `scanner.ts` changes.
- If we change how circular dependencies are reported, only `graph.ts` changes.
- If we swap Groq for another LLM, only `llm-provider.ts` changes.
- If we switch from SQLite to PostgreSQL, only `sqlite-adapter.ts` changes.

Let's walk through every package and every critical file in the monorepo.

---

## 5.2 The 7 Packages: Purpose and Boundaries

```
vibe/
├── packages/
│   ├── decision-core/          # Pure domain contracts (Types, Ports, Enums)
│   ├── core/                   # Deterministic compiler, graph, diff & guard engines
│   ├── decision-providers/
│   │   ├── rules/              # Offline deterministic rule evaluator
│   │   └── llm/                # Cloud Groq LPU inference adapter
│   ├── policy-engine/          # Confidence calculus & fallback chain orchestrator
│   ├── storage/                # Node 22 native SQLite & atomic JSON adapters
│   ├── cli/                    # Commander CLI, preprocessor, and Git hooks
│   └── vscode-extension/       # Reactive VS Code / Cursor IDE client
```

---

## 5.3 Detailed Walkthrough: `packages/core/src/` (The Deterministic Engine)

This is the beating heart of VIBE. It contains **zero AI** and **zero network calls**. Everything here is deterministic static analysis, graph theory, and compiler math.

### 1. `scanner.ts` (The Syntax Tree Inspector)
- **Role**: Recursive AST traversal using the TypeScript Compiler API (`typescript`).
- **How it works**: Reads source file contents and invokes `ts.createSourceFile(path, content, ts.ScriptTarget.Latest, false)`. It uses `ts.forEachChild` to inspect syntax nodes.
- **Why it's separate from `graph.ts`**: `scanner.ts` is purely concerned with syntax extraction (identifying `import { X } from './Y'`, `class A implements B`, `export function Z`). It does not build graphs or resolve relative paths; it outputs raw AST symbol descriptors.

### 2. `graph.ts` (The Dependency Graph & Cycle Detector)
- **Role**: Manages the Directed Acyclic Graph (DAG) of the codebase.
- **How it works**: Takes the raw symbols from `scanner.ts`, resolves relative filesystem import paths (`./utils` $\rightarrow$ `src/utils/index.ts`), creates `GraphNode` and `GraphEdge` entities, and detects circular dependencies using a formal **DFS 3-Coloring (White/Gray/Black)** traversal.
- **Key DSA**: Adjacency list representation, cycle path extraction, in-degree and out-degree centrality calculation.

### 3. `impact.ts` (The BFS Blast Radius Calculator)
- **Role**: Calculates what will break downstream if a specific set of files is modified.
- **How it works**: Takes the dependency graph from `graph.ts` and inverts the directed edges to create a **Reverse Adjacency List**. It then executes a Breadth-First Search (BFS) starting from the changed files to find all transitive dependents up to depth $N$.
- **Key Equation**: Computes the Multiplicative Risk Score:
  $$\text{Risk} = \min(100, (\Delta_{\text{add}} + 2 \cdot \Delta_{\text{del}}) \times 1.5 + (N_{\text{files}} \times 5) + (N_{\text{deps}} \times 10))$$

### 4. `guard.ts` (The Secret & Entropy Scanner)
- **Role**: Pre-commit security gatekeeper that blocks leaked credentials.
- **How it works**: Inspects staged git hunks. Runs a dual-layer check:
  1. Regex signatures for known tokens (AWS `AKIA...`, GitHub `ghp_...`, Groq `gsk_...`, Slack webhooks).
  2. Shannon entropy calculation over sliding character windows ($H \ge 4.5$) with character set filtering to avoid false positives on long variable names.

### 5. `git.ts` (The Git Plumbing Wrapper)
- **Role**: Interfaces with the operating system's native `git` binary via `simple-git`.
- **How it works**: Runs `git diff --staged`, extracts added/deleted line counts, parses git hunks, and maps diff ranges to physical file paths.

### 6. `decisions.ts` & `requirements.ts` & `constraints.ts` & `tasks.ts`
- **Role**: CRUD and validation operations for the project's governance entities.
- **How it works**: Enforces schema rules (e.g. ADRs must have `title`, `context`, `decision`, `status`; constraints must have valid glob patterns and severities).

### 7. `doctor.ts` (The Comprehensive Diagnostic Engine)
- **Role**: All-in-one health auditor (`vibe doctor`).
- **How it works**: Combines the graph engine, constraint engine, multi-framework test runner detectors (`pytest`, `Jest`, `Vitest`, `JUnit`, `Go`, `Cypress`, `Playwright`), and evidence-based requirement verifier (`verifyRequirement`).

### 8. `ignore.ts` (The Unified Ignore Engine)
- **Role**: Merges `.gitignore`, `.vibeignore`, and default production ignore rules.
- **How it works**: Evaluates file paths, normalizes Windows backslashes (`\`) to forward slashes (`/`), and categorizes every file into `source`, `test`, `config`, `dependency`, `generated`, and `ignored`, preventing untracked dependencies (`.venv`, `node_modules`) from polluting git diffs.

### 9. `sarif.ts` (OASIS SARIF v2.1.0 Generator)
- **Role**: Converts Guard and Doctor diagnostic findings into standard SARIF v2.1.0 logs for native GitHub Security / CodeQL tab integration.

### 10. `trace.ts` & `explain.ts` (Symbol Tracing & Explainability Engine)
- **Role**: Multi-pattern symbol tracing and file explainability.
- **How it works**: Traces dotted FQNs (`app.core.deps.get_current_user`), HTTP routes (`GET /buyers`), classes, callers, and verifying tests. Normalizes relative and Windows absolute paths.

### 11. `architecture.ts` (Declared Architecture & Drift Engine)
- **Role**: Records authorized frameworks and persistence layers, supporting multi-word names like `Voyage AI`. Calculates architecture drift against actual AST imports.

### 12. `store.ts` (Atomic State Management & Schema Migrations)
- **Role**: The high-reliability state store.
- **How it works**: Performs atomic `.tmp` writes with `fsync` and atomic rename, acquires `.vibe/.lock` to prevent process collisions, and automates schema migrations with timestamped `.bak` files.

### 13. `context.ts` (The AI Context Packager)
- **Role**: Compresses repository state into token-efficient context packs (`vibe context` $\to$ `AGENTS.md`) designed for external AI coding tools (Claude, Cursor, ChatGPT).

---

## 5.4 Detailed Walkthrough: `packages/decision-core/src/` (The Port)

This package contains **zero external runtime dependencies**. It defines the universal domain interfaces:
- `types.ts`: Defines `DecisionRequest`, `DecisionResult`, `Evidence`, `DecisionProvider`, `ADR`, `Requirement`, `Constraint`, and `Task`.
- `index.ts`: Public export barrel.

**Why this matters**: Because this package is pure TypeScript, it can be imported anywhere—by backend Node processes, frontend Webviews, or browser environments—without pulling in heavy Node.js built-ins like `fs` or `child_process`.

---

## 5.5 Detailed Walkthrough: `packages/decision-providers/` (The Adapters)

### `rules/src/rules-provider.ts` (The Offline Deterministic Engine)
- **Latency**: $< 1.5\text{ ms}$.
- **Network**: Zero packets transmitted.
- **Logic**: Evaluates incoming `DecisionRequest` context against Boolean truth tables, regex patterns, and active constraint targets. If a rule forbids importing `pg` inside `src/components/**`, it deterministically outputs `verdict: "BLOCK"`.

### `llm/src/llm-provider.ts` (The Cloud Groq LPU Adapter)
- **Latency**: ~200ms - 380ms.
- **Model**: `openai/gpt-oss-120b` or `llama-3.3-70b-versatile` via Groq Cloud.
- **Logic**: Formats context into structured system prompts, enforces `response_format: { type: "json_object" }`, locks `temperature: 0.1`, and parses the JSON output into a validated `DecisionResult`.

---

## 5.6 Detailed Walkthrough: `packages/policy-engine/src/` (The Brain)

- `confidence.ts`: Implements the mathematical formula for Multiplicative Confidence Calculus:
  $$\text{Conf}_{\text{final}} = \text{Conf}_{\text{raw}} \times \left( \sum w_i \cdot Q(E_i) \right)$$
- `fallback-chain.ts`: The circuit-breaker orchestrator. Tries Groq first; if it times out, hits a 429, or returns confidence $< 0.85$, it gracefully falls back to the deterministic rule provider.
- `policy.ts`: The Policy Resolution Matrix mapping confidence scores and violation severities to final verdicts: `ALLOW`, `WARN`, `REVIEW`, `BLOCK`.
- `store.ts`: Audit logger tracking evaluation latencies, token counts, and verdicts.

---

## 5.7 Detailed Walkthrough: `packages/storage/src/` (The Persistence Layer)

- `interfaces/storage-adapter.ts`: Defines the uniform async `StorageAdapter` contract (`getState`, `saveState`, `logDecision`, `getDecisions`).
- `sqlite-adapter.ts`: Production SQLite adapter using Node 22 native `node:sqlite` (`DatabaseSync`), configured with Write-Ahead Logging (`WAL`) and B-tree indexes.
- `json-adapter.ts`: Fallback storage engine writing to temporary files and executing atomic POSIX renames (`fs.rename`).
- `factory.ts`: Automatic adapter factory detecting Node.js runtime version and user configuration.
- `migrator.ts`: Transactional bidirectional data migrator converting between JSON and SQLite.

---

## 5.8 Detailed Walkthrough: `packages/cli/src/` (The Developer Interface)

- `index.ts`: Entrypoint script. Executes the **Natural Language Argument Preprocessor** (re-mapping shorthand aliases like `vibe req add` $\rightarrow$ `vibe requirement add`), Levenshtein typo-correction suggestions, and registers all 29 Commander commands across 10 functional domains.
- `commands/*.ts`: 29 modular command implementations (`init.ts`, `scan.ts`, `status.ts`, `onboard.ts`, `bootstrap.ts`, `config.ts`, `architect.ts`, `requirement.ts`, `decision.ts`, `decisions.ts`, `override.ts`, `constraint.ts`, `task.ts`, `guard.ts`, `doctor.ts`, `explain.ts`, `why.ts`, `trace.ts`, `impact.ts`, `context.ts`, `checkpoint.ts`, `test-providers.ts`, `migrate-storage.ts`, `hooks.ts`).
- `hooks.ts`: Installs and uninstalls the executable Git pre-commit hook script into `.git/hooks/pre-commit`.

---

## 5.9 Detailed Walkthrough: `packages/vscode-extension/src/` (The IDE Client)

- `extension.ts`: Registers the extension lifecycle, sets up 4 `TreeDataProvider` classes (Requirements, ADRs, Constraints, Tasks), registers the OS-level `FileSystemWatcher` on `**/.vibe/*.{json,db}`, queries the runtime CLI version dynamically (`${cliCmd} --version`), prints compatibility status, and registers all 23 VS Code Command Palette actions with automated execution validation.

---

## 5.10 How to Walk an Interviewer Through the Codebase
When an interviewer asks: *"If you were giving a new senior engineer a tour of this repository, where would you start and how would you explain the folder structure?"*

> *"I would start by showing them the monorepo dependency hierarchy.
>
> I'd open `@vibe/decision-core` and explain that this package contains zero dependencies—it defines our universal domain contracts like `DecisionRequest` and `DecisionResult`.
>
> Next, I'd show them `@vibe/core`, which is our deterministic static analysis engine. I'd walk them through `scanner.ts`, which uses the official TypeScript Compiler API to parse ASTs, and `graph.ts`, which builds the dependency DAG and runs DFS 3-coloring for cycle detection.
>
> Then, I'd take them to `@vibe/policy-engine` and explain our hybrid reasoning model: how the Fallback Chain coordinates our cloud Groq LPU adapter with our offline deterministic rule engine using confidence calculus.
>
> Next, in `@vibe/storage`, I'd show our Node 22 native SQLite adapter with Write-Ahead Logging, and our atomic POSIX-rename JSON adapter.
>
> Finally, I'd show how `@vibe/cli` and `@vibe/vscode-extension` consume these core modules through non-blocking interfaces and pre-commit hooks. Every package has a single responsibility, and circular dependencies between packages are forbidden by architecture."*

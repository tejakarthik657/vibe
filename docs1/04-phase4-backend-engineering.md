# Phase 4: Backend Engineering
**Document Ref**: `docs1/04-phase4-backend-engineering.md`  
**System**: VIBE (Vibe Intent & Boundary Engine)  
**Phase**: Phase 4 of 10 — Application Processing, Business Logic & CLI Engine

---

## Executive Overview: The Intent of Phase 4
Phase 4 covers the processing engine: the controllers, services, repositories, business logic, CLI argument normalization, Git diff plumbing, and inter-process communication.

---

## 18. Backend Architecture
*Controllers, services, repositories, middleware, dependency injection.*

### 18.1 The Layered Architecture of `@vibe/cli` & `@vibe/core`
```
[CLI Command Handler / Controller Layer]  (packages/cli/src/commands/*.ts)
                    │
                    ▼
[Service & Business Logic Layer]           (packages/core/src/*.ts)
  - ScannerService  (AST Traversal)
  - GraphService    (DAG & Cycles)
  - ImpactService   (BFS Blast Radius)
  - GuardService    (Secret Detection)
                    │
                    ▼
[Policy & Reasoning Layer]                 (packages/policy-engine/src/*.ts)
  - FallbackChain   (Provider Orchestrator)
  - ConfidenceCalc  (Bayesian Weighting)
                    │
                    ▼
[Data Access / Repository Layer]           (packages/storage/src/*.ts)
  - StorageAdapter Interface (The Port)
  - SQLiteStorageAdapter (Node 22 DatabaseSync)
  - JSONStorageAdapter   (Atomic POSIX Rename)
```

---

## 19. Business Logic Engineering
*Domain rules, workflows, calculations, business validations.*

### 19.1 Graph Theory & Cycle Detection Logic (`graph.ts`)
The dependency graph is represented as an adjacency list. Circular dependency detection is governed by the **DFS 3-Coloring Algorithm**:
- **WHITE (0)**: Unvisited.
- **GRAY (1)**: Active on the recursion stack.
- **BLACK (2)**: Fully visited.
When DFS encounters a node colored **GRAY**, a directed cycle back-edge is mathematically proven: $A \rightarrow \dots \rightarrow B \rightarrow A$.

### 19.2 Multiplicative Risk Scoring Formula (`impact.ts`)
$$\text{Risk Score} = \min\left(100, (\Delta_{\text{add}} + 2 \cdot \Delta_{\text{del}}) \times 1.5 + (N_{\text{files}} \times 5) + (N_{\text{deps}} \times 10)\right)$$
Deletions are weighted $2\times$ because removing code breaks downstream caller contracts.

---

## 20. API Engineering
*REST, RPC, CLI endpoint design, execution parameters, status codes.*

### 20.1 CLI as an API: POSIX Exit Code Contracts
- **Exit Code `0` (`ALLOW`)**: Operation successful. Zero critical violations, zero secrets leaked, risk $< 0.40$. Git pre-commit proceeds.
- **Exit Code `1` (`REVIEW`)**: Review recommended. Moderate risk ($\ge 0.40, < 0.80$) or dependency changes. Pre-commit prompts for confirmation.
- **Exit Code `2` (`BLOCK`)**: Policy or security violation. Secret leaked, blast radius $\ge 0.80$, or constraint broken. Git pre-commit and CI pipelines **abort immediately**.
- **Exit Code `3` (`ERROR`)**: Fatal system error. Missing Node runtime, corrupt metadata, or unhandled I/O exception.

### 20.1.1 OASIS SARIF v2.1.0 Standard Log Output
For automated CI/CD security scanning, passing `-f sarif` emits standard OASIS SARIF v2.1.0 logs directly into GitHub Security, GitLab SAST, or Azure DevOps.

### 20.2 Natural Language Argument Preprocessor
Before arguments reach Commander.js, `packages/cli/src/index.ts` runs an in-memory token normalization pass:
- Maps `vibe req add` $\rightarrow$ `vibe requirement add`.
- Maps `vibe adr add` $\rightarrow$ `vibe decision add`.
- Maps `vibe con add` $\rightarrow$ `vibe constraint add`.

---

## 21. API Contract Design
*Schemas, request/response structures, versioning, documentation.*

### 21.1 Universal Domain Schemas (`@vibe/decision-core`)
- `DecisionRequest`: Encapsulates proposal action, target file, active ADRs, constraints, and AST graph summaries.
- `DecisionResult`: Returns standardized verdicts (`ALLOW`, `WARN`, `REVIEW`, `BLOCK`), numerical confidence ($0.0 - 1.0$), reasoning steps, and violation objects.

---

## 22. Authentication & Authorization
*Key management, credential isolation, permissions, commit gates.*

### 22.1 Local Vault Isolation (`.vibe/config.json`)
- API keys (e.g. `groq_api_key`) are stored strictly on the local machine in `.vibe/config.json`.
- `.vibe/config.json` is automatically verified to be listed in `.gitignore` on every execution.
- Key values are masked in terminal displays: `gsk_hfG...cg7J`.

### 22.2 Policy Gatekeeper Authorization
Authorization to commit code is determined by the Policy Resolution Matrix:
- Commits containing `CRITICAL` or `HIGH` violations are rejected by the pre-commit gatekeeper.

---

## 23. Integration Engineering
*Third-party APIs, webhooks, external services, Git plumbing.*

### 23.1 Simple-Git Integration
VIBE interfaces directly with system Git plumbing via `simple-git`:
```typescript
const diff = await git.diff(['--staged']);
const summary = await git.diffSummary(['--staged']);
```
Extracts staged diff hunks, added lines, and deleted lines in $< 20\text{ ms}$.

### 23.2 Groq Cloud LPU Integration
Queries Groq's high-speed inference endpoints using `groq-sdk` with `temperature: 0.1` and `response_format: { type: "json_object" }`.

---

## 24. Asynchronous Processing
*Background jobs, queues, workers, scheduled tasks, event processing.*

### 24.1 Asynchronous File I/O
Source files are read in parallel using Node.js `Promise.allSettled` and asynchronous `fs.promises.readFile`.

### 24.2 In-Memory BFS Traversal Queues
Blast radius reachability uses an in-memory First-In-First-Out (FIFO) queue with an explicit `Set<string>` visited guard to prevent infinite loops on cyclical graphs.

---

## 25. Real-Time Engineering
*Subprocess JSON streaming, notifications, live updates.*

### 25.1 Clean Stream Separation (`stdout` vs `stderr`)
When invoked with `--json`, VIBE streams 100% pure JSON on `stdout` with zero ANSI escape codes, redirecting all human logs to `stderr`, enabling seamless real-time deserialization by the VS Code extension.

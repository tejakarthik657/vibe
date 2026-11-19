# 23. Project Ownership & Staff-Level Technical Interview Defense
**Document**: `docs/23-interview-preparation.md`  
**System**: VIBE (Vibe Intent & Boundary Engine)  
**Perspective**: The Lead Engineer's Defense Bible, CTO Questions & Ownership Proof

---

## 23.1 The Three Pitches: Mastering Every Conversation

### The 30-Second Elevator Pitch (For Founders, Investors & Casual Intros)
> "I built VIBE, an autonomous compiler-level architectural governance platform. As engineering teams adopt AI coding tools like Cursor and Copilot, codebases suffer from silent architectural drift, broken boundaries, and leaked credentials. 
> 
> VIBE runs locally in the terminal and VS Code, parses the TypeScript AST into an in-memory dependency graph, calculates change blast radius via reverse BFS reachability, scans staged diffs for high-entropy secrets, and enforces Architectural Decision Records using a hybrid policy engine combining Groq LPUs with offline deterministic rules. 
> 
> It catches violations at the git pre-commit hook in under 120 milliseconds before any code leaves the laptop."

---

### The 60-Second Technical Pitch (For Senior Software Engineers)
> "VIBE solves the architectural drift problem in agentic software engineering. Modern AI generators produce code without awareness of historical ADRs or system invariants. 
> 
> To solve this, I designed a monorepo system across 7 packages using Hexagonal Architecture. At the base layer, VIBE uses the official TypeScript Compiler API to extract imports, symbols, and interfaces into an in-memory Directed Acyclic Graph, detecting circular dependencies via DFS 3-coloring in $\mathcal{O}(V + E)$ time. When a developer stages changes, VIBE extracts the git diff, calculates Shannon entropy to intercept leaked secrets, and computes the downstream blast radius using BFS reverse reachability.
> 
> Decisions are evaluated through a Ports and Adapters architecture: our Policy Engine uses Bayesian confidence calculus to score proposals, querying Groq LPUs at temperature 0.1 for structured JSON reasoning, with instant fallback to an offline deterministic rule engine. 
> 
> For persistence, I eliminated native build failures by leveraging Node 22's native `node:sqlite` engine with WAL mode. The entire system is published on npm as `vibe-dev` and the Visual Studio Marketplace as `devframes.vibe-vscode-extension`."

---

### The 3-Minute Masterclass (For CTOs, Staff Engineers & System Design Rounds)
> "In senior engineering interviews, we talk a lot about scaling systems, but we rarely talk about governing code evolution. When developers or autonomous agents generate code, they optimize locally within a file. They don't know that modifying a shared utility breaks 40 downstream modules, or that importing a database driver into a UI component violates our architectural boundary.
> 
> I built VIBE to serve as an in-process, compiler-level governor. The architecture is cleanly divided into deterministic analysis, contract abstractions, hybrid inference, and non-blocking interfaces.
> 
> In the deterministic core (`@vibe/core`), I use the TypeScript Compiler API to perform recursive descent over source files, constructing an explicit DAG of files, components, and symbols. I implemented a 3-color DFS algorithm to catch circular dependencies, which cause memory leaks and bundling failures. For git integration, VIBE intercepts staged diffs, tokenizes hunks, calculates a multi-variable risk score, and computes the transitive blast radius by inverting graph edges and executing a reverse BFS reachability search.
> 
> For reasoning, I avoided the trap of relying purely on LLMs. Probabilistic models hallucinate. Instead, I designed a Policy Engine based on Bayesian confidence calculus. It feeds structured, compiler-proven evidence to a Groq LPU running Llama 3 models at temperature 0.1 with JSON schema enforcement. If confidence drops below 0.85, or if network timeouts occur, a circuit breaker trips and falls back to our sub-millisecond offline deterministic rule engine.
> 
> On the storage side, a common failure mode with developer CLI tools is that packages like `better-sqlite3` require native C++ compilation via `node-gyp`, which routinely fails on developer machines. I engineered VIBE to use Node 22's native `node:sqlite` (`DatabaseSync`), achieving raw C-speed SQLite execution with Write-Ahead Logging and zero installation dependencies, paired with an atomic POSIX-rename JSON adapter as a fallback.
> 
> Finally, I surfaced this through two interfaces: a Commander-based CLI with a natural language argument preprocessor, and a reactive VS Code extension using native OS `FileSystemWatcher` events to update 4 TreeView providers without polling. It is published and running in production today."

---

## 23.2 Individual Contributions: What I Built From Scratch
When an interviewer asks: *"What parts of this did you personally build versus using existing libraries?"*

```
+------------------------------------+---------------------------------------------------+
| Component                          | Implementation Reality & Ownership Proof          |
+------------------------------------+---------------------------------------------------+
| Monorepo Architecture              | Architected all 7 decoupled packages from scratch |
+------------------------------------+---------------------------------------------------+
| AST Code Intelligence Engine       | Built custom scanner using TypeScript Compiler API|
|                                    | (ts.createSourceFile, ts.forEachChild traversal)  |
+------------------------------------+---------------------------------------------------+
| Graph DAG & Cycle Detection        | Authored from scratch: Adjacency list DAG and     |
|                                    | classical DFS 3-Coloring (White/Gray/Black)       |
+------------------------------------+---------------------------------------------------+
| Blast Radius & Risk Calculus       | Authored from scratch: Graph edge inversion and   |
|                                    | BFS reverse reachability with multiplicative math |
+------------------------------------+---------------------------------------------------+
| Shannon Entropy Secret Guard       | Implemented mathematical entropy formula and      |
|                                    | character-set normalization filters from scratch  |
+------------------------------------+---------------------------------------------------+
| Persistence Subsystem              | Authored Node 22 native node:sqlite adapter with  |
|                                    | WAL mode, physical DDL, and atomic JSON fallback  |
+------------------------------------+---------------------------------------------------+
| Confidence Calculus Engine         | Authored Bayesian multiplicative weighting and    |
|                                    | three-state circuit breaker fallback chain        |
+------------------------------------+---------------------------------------------------+
| VS Code Extension                  | Authored 4 TreeDataProviders, kernel event        |
|                                    | watcher integration, and child process IPC        |
+------------------------------------+---------------------------------------------------+
| Packaging & Distribution           | Published vibe-dev on npm & extension on VS Code  |
|                                    | Marketplace                                       |
+------------------------------------+---------------------------------------------------+
```

---

## 23.3 The 10 Hardest CTO Technical Interview Questions Answered

### Q1: Why not just use Claude Code or Cursor directly? Why do we need VIBE?
> **Answer**: "Claude Code and Cursor are code *generators*, not code *governors*. They optimize for localized token completion within a sliding context window. They have no persistent memory of organizational ADRs, no awareness of downstream dependency blast radius, and no enforcement mechanism to prevent architectural drift.
> 
> VIBE operates as an orthogonal control plane. It is compiler-backed and repository-local. It validates whether the code produced by Claude, Cursor, or an engineer complies with codified ADRs, dependency constraints, and security standards before it is committed."

### Q2: How does VIBE prevent LLM hallucinations from poisoning architectural decisions?
> **Answer**: "Through a four-layer defense-in-depth architecture:
> 1. **Deterministic Grounding**: We never ask the LLM to inspect files directly. Our AST engine and graph scanner parse the code deterministically and pass structured, verified evidence to the LLM.
> 2. **Low-Temperature Strict JSON**: We query the Groq LLM at temperature 0.1 with mandatory JSON schema enforcement.
> 3. **Confidence Calculus**: We weight the raw LLM confidence against verified compiler evidence. If confidence falls below 0.85, the verdict is downgraded to `REVIEW` or falls back to our deterministic rule engine.
> 4. **Deterministic Fallback**: If the LLM produces invalid JSON, encounters a network timeout, or hits rate limits, the fallback chain automatically executes offline Boolean rule evaluations with zero network dependency."

### Q3: Why did you choose Node 22 native `node:sqlite` over `better-sqlite3` or Prisma?
> **Answer**: "`better-sqlite3` is a C++ native addon requiring `node-gyp`, Python, and a C++ compiler. When distributing a globally installed CLI (`npm install -g vibe-dev`), native compilation fails on roughly 15-20% of developer machines due to missing build tools or platform discrepancies.
> 
> Prisma introduces significant engine binary bloat (~40MB) and generation overhead that is unacceptable for a lightweight CLI.
> 
> Node 22's built-in `node:sqlite` (`DatabaseSync`) delivers raw C-speed SQLite execution directly within the V8 runtime with zero native compilation steps and zero installation dependencies."

### Q4: What happens if the dependency graph contains circular dependencies?
> **Answer**: "In `graph.ts`, we run a 3-color Depth-First Search (White/Gray/Black) cycle detection algorithm. If a back-edge is encountered (visiting a Gray node currently on the recursion stack), a directed cycle is proven. VIBE flags the cycle, logs the exact import chain as an architectural violation, and breaks the cycle during topological sorting so subsequent operations do not enter an infinite loop."

### Q5: How do you achieve sub-120ms pre-commit gate latency?
> **Answer**: "Three architectural optimizations:
> 1. **AST Target Parsing**: We invoke `ts.createSourceFile` with `setParentNodes = false` during shallow scans.
> 2. **Git Staged Scoping**: For pre-commit hooks and `vibe guard`, we don't scan the whole repository. We scope the AST scan strictly to files in the staged git diff, running in under 50 milliseconds.
> 3. **SQLite WAL Mode**: SQLite operates with `PRAGMA journal_mode = WAL;`, allowing concurrent non-blocking reads from IDE instances while the scanner writes updates."

### Q6: Why decouple Decision Core from the Core AST engine?
> **Answer**: "This follows the Hexagonal Architecture (Ports and Adapters) pattern. `@vibe/decision-core` defines pure domain entities with zero external dependencies. This ensures that:
> - Storage engines, LLM providers, and CLI frameworks can be swapped without touching domain logic.
> - The core contracts can be shared with web frontends or browser runtimes without pulling in Node.js-specific modules like `fs`, `child_process`, or `node:sqlite`."

### Q7: How does VIBE protect sensitive data and prevent prompt injection?
> **Answer**: "1. **Zero Secret Persistence**: API keys are stored exclusively in `.vibe/config.json`, which is automatically added to `.gitignore`.
> 2. **Key Masking**: Any command displaying configuration (`vibe config show`) masks keys with a SHA-256 preview.
> 3. **Structured Prompt Sandboxing**: Code content sent to LLMs is passed inside structured JSON data properties rather than raw prompt strings, mitigating indirect prompt injection attacks."

### Q8: How does the Git Pre-Commit Hook balance strict security with developer velocity?
> **Answer**: "A pre-commit hook that takes 10 seconds will be bypassed with `--no-verify`. VIBE's pre-commit hook runs only `vibe guard --staged` and `vibe impact --staged`. Because it operates strictly on staged files and uses in-memory BFS reverse reachability, the entire verification finishes in under 110 milliseconds, providing security without disrupting developer flow."

### Q9: How do you handle schema versioning and storage format migrations across upgrades?
> **Answer**: "In `packages/storage/src/migrator.ts`, we implement a transactional migration engine. When migrating between JSON and SQLite, the migrator:
> 1. Acquires a lock on the destination store.
> 2. Reads the complete state from the source store.
> 3. Validates each entity against TypeScript runtime schemas.
> 4. Writes all records inside an atomic SQLite transaction or POSIX temporary file swap.
> 5. If any validation fails, the transaction rolls back cleanly, leaving the original database untouched."

### Q10: How does the VS Code extension maintain 60 FPS UI performance while analyzing massive projects?
> **Answer**: "1. **Decoupled Process Model**: The extension host never executes heavy graph computations. It executes CLI binaries via `child_process.execFile` asynchronously in a separate OS process.
> 2. **OS-Level File Watchers**: We do not poll the filesystem with timers. We register `vscode.workspace.createFileSystemWatcher`, which uses native OS notifications (ReadDirectoryChangesW on Windows, FSEvents on macOS, inotify on Linux) to refresh UI tree views only when `.vibe` data actually changes."

---

## 23.4 The 12-Point Project Readiness Checklist

- [x] **1. Architecture**: I can draw the complete 7-package topology on a whiteboard from memory and explain every boundary.
- [x] **2. Implementation**: I can explain the TypeScript Compiler API AST traversal and BFS blast radius calculation from scratch.
- [x] **3. Backend**: I can trace a command from the CLI entrypoint, through the preprocessor, controller, service, storage, and exit code.
- [x] **4. Database**: I can explain the physical schema, WAL mode concurrency, B-tree indexes, and transactional migrations.
- [x] **5. Security**: I can explain the Shannon entropy formula, false-positive filtering, and prompt injection defense.
- [x] **6. Performance**: I can break down where every millisecond of our 110ms pre-commit gate latency is spent.
- [x] **7. Testing**: I can demonstrate deterministic unit tests for cycle detection, entropy, and fallbacks.
- [x] **8. Deployment**: I can explain npm packaging (`vibe-dev`) and VS Code Marketplace VSIX publishing.
- [x] **9. Debugging**: I can explain real production incidents, such as NTFS file locks and SQLite busy contention, and how I fixed them.
- [x] **10. Trade-offs**: I can defend Node 22 SQLite vs `better-sqlite3` and static AST analysis vs regex.
- [x] **11. Ownership**: I understand the main intention and purpose of every single file across all 7 packages.
- [x] **12. System Design**: I can explain how to scale VIBE to 500,000 files using worker threads and recursive SQL CTEs.

# VIBE Backend Engineering Master Curriculum (`backend/`)

Welcome to the **VIBE Backend Engineering Curriculum**. This directory is dedicated to the software engineers, backend architects, and system designers who want to master every internal subsystem of VIBE's core execution runtime.

VIBE's backend is not an ordinary web server: it is a high-performance, local-first static analysis compiler, graph evaluation engine, and embedded database system running on Node.js 22 LTS.

---

## Backend Modules Breakdown

| Module | Title | Key Engineering Concepts Covered | Direct Link |
| :---: | :--- | :--- | :--- |
| **01** | **Backend Framework & Runtime Architecture** | Node.js 22 LTS, V8 JIT compiler pipeline (Ignition, Sparkplug, Maglev, TurboFan), libuv event loop, CLI-as-an-API architecture, worker thread pools, memory model and Gen-0 scavenge GC tuning. | [01-backend-framework-and-runtime.md](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/backend/01-backend-framework-and-runtime.md) |
| **02** | **Architecture & Design Patterns** | Clean architecture, layered monolith, dependency inversion, Visitor pattern for AST traversal, Strategy pattern for multi-paradigm rules, Repository pattern for data persistence, Observer pattern for event streaming. | [02-architecture-and-design-patterns.md](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/backend/02-architecture-and-design-patterns.md) |
| **03** | **AST & Compiler Engine Internals** | Compiler theory, lexical scanning, token streams, CST vs. AST trade-offs, depth-first tree traversal, symbol tables, lexical scope resolution, content-addressed AST caching. | [03-ast-compiler-engine.md](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/backend/03-ast-compiler-engine.md) |
| **04** | **Graph Algorithms & Data Structures** | Codebase as a directed graph $G = (V, E)$, in-memory adjacency list representation, DFS 3-coloring cycle detection ($\mathcal{O}(V + E)$), BFS blast radius analysis, Tarjan's SCC, topological sorting. | [04-graph-algorithms-and-dsa.md](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/backend/04-graph-algorithms-and-dsa.md) |
| **05** | **Native SQLite & Storage Architecture** | Embedded vs. client-server storage, SQLite WAL mode, readers-never-block-writers, prepared statement caching, batch transaction chunking, B-Tree index optimization, lock contention handling via `busy_timeout`, atomic POSIX writes (`fsync`), `.vibe/.lock` process concurrency locking, and automatic schema migrations. | [05-native-sqlite-and-storage.md](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/backend/05-native-sqlite-and-storage.md) |
| **06** | **Policy Engine & AI Inference Architecture** | Deterministic AST rules vs. stochastic LLMs, Graph-Augmented Generation (GAG) vs. vector RAG, AST context distillation (92% token reduction), prompt result caching, circuit breakers, JSON schema validation, and strict policy invariants ($\text{Action} = \text{BLOCK}$ if $\max(E_w) \ge 0.80$). | [06-policy-engine-and-ai-inference.md](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/backend/06-policy-engine-and-ai-inference.md) |
| **07** | **API & IPC Contracts Architecture** | Multi-channel communication, JSON-RPC 2.0 LSP daemon protocol, standard 4-state POSIX exit codes (0 = ALLOW, 1 = REVIEW, 2 = BLOCK, 3 = ERROR), OASIS SARIF v2.1.0 CI logs, structured error envelopes, newline-delimited JSON (ndjson) event streaming. | [07-api-and-ipc-contracts.md](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/backend/07-api-and-ipc-contracts.md) |
| **08** | **Security & Entropy Engine Internals** | Shannon information entropy mathematics, sliding window secret scanning, regex vs. entropy trade-offs, path traversal and symlink evasion defenses, AST taint analysis, automatic secret redaction (`redactSecrets`), and the unified `IgnoreEngine`. | [08-security-and-entropy-engine.md](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/backend/08-security-and-entropy-engine.md) |

---

## How to Prepare for CTO & Senior Backend Interviews

1. **System Design Questions**:
   - *How do you build a sub-150ms static analysis engine on multi-gigabyte codebases?* Focus on **Module 01** (Worker Threads & zero-copy transfer) and **Module 05** (Batch transactions in SQLite WAL).
2. **Data Structures & Algorithms Questions**:
   - *How do you detect circular dependencies in an enterprise repository?* Present the **DFS 3-Coloring algorithm** from **Module 04** with time complexity $\mathcal{O}(V + E)$.
3. **AI Architecture Questions**:
   - *Why choose Graph-Augmented Generation over standard Vector Embeddings for code?* Present the AST signature distillation and dependency graph traversal from **Module 06**.
4. **AppSec Questions**:
   - *How do you scan for API keys without generating thousands of false positives?* Present the **Shannon Entropy sliding window scanner** from **Module 08**.

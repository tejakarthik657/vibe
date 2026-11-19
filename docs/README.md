# VIBE Engineering Documentation Hub
### The Master Engineering Specification, Architectural Blueprint & Technical Defense Manual

> *"If AI is going to write the code, we must have an autonomous, compiler-level governor that protects the engineering."*

Welcome to the complete, production-grade technical engineering documentation for **VIBE (Vibe Intent & Boundary Engine)**.

This is not an ordinary set of machine-generated bullet points. It is a **human-centered engineering masterclass** designed to give you 100% technical fluency and authentic ownership over every architectural layer, database schema, compiler algorithm, and operational decision across the system.

---

## How to Read This Documentation

Whether you are preparing for a Staff-level technical interview, pitching to a startup CTO, or reverse-engineering how to build compiler-level developer tools from scratch, read these documents in logical clusters:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THE 6 ENGINEERING PILLARS                       │
├──────────────────────────┬─────────────────────────────────────────────┤
│ Pillar I: The Vision     │ 01. Overview • 02. Requirements • 19. Product│
├──────────────────────────┼─────────────────────────────────────────────┤
│ Pillar II: Architecture  │ 03. Architecture • 04. Tech Stack • 05. Code│
│                          │ 17. Engineering Decisions (ADRs)            │
├──────────────────────────┼─────────────────────────────────────────────┤
│ Pillar III: Deep Engine  │ 06. Database • 07. Backend/AST • 08. API    │
│                          │ 09. Frontend/IDE • 18. AI & Confidence Math │
├──────────────────────────┼─────────────────────────────────────────────┤
│ Pillar IV: Resiliency    │ 10. Security • 11. Performance • 12. Systems│
│                          │ 13. Testing • 16. Reliability               │
├──────────────────────────┼─────────────────────────────────────────────┤
│ Pillar V: Operations     │ 14. DevOps • 15. Observability • 20. Workflow│
│                          │ 21. Developer Setup • 22. Challenges/RCAs   │
├──────────────────────────┼─────────────────────────────────────────────┤
│ Pillar VI: Mastery       │ 23. Interview Defense • 24. Learning Log    │
└──────────────────────────┴─────────────────────────────────────────────┘
```

---

## The 24 Dedicated Technical Documents

### Pillar I: Product Vision & Requirements
- **[`01-project-overview.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/01-project-overview.md)**  
  *The Genesis, the "goldfish memory" problem of AI coding assistants, the Airport Security Gate mental model, real-world use cases, and how to pitch VIBE in 30 seconds.*
- **[`02-requirements-engineering.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/02-requirements-engineering.md)**  
  *Functional (FR-01 to FR-10) and non-functional requirements (the 120ms pre-commit budget, zero-network autonomy), user stories, edge cases (detached HEAD), and failure scenarios.*
- **[`19-product-engineering.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/19-product-engineering.md)**  
  *Developer Experience (DX) principles, human-centered terminal remediation messages, feature prioritization matrix, and future roadmap.*

### Pillar II: Architecture, Topology & Technology Decisions
- **[`03-system-architecture.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/03-system-architecture.md)**  
  *The Ports and Adapters (Hexagonal) mental model, wall-socket analogy, 7-package monorepo topology, sequence diagrams, and non-negotiable architectural invariants.*
- **[`04-technology-stack.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/04-technology-stack.md)**  
  *The battles behind every choice: why Node 22 native SQLite beat `better-sqlite3`, why the TypeScript Compiler API beat regex and Babel, why Groq LPUs beat OpenAI GPT-4, and the technology rejection matrix.*
- **[`05-codebase-organization.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/05-codebase-organization.md)**  
  *File-by-file tour of the entire codebase: exact responsibilities of `scanner.ts`, `graph.ts`, `impact.ts`, `guard.ts`, `sqlite-adapter.ts`, and CLI controllers.*
- **[`17-engineering-decisions.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/17-engineering-decisions.md)**  
  *Formal Architectural Decision Records: ADR-001 (Node 22 native SQLite), ADR-002 (TypeScript Compiler API), ADR-003 (Confidence calculus), technical debt, and refactoring plans.*

### Pillar III: Engine Internals, Algorithms & Data Models
- **[`06-database-design.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/06-database-design.md)**  
  *The "Torn Write" file corruption disaster, Node 22 native SQLite (`DatabaseSync`), Write-Ahead Logging (WAL) concurrency, relational DDL schemas, B-tree indexes, and atomic JSON temporary-file-renames.*
- **[`07-backend-engineering.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/07-backend-engineering.md)**  
  *The life of a command in V8, Natural Language Argument Preprocessor, TypeScript AST traversal (`ts.forEachChild`), DFS 3-coloring cycle detection, reverse BFS blast radius, and multiplicative risk math.*
- **[`08-api-design.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/08-api-design.md)**  
  *The CLI as an API: POSIX binary exit code contracts (`0` vs `1`), 25+ command catalog, subprocess JSON output streaming, and domain contract schemas (`DecisionRequest`, `DecisionResult`).*
- **[`09-frontend-architecture.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/09-frontend-architecture.md)**  
  *VS Code extension architecture, 4 reactive TreeDataProviders, why timer polling is an anti-pattern, OS kernel `FileSystemWatcher` events (16ms updates), and decoupled non-blocking child-process IPC.*
- **[`18-ai-engineering.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/18-ai-engineering.md)**  
  *Why naive LLM wrappers fail, low temperature (0.1) determinism, strict JSON schema output, Graph-Augmented Generation (GAG) vs Vector RAG, Bayesian confidence calculus, and Groq LPU hardware acceleration.*

### Pillar IV: Security, Performance & System Resiliency
- **[`10-security-architecture.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/10-security-architecture.md)**  
  *The 4-second secret leak nightmare, STRIDE threat modeling, Shannon entropy formula ($H \ge 4.5$), character-set normalization filters, and indirect prompt injection defense.*
- **[`11-performance-scalability.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/11-performance-scalability.md)**  
  *The 120ms pre-commit latency budget breakdown (measured at 110ms), the `setParentNodes: false` 68% memory breakthrough, and enterprise scaling to 100,000+ files via `worker_threads` and recursive SQL CTEs.*
- **[`12-distributed-systems.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/12-distributed-systems.md)**  
  *Why VIBE is an in-process modular monolith, the Three-State Circuit Breaker pattern (Closed/Open/Half-Open), exponential backoff with full randomized jitter, and strict ACID consistency.*
- **[`13-testing-strategy.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/13-testing-strategy.md)**  
  *The zero-mock philosophy, synthetic multi-node circular dependency test fixtures, synthetic secret injection suites, and CI dogfooding.*
- **[`16-reliability-engineering.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/16-reliability-engineering.md)**  
  *Three-tier graceful degradation (Cloud LLM $\rightarrow$ Offline Rules $\rightarrow$ Atomic JSON $\rightarrow$ Reconstruct), syntax error fault isolation, RPO = 0 seconds, and RTO < 3 seconds.*

### Pillar V: Operations, DevOps & Incident Post-Mortems
- **[`14-devops-deployment.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/14-devops-deployment.md)**  
  *Topological monorepo builds via TypeScript Project References (`tsc -b`), publishing `vibe-dev` to npm, publishing the VSIX to Visual Studio Marketplace, automated pre-commit hook scripts, and 74MB Alpine Docker images.*
- **[`15-production-observability.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/15-production-observability.md)**  
  *Diagnostic health checks (`vibe doctor`), forensic decision dossiers (`vibe why`), traceability matrices (`vibe trace`), and real production incident post-mortem INC-001 (SQLite lock contention resolution).*
- **[`20-engineering-workflow.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/20-engineering-workflow.md)**  
  *Trunk-based development, Conventional Commits standard, the 5-point pull request review checklist, and Semantic Versioning.*
- **[`21-developer-guide.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/21-developer-guide.md)**  
  *Zero-to-one local onboarding in 3 minutes, local CLI linking via `npm link`, debugging the VS Code extension via `F5`, and common developer troubleshooting.*
- **[`22-engineering-challenges.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/22-engineering-challenges.md)**  
  *War stories & deep root cause analyses: Windows NTFS mandatory file locks (`EPERM`), false-positive entropy in camelCase variables, cyclic BFS recursion stack overflows, and failed approaches.*

### Pillar VI: Project Ownership & Staff-Level Interview Defense
- **[`23-interview-preparation.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/23-interview-preparation.md)**  
  *The 30-second, 60-second, and 3-minute pitches; breakdown of individual contributions; features built from scratch; 10 hard CTO technical interview questions answered authoritatively; and the 12-point project readiness checklist.*
- **[`24-learning-log.md`](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/24-learning-log.md)**  
  *Core engineering competencies mastered, active knowledge gaps (dynamic import analysis, WebAssembly Tree-sitter polyglot parsing, and Z3 SMT solver formal ADR verification), and intellectual honesty.*

---
*Maintained in repository source control. Authored to transform you into an authentic, authoritative systems architect.*

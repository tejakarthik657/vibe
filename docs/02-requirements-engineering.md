# 02. Requirements Engineering: Designing Before Building
**Document**: `docs/02-requirements-engineering.md`  
**System**: VIBE (Vibe Intent & Boundary Engine)  
**Perspective**: The Architect's Blueprint & Behavioral Contracts

---

## 2.1 The Philosophy: Why Bad Requirements Cause Spaghetti Code
A junior developer jumps straight into writing code. They open VS Code, create a `test.ts` file, and start hacking away. Two days later, they realize their database driver doesn't support the concurrency they need, their file watcher blocks the UI thread, and their CLI crashes on Windows because of backslash path separators.

A senior engineer does the opposite: **they define the boundaries, contracts, and failure scenarios before writing a single function.**

When building VIBE, we didn't just ask *"What should this do?"* We asked the hard questions:
- *What happens when a developer is on an airplane with zero Wi-Fi trying to commit code?* (Answer: It must not make a single network call; all core governance must run 100% locally).
- *What happens when a developer runs `npm install -g vibe-dev` on a budget Windows machine without Visual Studio C++ build tools?* (Answer: It cannot use `better-sqlite3` or any addon requiring `node-gyp`; it must use Node 22 native `node:sqlite`).
- *How fast does a pre-commit hook have to be before developers get annoyed and bypass it with `git commit --no-verify`?* (Answer: Under 120 milliseconds. Anything above 500ms feels sluggish; anything above 2 seconds gets killed).

Let's dissect the exact requirements that shaped VIBE's architecture.

---

## 2.2 Functional Requirements (What the System Must Do)

### FR-01: Zero-Configuration Repository Bootstrapping
- **Requirement**: The system must initialize governance metadata in any Git repository via `vibe init`.
- **Why it matters**: Developers hate complex onboarding. If a tool requires editing 10 config files before it works, nobody will use it. `vibe init` creates `.vibe/`, creates the SQLite database, writes default configuration, and verifies `.gitignore` in under 50ms.

### FR-02: True AST Parsing & Dependency Graph Construction
- **Requirement**: The system must traverse TypeScript/JavaScript source files, extract imports, exports, functions, classes, and types, and construct a directed dependency graph via `vibe scan`.
- **Why it matters**: Regex parsers fail on multi-line imports, dynamic imports, comments, and re-exports. VIBE must use the official TypeScript Compiler API to extract 100% accurate syntax trees.

### FR-03: Cycle Detection via Graph Traversal
- **Requirement**: The system must detect circular dependencies (`A -> B -> C -> A`) and output the exact cyclic chain.
- **Why it matters**: Circular dependencies cause memory leaks, bundle bloat, and unpredictable initialization order bugs in Webpack, Vite, and Node.js.

### FR-04: Transitive Blast Radius Calculation
- **Requirement**: The system must calculate all downstream dependent files affected by staged git changes via reverse BFS reachability (`vibe impact`).
- **Why it matters**: If you change `User.ts`, you need to know immediately whether 2 files or 40 files depend on it before you commit.

### FR-05: High-Entropy Secret & Credential Interception
- **Requirement**: The system must intercept high-entropy strings ($H \ge 4.5$) and known credential signatures in staged git hunks (`vibe guard`).
- **Why it matters**: Preventing credentials (AWS keys, GitHub tokens, Groq keys) from entering Git history saves companies from catastrophic security breaches.

### FR-06: Architectural Decision Records (ADRs) Management
- **Requirement**: The system must allow creating, listing, and superseding formal ADRs (`vibe adr add|list|remove`).
- **Why it matters**: Human and AI developers need a machine-readable source of truth for architectural choices (e.g., "We use PostgreSQL, not MongoDB").

### FR-07: Glob-Scoped System Boundary Constraints
- **Requirement**: The system must enforce glob-scoped boundary rules (`vibe con add "No direct DB calls from UI" -t "src/components/**"`).
- **Why it matters**: Enforces clean architecture (MVC, Clean Architecture, Hexagonal) automatically at the commit level.

### FR-08: Hybrid Decision Reasoning Engine
- **Requirement**: The system must evaluate architectural proposals against active ADRs and constraints using Groq LLM inference, falling back to deterministic rules if offline (`vibe architect`).
- **Why it matters**: Combines nuanced natural language understanding of ADRs with rock-solid offline deterministic safety nets.

### FR-09: Automated Git Pre-Commit Hook Gatekeeper
- **Requirement**: The system must install an executable git hook that intercepts `git commit` and aborts the commit (exit code `2` = `BLOCK`) if critical violations, blast radius $\ge 0.80$, or secrets are detected (`vibe install-hooks`). Warnings and reviews return exit code `1` (`REVIEW`), while clean passes return exit code `0` (`ALLOW`).
- **Why it matters**: A rule that isn't enforced is just a suggestion. The hook turns architectural guidelines into an unbreakable, deterministic gate.

### FR-10: Real-Time Reactive IDE TreeViews & 23 Command Handlers
- **Requirement**: The system must render live reactive trees in VS Code for Requirements, Decisions, Constraints, and Tasks without polling loops, and provide 23 registered Command Palette actions with dynamic runtime compatibility checks.
- **Why it matters**: Developers should see their architectural health in their editor sidebar in real time as they type.

### FR-11: Evidence-Based Requirements & Tenancy Verification
- **Requirement**: The system must audit requirements against real code artifacts (inspecting router prefixes, `get_current_user` dependencies, `org_id` scoped queries, and multi-tenant test suites), dynamically assigning status (`verified`, `at_risk`, `active`).
- **Why it matters**: Replaces superficial checkbox compliance with verifiable code and test evidence.

---

## 2.3 Non-Functional Requirements (The Engineering Boundaries)

```
+-------------------------------------------------------------------------+
|                    VIBE NON-FUNCTIONAL REQUIREMENTS                     |
+-------------------+--------------------+--------------------------------+
| Metric / Pillar   | Hard Target        | Architectural Justification    |
+-------------------+--------------------+--------------------------------+
| Pre-Commit Latency| < 120 milliseconds | Prevents developers bypassing   |
|                   |                    | the hook with --no-verify      |
+-------------------+--------------------+--------------------------------+
| Cold Scan (500 f) | < 1.5 seconds      | Instant AST traversal using    |
|                   |                    | setParentNodes: false          |
+-------------------+--------------------+--------------------------------+
| Network Autonomy  | 100% Offline       | Airplane-mode operation; zero  |
|                   |                    | cloud dependency for core rules|
+-------------------+--------------------+--------------------------------+
| Installation Rate | 100% Success       | Node 22 native node:sqlite;    |
|                   |                    | zero node-gyp C++ compilation  |
+-------------------+--------------------+--------------------------------+
| Extension Memory  | < 35 MB RAM        | Zero polling; kernel-level OS  |
|                   |                    | FileSystemWatcher events       |
+-------------------+--------------------+--------------------------------+
| Data Consistency  | Strict ACID        | SQLite WAL mode + atomic POSIX |
|                   |                    | temporary-file-rename for JSON |
+-------------------+--------------------+--------------------------------+
```

---

## 2.4 User Personas & Realistic User Stories

### Persona 1: Sarah, Senior Full-Stack Engineer
> *"I'm working on a fast-paced sprint. I prompt Cursor to scaffold a new billing webhook. I want VIBE to immediately verify that the AI didn't import an unapproved library or create a circular import, so I don't get embarrassed during code review."*
- **Acceptance Criteria**: Staging changes and running `git commit` takes $< 120\text{ ms}$. If an unapproved dependency is added, terminal prints: `[BLOCKED] CON-002 violated: Unapproved package stripe-v2. Use internal payment-service instead.`

### Persona 2: Alex, VP of Engineering / CTO
> *"Our codebase has 15 engineers and 3 AI pair-programmers pushing code daily. I need a continuous audit log of all architectural decisions and proof that our separation of concerns between frontend and backend is mathematically enforced."*
- **Acceptance Criteria**: Running `vibe doctor` outputs a clean health score, identifies zero circular dependencies, and confirms all recent commits conform to accepted ADRs.

---

## 2.5 Edge Cases & Pathological Scenarios (Where Most Systems Break)

A robust system is defined by how it handles edge cases:

1. **Detached HEAD Git States**:
   - *Problem*: In CI/CD pipelines, Git often checks out a specific commit hash rather than a named branch (`HEAD detached at a1b2c3d`).
   - *VIBE Solution*: The Git plumbing engine (`git.ts`) resolves diffs against tree objects and parent commit SHAs, never relying on branch names like `main` or `master`.

2. **Binary and Giant Files in Repo**:
   - *Problem*: A repository contains compiled `.wasm` binaries, images, or a 50MB minified bundle. Passing these to the TypeScript Compiler API causes an Out-Of-Memory (OOM) crash.
   - *VIBE Solution*: The scanner filters files by extension (`.ts`, `.tsx`, `.js`, `.jsx`), checks file size thresholds ($< 2\text{ MB}$), and skips binary byte signatures.

3. **Circular Symlinks in Filesystem**:
   - *Problem*: A developer creates a symlink pointing to a parent directory (`dirA -> parentDir`). A recursive file scanner enters an infinite loop until the call stack blows up.
   - *VIBE Solution*: The scanner resolves real physical paths (`fs.realpathSync`) and tracks all visited inode/path hashes in a `Set<string>`.

4. **Process Aborted Mid-Write (`Ctrl+C`)**:
   - *Problem*: The user kills the CLI while state is being written, leaving a corrupted, half-written JSON or SQLite file.
   - *VIBE Solution*: In JSON mode, VIBE writes to `.vibe/state.json.tmp.<uuid>`, flushes to disk via `fsync`, and executes an atomic POSIX rename (`fs.rename`). In SQLite mode, all mutations are wrapped inside `BEGIN TRANSACTION` and `COMMIT`.

---

## 2.6 How to Defend This in an Interview
When an interviewer asks: *"How did you approach requirements and constraints for this system?"*

> *"I designed VIBE with a strict performance budget and zero-dependency philosophy. For developer tools, latency dictates adoption: if a pre-commit hook takes more than 150 milliseconds, developers bypass it. So I set a hard non-functional requirement of under 120ms for staged scans.
>
> Secondly, I treated network autonomy as a non-negotiable requirement. A developer on an airplane must have 100% of their architectural boundaries and secret guards working without an internet connection. That forced me to design a two-tier architecture: deterministic compiler analysis and rule evaluation run completely offline, while cloud LLM reasoning via Groq is an optional, high-speed enhancement that gracefully degrades when offline.
>
> Finally, for reliability, I eliminated native C++ dependencies like `better-sqlite3` by utilizing Node 22's native `node:sqlite`, ensuring a 100% install success rate across Windows, Mac, and Linux without compilation errors."*

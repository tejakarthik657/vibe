# 20. Engineering Workflow, Trunk-Based Development & Code Quality
**Document**: `docs/20-engineering-workflow.md`  
**System**: VIBE (Vibe Intent & Boundary Engine)  
**Perspective**: Team Disciplines, Git Conventions, Code Reviews & Release Hygiene

---

## 20.1 The Philosophy: Discipline Over Motivation
High-performing engineering teams do not rely on developers "remembering to be careful." They build **systems and workflows that make the right way the easiest way, and the wrong way impossible.**

In VIBE, our engineering workflow was structured to ensure that every pull request, every commit, and every release adheres to production-grade engineering standards.

---

## 20.2 Trunk-Based Development Workflow
We rejected long-lived feature branches that stay open for three weeks. Long-lived branches lead to "Merge Hell," where integrating conflicting changes across 20 files takes three days of painful manual reconciliation.

Instead, we enforce **Trunk-Based Development**:

```
main (Production-Ready Trunk) ────────●───────────────●───────────────●──────►
                                       ▲               ▲
                                      ╱               ╱
feat/dfs-cycle-detection ────────────● (Squash PR)   │
                                                      │
fix/sqlite-wal-locking ──────────────────────────────● (Squash PR)
```

### The Rules of Trunk-Based Development:
1. Feature branches must be **short-lived** (1 to 2 days maximum).
2. Every branch must branch off the latest `main`.
3. Pull requests are squashed and merged into `main` after CI checks pass, keeping git history linear and easy to bisect.

---

## 20.3 Conventional Commits Standard
Every commit message in the repository must follow the **Conventional Commits specification**:
`<type>(<scope>): <short description>`

### Standard Types Used:
- `feat(core)`: Adds a new feature to the core engine (e.g. `feat(core): add DFS 3-color cycle detection`).
- `fix(storage)`: Resolves a bug in persistence (e.g. `fix(storage): enable WAL mode to resolve SQLite busy locks`).
- `perf(scanner)`: Performance optimization (e.g. `perf(scanner): set setParentNodes to false during shallow AST scans`).
- `test(guard)`: Adding test fixtures (e.g. `test(guard): add synthetic AWS credential interceptor tests`).
- `docs(arch)`: Documentation updates (e.g. `docs(arch): add detailed system architecture diagrams`).

### Why This Matters:
Standardized commit messages allow automated release tools to inspect git logs and automatically generate `CHANGELOG.md` files and increment Semantic Version numbers (`0.4.0` $\rightarrow$ `0.4.1`).

---

## 20.4 The 5-Point Pull Request Review Checklist
Before any pull request can be merged into `main`, the author and reviewer must verify:

- [ ] **1. Zero New Native Addons**: No C++ build dependencies (`node-gyp`) added to `package.json`.
- [ ] **2. Single-Direction Dependency Flow**: No package imports upward in the monorepo hierarchy.
- [ ] **3. Strict Type Safety**: No implicit or explicit `any` types; all exported functions have typed returns.
- [ ] **4. Test Coverage**: New logic includes unit tests covering both happy path and pathological failure cases.
- [ ] **5. Sub-120ms Gate Budget**: Any changes to pre-commit paths (`guard.ts`, `impact.ts`) must be benchmarked to guarantee execution remains under 120ms.

---

## 20.5 Semantic Versioning Strategy (SemVer)
We strictly follow Semantic Versioning (`MAJOR.MINOR.PATCH`):
- **MAJOR (1.0.0)**: Breaking changes to domain interfaces (`DecisionRequest`, `DecisionResult`) or SQLite relational schemas that require a major storage migration.
- **MINOR (0.4.0)**: New commands, providers, or analyzers added in a backwards-compatible manner.
- **PATCH (0.4.3)**: Bug fixes, performance optimizations, or documentation updates with zero API changes.

---

## 20.6 How to Defend This in an Interview
When an interviewer asks: *"How do you maintain code quality and release engineering across a multi-package monorepo?"*

> *"I implemented a strict Trunk-Based Development workflow combined with Conventional Commits and automated CI checks.
>
> In our monorepo, feature branches are kept short-lived (under 48 hours) to prevent merge conflicts. Every commit follows the Conventional Commits format, which allows us to automate semantic versioning and changelog generation.
>
> In our pull request process, we enforce a strict 5-point architectural checklist: verifying that no circular dependencies or native C++ addons are introduced, all functions maintain strict TypeScript typing without `any`, and that pre-commit paths remain under our 120ms latency budget.
>
> Finally, our GitHub Actions pipeline runs automated type checks, unit tests, and self-governance audits on every PR before code is squashed and merged into the main trunk."*

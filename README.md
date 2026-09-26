# VIBE — Engineering Intelligence Layer for AI-Assisted Development

> "AI writes the code. VIBE protects the engineering."

This repo is a **real, runnable V1** — not a mockup, not a scaffold with stub
functions. Every command below was built, compiled, and smoke-tested against
scratch git repositories (including a mixed TypeScript + Python project) before
being packaged. Where something from the original design vision isn't built yet,
that's stated explicitly below rather than implied.

## Version ladder (how the full vision breaks down)

| Version | Scope | Status |
|---|---|---|
| **MVP** | scan, requirements, decisions, guard, doctor, trace, context, VS Code sidebar | ✅ shipped |
| **V1 — Engineering Foundation** | Constraints + Tasks; declared-vs-detected architecture **drift**; transitive **impact** analysis; **checkpoints**; auto-provenance (inferred decisions); `vibe explain`; real Python support alongside TS/JS; CI-friendly `vibe guard --format md` | ✅ **shipped in this zip** |
| **V2 — Decision Intelligence** | `DecisionProvider` abstraction (rules → LLM → optional Jev-style provider), confidence-weighted policy engine, SQLite/Drizzle backend | ⬜ not built |
| **V3 — Agent Infrastructure** | `vibe mcp` server exposing VIBE to Claude Code/Cursor/Codex directly, VS Code CodeLens ("implements REQ-014"), webview graph visualizer | ⬜ not built |
| **V4 — Production Engineering** | Real Semgrep/OSV/Trivy/Gitleaks integration (replacing the naive regex secret check), resilience/chaos checks, `vibe production` readiness report | ⬜ not built |
| **V5 — Platform** | Cloud sync, team collaboration, multi-repo graph, GitHub Action for `vibe guard` on PRs, web dashboard | ⬜ not built |

V2–V5 are specified precisely in the "Next" section at the bottom so whoever picks
this up (you, or another engineer) knows exactly what to build and why, without
having to re-derive it from the original brainstorm.

## What's implemented in V1 (all real, all tested)

### `@vibe/core` — the engine, framework-agnostic
- **`scanner.ts`** — walks the repo, detects languages/frameworks from
  `package.json`/`requirements.txt`, and deep-parses source with a pluggable
  per-language analyzer:
  - TypeScript/JavaScript via the real **TypeScript Compiler API** (imports,
    functions, classes).
  - **Python** via a lightweight parser (`import`/`from...import`, `def`, `class`)
    — genuinely functional, not a stub. Verified in testing to correctly resolve
    a `from pyworker.utils import helper` cross-file dependency into a graph edge.
- **`graph.ts`** — the Engineering Graph: Module → File → Function/Class nodes,
  `CONTAINS`/`DEPENDS_ON` edges from real import resolution (relative JS/TS paths
  and dotted Python module paths), preserving Requirement/Decision/Task/Constraint
  nodes across rescans.
- **`store.ts`** — local-first persistence to `.vibe/state.json`, offline by
  design, with backward-compatible loading for older state files.
- **`git.ts`** — real `simple-git` integration for working-tree diffs.
- **`requirements.ts` / `decisions.ts` / `constraints.ts` / `tasks.ts`** — full
  CRUD for all four "Project Constitution" primitives from the design vision.
  Decisions carry `source: "developer" | "inferred"` and a `confidence` score.
- **`provenance.ts`** *(new in V1)* — after every `vibe scan`, automatically
  records an **inferred** decision for every detected framework not already
  covered by an explicit one, with `confidence: 0.75` and a note to confirm it.
  This is the "never let inference silently become project truth" principle
  from the design chat, actually implemented — verified in testing: scanning a
  project with Express + Next.js dependencies auto-created `ADR-001`/`ADR-002`
  tagged `inferred`.
- **`architecture.ts`** *(new in V1)* — `vibe architect set` declares the
  intended stack; `computeDrift()` compares it against what the scanner actually
  detected. Verified: declaring only "Next.js" against a repo with Express+Next.js
  correctly reported Express as "detected but not declared" — matching the
  vision's drift-detection example almost exactly.
- **`impact.ts`** *(new in V1)* — full transitive blast-radius analysis (BFS over
  `DEPENDS_ON` edges, not just direct dependents), plus which requirements and
  which test files are affected, with a low/medium/high risk score. Verified:
  changing `AuthService.ts` correctly surfaced `PaymentController.ts` as a
  transitive dependent, `REQ-001` as an affected requirement, and the matching
  test file.
- **`snapshot.ts`** *(new in V1)* — `vibe checkpoint` writes an engineering
  health snapshot (`.vibe/snapshots/CKPT-00N-*.json`) combining requirement/
  decision/task counts with live `doctor` findings, and rates the project
  HEALTHY / NEEDS ATTENTION / AT RISK — the "engineering snapshot" concept from
  the design chat.
- **`explain.ts`** *(new in V1)* — `vibe explain <module>` reports what a module
  is, which requirements it implements, which decisions mention it, and its
  cross-module dependency boundary (what it depends on / is depended on by,
  outside itself).
- **`context.ts`** — keyword-relevance engine producing a *scoped* `AGENTS.md`
  context bundle instead of dumping the whole repo at an AI agent.
- **`trace.ts`** — Requirement → linked files → dependent files → likely tests.
- **`doctor.ts`** — evidence-based diagnostics (missing README/.gitignore, weak
  test-coverage ratio, oversized files, TODO/FIXME counts, naive hardcoded-secret
  regexes, requirements with no verifying test).
- **`guard.ts`** — rule-based risk scoring on the current git diff (scope,
  requirement impact, blast radius, new dependencies, secret-looking additions),
  now with `--format md` for pasting into a PR description or piping into CI.

### `vibe` CLI (`packages/cli`)
```
vibe init
vibe scan                          (alias: vibe adopt)
vibe status
vibe requirement add|link|list
vibe decision add|list
vibe constraint add|list           ← new in V1
vibe task add|start|done|list      ← new in V1
vibe architect set|show            ← new in V1
vibe drift                         ← new in V1
vibe impact <file>                 ← new in V1
vibe checkpoint [create|list]      ← new in V1
vibe explain <module>              ← new in V1
vibe context "<task>"              → writes AGENTS.md
vibe trace <REQ-ID>
vibe why <file>
vibe doctor
vibe guard [--format md]
```

### VS Code extension (`packages/vscode-extension`)
Sidebar with four live views — **Requirements, Decisions, Constraints, Tasks** —
reading `.vibe/state.json` directly and watching it for changes, plus commands
(`VIBE: Scan`, `VIBE: Run Doctor`, `VIBE: Guard Current Changes`, `VIBE: Check
Architecture Drift`, `VIBE: Create Checkpoint`, `VIBE: Add Requirement`, `VIBE:
Add Decision`) that shell out to the CLI and stream output to a VIBE output
channel.

## What's honestly still missing (don't assume it's there)

- No AST for languages beyond TS/JS/Python — Java/Go/Rust/C#/etc. are counted by
  extension but not deep-parsed. Tree-sitter is the right tool for the rest (V2+).
- No LLM or "Jev"-style reasoning anywhere. `guard`/`doctor`/`drift` are 100%
  deterministic rules. This is intentional for V1 — the design chat's own
  architecture puts a `DecisionProvider` abstraction as a *separate* layer on
  top of the deterministic engine, which is exactly what V2 adds.
- No MCP server — an AI agent can't query VIBE directly yet; you run `vibe
  context` and hand it `AGENTS.md` manually. V3.
- No real security-tool orchestration (Semgrep/OSV/Trivy/Gitleaks) — `doctor`'s
  secret scan is a few regexes, clearly documented as naive.
- No SQLite backend — state is one JSON file. Fine up to a few thousand files;
  will get slow well before that on huge monorepos.
- No cloud/team/dashboard anything.
- If you do want to wire in the actual Jev/TypeSafe API in V2 rather than just
  the "structured decision" concept: check their current terms first. The
  original design chat surfaced a clause restricting use of their service to
  build a similar/competing product — verify this hasn't changed before
  depending on it.

## Project layout

```
vibe/
├── package.json
├── tsconfig.base.json
├── packages/
│   ├── core/                      @vibe/core
│   │   └── src/
│   │       ├── types.ts
│   │       ├── store.ts
│   │       ├── scanner.ts         (TS/JS + Python analyzers)
│   │       ├── graph.ts
│   │       ├── git.ts
│   │       ├── requirements.ts
│   │       ├── decisions.ts
│   │       ├── constraints.ts     ← V1
│   │       ├── tasks.ts           ← V1
│   │       ├── architecture.ts    ← V1 (declared arch + drift)
│   │       ├── impact.ts          ← V1 (transitive blast radius)
│   │       ├── snapshot.ts        ← V1 (checkpoints)
│   │       ├── explain.ts         ← V1
│   │       ├── provenance.ts      ← V1 (auto-inferred decisions)
│   │       ├── context.ts
│   │       ├── trace.ts
│   │       ├── doctor.ts
│   │       └── guard.ts
│   ├── cli/                       vibe
│   │   ├── bin/vibe.js
│   │   └── src/
│   │       ├── index.ts
│   │       └── commands/*.ts      (17 commands total)
│   └── vscode-extension/          VIBE sidebar + commands
│       └── src/extension.ts
```

## Getting started

```bash
npm install
npm run build

cd /path/to/some/project
node /path/to/vibe/packages/cli/bin/vibe.js init
node /path/to/vibe/packages/cli/bin/vibe.js scan
node /path/to/vibe/packages/cli/bin/vibe.js status
```

As a global command:
```bash
cd packages/cli && npm link
cd /path/to/some/project
vibe init && vibe scan && vibe doctor && vibe checkpoint
```

Publish order (core must go first, cli depends on it):
```bash
cd packages/core && npm publish --access public
cd ../cli && npm publish --access public
```

### VS Code extension
```bash
cd packages/vscode-extension
npm install
npm run build
# F5 in VS Code to run it, or `npx @vscode/vsce package` for a .vsix
```

## Next — concrete V2 spec

1. **`DecisionProvider` interface** in `@vibe/core`: `{ evaluate(question, state, evidence): Promise<{ probability: number, rationale?: string }> }`.
   Implement `RulesProvider` (wraps today's `guard.ts` heuristics as the default/
   fallback), then `LLMProvider` (OpenAI/Anthropic/Gemini via a thin adapter).
   `guard`/`doctor` call the configured provider chain (rules always run;
   LLM/Jev is additive, never load-bearing on its own) and merge scores.
2. **Policy engine**: per-project thresholds (e.g. auth-related changes need
   confidence ≥ 0.95 to auto-pass; formatting-only changes can pass at 0.6),
   configurable in `.vibe/state.json` under a new `policies` field.
3. **SQLite/Drizzle backend**: swap `VibeStore`'s file I/O for a real DB once
   graphs get large — `VibeStore.get()/set()` is already the only interface
   touched elsewhere, so this is a contained change.
4. Ship V2 with the same honesty this README has: document what's still rules-
   only vs LLM-assisted, and never let an inferred/AI-scored fact silently
   become "the architecture" without a confidence number attached.
#   v i b e  
 
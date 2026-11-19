# 01. Project Overview & The Engineering Mental Model
**Document**: `docs/01-project-overview.md`  
**System**: VIBE (Vibe Intent & Boundary Engine)  
**Perspective**: The Creator's Journal, Architectural Vision & First-Principles Understanding

---

## 1.1 The Genesis: Why VIBE Had to Exist
If you ask any senior engineer or CTO today what their biggest headache is with AI coding assistants, they won't tell you "the AI can't write code." 

They will tell you the exact opposite: **"The AI writes code too fast, and nobody knows what it's breaking."**

Think about what happens when you work with Cursor, GitHub Copilot, or Claude Code. You give it a prompt: *"Build a user profile page with avatar upload."* Within five seconds, it generates 200 lines of pristine TypeScript. It compiles. The UI looks gorgeous. You feel like a 10x developer.

**Then you look closer under the hood:**
1. The AI imported `pg` (a raw PostgreSQL client) directly inside your React component because it wanted to query the user table directly. It completely bypassed your backend API layer, your repository pattern, and your authentication middleware.
2. It added a new dependency in `package.json` that your team explicitly banned six months ago in an Architectural Decision Record (ADR) because of a known security vulnerability.
3. It modified a shared utility function in `src/utils/format.ts` to solve its immediate problem, completely unaware that 42 other critical micro-modules import that utility. You just broke production payment receipts, and you won't know it until runtime.
4. In a hurried test script, it hardcoded a test Groq API key or AWS token, staged it in git, and pushed it to GitHub.

### The Core Epiphany
Large Language Models have the raw coding IQ of a senior engineer on a single isolated function, but they have the **architectural memory of a goldfish**. They operate within a transient, sliding context window. They do not remember the painful architectural decisions your team argued about in Slack for three weeks. They have no concept of downstream blast radius.

**VIBE was born from a fundamental thesis:**
> *"If AI is going to write the code, we must have an autonomous, compiler-level governor that protects the engineering."*

VIBE is not another code generator. It is the **architectural gatekeeper**. It sits silently at your terminal and inside your IDE. Before any line of code—written by you or by an AI agent—can be committed to your repository, VIBE intercepts it. It scans the Abstract Syntax Tree (AST), constructs a living dependency graph, calculates the blast radius, checks for secret leaks, and verifies whether the change respects your codified architectural decisions.

---

## 1.2 The Human Problem: Why "Code Reviews" Can't Save Us
Historically, human code reviews kept architectures clean. A senior engineer would look at a Pull Request and say: *"Hey, why are you importing the database client inside a React component? Move that to the service layer."*

**Why does this break down in the age of AI?**
- **Volume**: Engineers used to open PRs with 50 to 150 lines of diff. Today, developers prompted by AI generate 2,000-line PRs in thirty minutes.
- **Cognitive Fatigue**: Reviewing a 2,000-line diff is exhausting. Humans skim. They check if the tests pass and click "Approve."
- **Invisible Transitive Impact**: Even the best engineer cannot mentally traverse a Directed Acyclic Graph (DAG) with 500 files to realize that changing `export interface User` in file A ripples through 18 dependent modules across 4 subdirectories.

We needed a tool that does what humans cannot: **deterministic, compiler-level graph reachability analysis combined with high-speed AI decision reasoning in under 120 milliseconds.**

---

## 1.3 The Mental Model: How to Think About VIBE
To explain VIBE to anyone—an interviewer, a CTO, or a fellow developer—use the **Airport Security Gate Analogy**:

```
[Developer / AI Agent writes code]
                │
                ▼
      ┌──────────────────┐
      │  GIT PRE-COMMIT  │  <--- The Security Gate
      └─────────┬────────┘
                │
       Intercepts staged diff
                │
    ┌───────────┴───────────┐
    ▼                       ▼
[DETERMINISTIC SCAN]    [AI REASONING GATE]
"Did you pack weapons?" "Does your destination make sense?"
• Shannon Entropy check • Checks proposal against ADRs
• TS Compiler AST check • Evaluates layer boundaries
• BFS Blast Radius      • Multiplicative confidence
    │                       │
    └───────────┬───────────┘
                │
         Verdict Rendered
         (in < 120ms!)
                │
        ┌───────┴───────┐
        ▼               ▼
     [ALLOW]         [BLOCK]
   Commit Saved    Commit Aborted + Exact Remediation Printed
```

1. **The Passenger**: The developer or AI agent attempting to commit code.
2. **The Scanner (Deterministic Layer)**: The airport metal detector. It doesn't guess; it knows physics. It scans the TypeScript AST, detects circular imports via DFS 3-coloring, flags high-entropy secret tokens, and measures downstream blast radius. Zero network, pure math.
3. **The Passport Control (Policy Layer)**: Evaluates intent. It checks whether your change conforms to active Architectural Decision Records (ADRs). It asks: *"You said in ADR-001 that we use PostgreSQL. Why are you adding MongoDB driver imports?"*
4. **The Gatekeeper**: If everything is clean, the commit passes silently (exit code `0`). If a violation or secret is detected, the gate slams shut (exit code `1`), aborting the git commit and printing the exact file, line number, and command needed to fix it.

---

## 1.4 Product Scope & Boundaries
When building any serious piece of software, knowing what **not** to build is just as important as knowing what to build.

### What VIBE IS:
- **Local-First & Offline-Capable**: It runs on your workstation. It doesn't require a SaaS subscription, an internet connection, or a cloud backend to protect your code.
- **Compiler-Backed**: It uses the official TypeScript Compiler API. It does not guess imports with fragile regex; it analyzes real syntax trees.
- **Zero-Native-Build SQLite**: It uses Node 22's native `node:sqlite` engine. It never throws `node-gyp` or C++ compilation errors during installation.
- **A Two-Tier Hybrid Brain**: Fast deterministic static rules when offline; high-throughput Groq LPU inference when online, bound together by mathematical confidence calculus.

### What VIBE IS NOT:
- **Not an Editor or Code Generator**: VIBE will not write your React components for you. It lets Claude or Cursor write them, and then it holds them accountable.
- **Not a Simple Linter**: Linters like ESLint inspect single files in isolation. ESLint has no memory of ADRs, cannot build full-project dependency DAGs, cannot compute transitive blast radius across 50 files, and cannot evaluate architectural decisions.
- **Not a Cloud Bloatware**: No Docker daemon required, no Postgres server to spin up, no monthly subscription.

---

## 1.5 Target Users & How They Experience VIBE

### 1. The Solo Full-Stack Developer
- **Day-to-day experience**: You code with Cursor. You stage your changes and run `git commit`. VIBE runs in 97 milliseconds. If you accidentally left an API key in a test file, VIBE blocks the commit and says: *"Secret detected on line 14 of test.ts. Commit aborted."* You fix it before your secret is pushed to public GitHub.

### 2. The Tech Lead & Staff Architect
- **Day-to-day experience**: You write team decisions into VIBE: `vibe adr add "Auth Engine" -c "Need OAuth2" -d "Use Auth0"`. You add a constraint: `vibe con add "Zero direct DB calls from UI" -t "src/components/**"`. From that moment on, every member of your team—and every AI they prompt—is automatically prevented from violating those rules.

### 3. The Autonomous Coding Agent (Claude Code / Devin)
- **Day-to-day experience**: Before an agent starts writing code, it runs `vibe context`. VIBE outputs a compact, token-efficient JSON bundle containing active ADRs, boundary constraints, and dependency graph summaries. The agent ingests this context and knows the exact architecture it must conform to.

---

## 1.6 Success Metrics: How We Measure Victory
1. **Gate Latency $\le 120\text{ ms}$**: If a pre-commit check takes 3 seconds, developers get annoyed and bypass it with `--no-verify`. VIBE completes in under 120ms, making it imperceptible in daily workflow.
2. **Zero Installation Failures**: $100\%$ install reliability across Windows, macOS, and Linux by eliminating native C++ dependencies.
3. **Secret Interception Rate $> 99\%$**: Intercepts AWS, GitHub, Groq, and arbitrary high-entropy keys with $< 1\%$ false-positive rate.
4. **Architectural Drift Reduced to 0**: Codebases governed by VIBE have zero undocumented circular imports and zero layer boundary violations.

---

## 1.7 How to Explain This in an Interview (The "Owner" Narrative)
When an interviewer asks: *"Tell me about a project you built from scratch,"* do not recite a list of technologies. Start with the problem and the mental model:

> *"I noticed a major flaw with the modern AI coding workflow. Tools like Cursor and Copilot generate code rapidly, but they have no architectural memory. They regularly generate circular dependencies, violate layer boundaries, and leak credentials because they optimize locally within a file.
>
> To solve this, I designed and built VIBE from scratch—an autonomous compiler-level architectural governor. It runs at the git pre-commit hook in under 120 milliseconds. It parses the TypeScript AST to build an in-memory dependency graph, calculates change blast radius via reverse BFS reachability, scans staged diffs for high-entropy secrets, and evaluates proposals against codified Architectural Decision Records using a hybrid policy engine combining Groq LPUs with deterministic rule fallbacks. 
>
> I architected it as a 7-package monorepo, eliminated all native C++ build dependencies by leveraging Node 22's native SQLite, and published it both as an npm CLI and a reactive VS Code extension."*

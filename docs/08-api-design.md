# 08. API Design, Command Contracts & Subprocess IPC
**Document**: `docs/08-api-design.md`  
**System**: VIBE (Vibe Intent & Boundary Engine)  
**Perspective**: Interface Design, Unix Philosophy & Subprocess Communication

---

## 8.1 The Philosophy: A CLI is an API
Many developers think an "API" only means REST endpoints, GraphQL schemas, or gRPC services. 

That is a misunderstanding. A Command-Line Interface is an API:
- The command arguments and flags are the **Request Body**.
- The standard output (stdout) is the **Response Payload**.
- The standard error (stderr) is the **Diagnostic Stream**.
- The process exit code (`0` vs `1`) is the **HTTP Status Code**.

If your CLI prints an error message saying *"Secret detected!"* but terminates with `exit 0`, Git thinks the check passed and commits the secret anyway! **The exit code contract is life or death in DevOps.**

Let's examine how VIBE's interface was designed for both human readability and machine-to-machine automation.

---

## 8.2 The 4-State Exit Code Contract
VIBE follows strict POSIX exit code conventions designed for zero ambiguity in Git pre-commit hooks and CI/CD pipelines:

```
+-----------+----------------------+-----------------------------------------------+
| Exit Code | Action Verdict       | Meaning & System Action                       |
+-----------+----------------------+-----------------------------------------------+
| 0         | ALLOW                | Clean / Safe. Zero violations or risk < 0.40. |
|           |                      | Git pre-commit proceeds; CI builds pass.      |
+-----------+----------------------+-----------------------------------------------+
| 1         | REVIEW               | Review Required. Medium risk (>= 0.40, < 0.80)|
|           |                      | or unreviewed dependencies. Warning emitted.  |
+-----------+----------------------+-----------------------------------------------+
| 2         | BLOCK                | Hard Block. Critical finding, risk >= 0.80,   |
|           |                      | secret leaked, or tenant boundary broken.     |
|           |                      | Git pre-commit ABORTS immediately.            |
+-----------+----------------------+-----------------------------------------------+
| 3         | ERROR                | Fatal Execution Crash. Missing repo, corrupt  |
|           |                      | state, or internal unhandled exception.       |
+-----------+----------------------+-----------------------------------------------+
```

---

## 8.3 The Complete 29 CLI Command Catalog (Organized by Domain)

```
VIBE COMMAND HIERARCHY (All 29 Commands across 10 Domains)
├── 1. Project Lifecycle & Setup
│   ├── vibe init [--name <name>]          (Initialize .vibe/ & create safe .gitignore)
│   ├── vibe scan [-f text|json]           (Parse AST, build DAG, verify requirements)
│   ├── vibe status [-f text|json]         (Terminal dashboard of requirements & ADRs)
│   ├── vibe onboard                       (Interactive architectural onboarding walkthrough)
│   ├── vibe bootstrap [--preset <name>]   (Inject foundational constraint & ADR presets)
│   └── vibe config get|set|show           (Manage config & mask API tokens securely)
│
├── 2. Architecture Governance & Drift
│   ├── vibe architect set -f "<stack>"    (Declare authorized production frameworks & DBs)
│   ├── vibe architect show                (Show declared architecture)
│   └── vibe drift [-f text|json]          (Audit actual AST imports against declared stack)
│
├── 3. Requirements Engineering & Evidence Verification
│   ├── vibe requirement add "<text>"     (Register functional/security requirement)
│   ├── vibe requirement link <id> <file> (Bind requirement to source files/routers)
│   └── vibe requirement list             (List requirements with live verification status)
│
├── 4. Architectural Decision Records (ADRs) & Overrides
│   ├── vibe decision add "<title>"        (Record ADR with context, choice, and status)
│   ├── vibe decision list                 (List accepted, proposed, and superseded ADRs)
│   ├── vibe decisions                     (Inspect immutable audit history of AI evaluations)
│   └── vibe override <id> -r "<reason>"   (Senior override for BLOCK; auto-logs an ADR)
│
├── 5. Architectural Constraints
│   ├── vibe constraint add "<text>" -s    (Declare critical/warning boundary invariants)
│   └── vibe constraint list               (List active architectural constraints)
│
├── 6. Task Tracking
│   ├── vibe task add "<title>" -r <req>   (Register task linked to requirement)
│   ├── vibe task list                     (List active engineering tasks)
│   └── vibe task update <id> [status]     (Update status: todo, in_progress, done)
│
├── 7. Guard, Pre-Commit & CI/CD Gates
│   ├── vibe guard [-b <base>] [-f sarif]  (Pre-commit gate: blast radius, secrets, scope)
│   └── vibe install-hooks                 (Install automated Git pre-commit hook)
│
├── 8. Diagnostics & Code Health
│   └── vibe doctor [-f text|json|sarif]   (Exhaustive audit: test runners, tenancy, drift)
│
├── 9. Graph Intelligence, Tracing & AI Context
│   ├── vibe explain [target]              (Contextual module role & coupling explainer)
│   ├── vibe why <file>                    (Explain why a file exists, callers, ADRs, tests)
│   ├── vibe trace <symbol>                (Trace functions, classes, and HTTP routes)
│   ├── vibe impact <file> [-d <depth>]    (Calculate BFS blast radius & downstream consumers)
│   └── vibe context "<task>" -o AGENTS.md (Generate scoped AI agent context document)
│
└── 10. Snapshots, Storage & Benchmarks
    ├── vibe checkpoint create|list|restore (Atomic state graph snapshots)
    ├── vibe test-providers                (Benchmark rules vs Groq LLM reasoning)
    └── vibe migrate-storage               (Upgrade JSON storage to embedded SQLite)
```

---

## 8.4 Subprocess JSON Contract: How the VS Code Extension Talks to the CLI
When the VS Code extension runs a command (e.g., fetching state to render the sidebar), it executes the CLI with the `--json` flag:
```bash
vibe status --json
```

### The Clean Stream Guarantee:
- **`stdout`**: Emits **100% pure, unadorned JSON**. Zero ANSI color codes, zero decorative terminal banners, zero ASCII spinners.
- **`stderr`**: Receives all human-oriented diagnostic logs and debug traces.

```typescript
// The VS Code extension can safely parse stdout without regex stripping:
const { stdout } = await execFileAsync('vibe', ['status', '--json']);
const data = JSON.parse(stdout); // Never throws SyntaxError!
```

---

## 8.5 Domain Contract Schemas (`@vibe/decision-core`)

### 1. `DecisionRequest` (The Universal Input)
```typescript
export interface DecisionRequest {
    id: string;                                  // Unique request UUID
    type: 'architecture' | 'constraint' | 'diff' | 'task';
    action: string;                              // Natural language proposal
    target?: string;                             // Target file or directory
    context: {
        requirements: Requirement[];
        decisions: ADR[];
        constraints: Constraint[];
        graphSummary?: {
            nodeCount: number;
            edgeCount: number;
            cyclesDetected: number;
        };
        diffSummary?: {
            filesChanged: number;
            insertions: number;
            deletions: number;
        };
    };
    timestamp: number;
}
```

### 2. `DecisionResult` (The Universal Output)
```typescript
export interface DecisionResult {
    decisionId: string;
    provider: string;                            // 'groq-lpu-llama-3' | 'rules'
    verdict: 'ALLOW' | 'WARN' | 'REVIEW' | 'BLOCK';
    confidence: number;                          // 0.00 to 1.00
    reasoning: string[];                         // Step-by-step logical justification
    suggestedActions: string[];                  // Practical remediation steps
    violations: Array<{
        ruleId: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        message: string;
        target?: string;
    }>;
    metadata: {
        latencyMs: number;
        modelUsed?: string;
        tokensUsed?: number;
    };
}
```

---

## 8.6 How to Defend This in an Interview
When an interviewer asks: *"How did you design the communication layer between your CLI, external LLMs, and the IDE extension?"*

> *"I designed the interface following Unix philosophy principles: strict separation between data streams and control codes.
>
> For developer workflows and CI/CD pipelines, I implemented a strict exit code contract: operations that pass return `exit 0`, while policy violations, leaked secrets, or circular imports return `exit 1`. This allows our Git pre-commit hook to abort invalid commits automatically.
>
> For inter-process communication with our VS Code extension, I built a dedicated `--json` output mode. When this flag is enabled, VIBE redirects all human-oriented logging and ANSI color formatting to `stderr`, while emitting pure, valid JSON exclusively on `stdout`. This allows the extension host to spawn CLI processes asynchronously and deserialize data without brittle regex parsing.
>
> Finally, at the domain layer, I standardized on universal TypeScript interfaces (`DecisionRequest` and `DecisionResult`) inside `@vibe/decision-core`, decoupling the callers from whether the evaluation is performed by a cloud LLM or an offline rule engine."*

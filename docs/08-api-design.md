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

## 8.2 The Binary Exit Code Contract
VIBE follows strict POSIX exit code conventions:

```
+-----------+----------------------+-----------------------------------------------+
| Exit Code | Equivalent Status    | Meaning & System Action                       |
+-----------+----------------------+-----------------------------------------------+
| 0         | 200 OK               | Success. Zero violations, zero secrets leaked.|
|           |                      | Git pre-commit proceeds; CI builds pass.      |
+-----------+----------------------+-----------------------------------------------+
| 1         | 400 Bad Request /    | Policy or Security Violation. Secret found,   |
|           | 403 Forbidden        | circular import detected, or constraint broken.|
|           |                      | Git pre-commit ABORTS immediately.            |
+-----------+----------------------+-----------------------------------------------+
| 2         | 500 Internal Error   | Fatal System Crash. Missing Node 22 runtime,  |
|           |                      | unhandled I/O exception, or corrupt metadata. |
+-----------+----------------------+-----------------------------------------------+
```

---

## 8.3 The 25+ CLI Command Catalog (Organized by Domain)

```
VIBE COMMAND HIERARCHY
├── 1. Governance & Entity Management
│   ├── vibe req add "<text>"              (Register business/technical requirement)
│   ├── vibe req list                      (List tracked requirements)
│   ├── vibe adr add "<title>" -c "<ctx>"  (Register Architectural Decision Record)
│   ├── vibe adr list                      (List accepted and superseded ADRs)
│   ├── vibe con add "<rule>" -t "<glob>"  (Register architectural constraint)
│   ├── vibe con list                      (List active constraints)
│   └── vibe task add "<title>"            (Register task linked to requirement/ADR)
│
├── 2. Intelligence & Code Reasoning
│   ├── vibe scan                          (Parse AST, build DAG, detect cycles)
│   ├── vibe doctor                        (All-in-one health, drift, and cycle audit)
│   ├── vibe architect "<proposal>"        (Hybrid Groq LLM + Rules proposal evaluation)
│   ├── vibe explain "<file>"              (Contextual dependency & coupling explainer)
│   └── vibe why "<decision-id>"           (Inspect historical decision audit trail)
│
├── 3. Safety, Security & Blast Radius
│   ├── vibe guard --staged                (Scan staged diff for secrets and entropy)
│   ├── vibe impact --staged               (Calculate BFS blast radius of staged changes)
│   └── vibe checkpoint save|restore       (Create or restore project state snapshots)
│
├── 4. Persistence & Configuration
│   ├── vibe config get|set|show           (Manage config & mask credentials)
│   └── vibe migrate-storage --to <type>   (Bidirectional SQLite <-> JSON migration)
│
└── 5. DevOps & Automation
    ├── vibe hooks install|remove          (Install/uninstall Git pre-commit hook)
    ├── vibe onboard                       (Interactive 60-second onboarding wizard)
    └── vibe test-providers                (Diagnostic latency test for LLM & Rules)
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

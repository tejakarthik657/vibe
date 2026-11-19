# VIBE: The Engineering Decision Intelligence System (V1 & V2)
## Comprehensive Technical Architecture, Core Algorithms, Package Invariants & Interview Master Guide
**Author / Publisher**: DevFrames (`devframes`)  
**Product**: VIBE Engine & CLI (`vibe-dev`), VS Code Extension (`devframes.vibe-vscode-extension`)  
**Ecosystem Version**: `0.4.x` Monorepo  

---

## Table of Contents
1. [Executive Summary & Core Thesis](#1-executive-summary--core-thesis)
2. [High-Level Architecture & Data Flow](#2-high-level-architecture--data-flow)
3. [Monorepo Package Anatomy & Dependency Graph](#3-monorepo-package-anatomy--dependency-graph)
4. [Deep-Dive Layer Analysis](#4-deep-dive-layer-analysis)
   - [Layer 1: Deterministic Static Analysis & AST Engine (`vibe-dev-core`)](#layer-1-deterministic-static-analysis--ast-engine-vibe-dev-core)
   - [Layer 2: Decision Contracts & Evidence Calculus (`vibe-dev-decision-core`)](#layer-2-decision-contracts--evidence-calculus-vibe-dev-decision-core)
   - [Layer 3: Decision Providers & Inference Adapters (`decision-providers`)](#layer-3-decision-providers--inference-adapters-decision-providers)
   - [Layer 4: Confidence & Policy Engine (`vibe-dev-policy-engine`)](#layer-4-confidence--policy-engine-vibe-dev-policy-engine)
   - [Layer 5: Dual-Engine Storage Abstraction (`vibe-dev-storage`)](#layer-5-dual-engine-storage-abstraction-vibe-dev-storage)
   - [Layer 6: CLI & Ergonomics Layer (`vibe-dev`)](#layer-6-cli--ergonomics-layer-vibe-dev)
   - [Layer 7: IDE Extension Engine (`vibe-vscode-extension`)](#layer-7-ide-extension-engine-vibe-vscode-extension)
5. [Complete Mathematical & Algorithmic Formulations](#5-complete-mathematical--algorithmic-formulations)
6. [Failure Modes, Edge Cases & Threat Modeling](#6-failure-modes-edge-cases--threat-modeling)
7. [Production Deployment, Packaging & Registry Topologies](#7-production-deployment-packaging--registry-topologies)
8. [Comprehensive Interview Q&A Bible (Technical & Architectural)](#8-comprehensive-interview-qa-bible-technical--architectural)

---

## 1. Executive Summary & Core Thesis

### The Problem: The AI Coding Governance Void
With the rise of Large Language Models (LLMs) and autonomous coding agents (Copilot, Cursor, Devin, Claude Code), developers generate orders of magnitude more code in less time. However:
1. **Context Blindness**: Autonomous coding tools operate on localized file prompts, oblivious to overarching business requirements, non-negotiable architectural constraints, and previous Architectural Decision Records (ADRs).
2. **Architectural Drift**: Developers inadvertently introduce secondary databases (e.g., importing Mongoose when Postgres was declared), compromise authentication layers, or bypass retry policies.
3. **The "AI Hallucination as Truth" Trap**: Asking an LLM whether a change is safe typically yields inconsistent, hallucinated affirmations because the LLM lacks deterministic grounding in the codebase's complete topology.

### The VIBE Core Thesis
> **"Facts remain deterministic. AI interprets facts. Policy decides actions."**

VIBE bridges this gap by decoupling **fact extraction**, **semantic interpretation**, and **policy enforcement**:
- **Deterministic Facts**: Extracted strictly via TypeScript Compiler API (AST parsing), file-system globbing, deterministic dependency graphs, and Git diff inspection. No LLM is permitted to discover or invent facts.
- **AI Interpretation**: Interprets weighted structural facts and predicts subtle, non-obvious failure modes (e.g., blast radius consequences, missing reconciliations, credential leakage).
- **Policy Engine**: A deterministic mathematical policy pipeline that maps provider confidence and evidence severity into concrete governance actions: `ALLOW`, `WARN`, `REVIEW`, `BLOCK`, or `ESCALATE`.

```
+-----------------------------------------------------------------------------------+
|                            VIBE MENTAL MODEL                                      |
+-----------------------------------------------------------------------------------+
| [ DETERMINISTIC FACTS ]   -> Code Graph, AST Imports, Git Working Tree, Diff Scope|
|            |                                                                      |
|            v                                                                      |
| [ AI INTERPRETATION ]     -> LLM/Rules Provider synthesizes structural evidence   |
|            |                 into risk hypotheses & confidence scores             |
|            v                                                                      |
| [ POLICY CALCULUS ]       -> Deterministic Thresholds: ALLOW | REVIEW | BLOCK     |
|            |                                                                      |
|            v                                                                      |
| [ AUDIT & OVERRIDES ]     -> Auto-generated ADRs, SQLite audit ledger             |
+-----------------------------------------------------------------------------------+
```

---

## 2. High-Level Architecture & Data Flow

When a developer runs `vibe guard` (in terminal, CI/CD pre-commit hook, or VS Code Command Palette):

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer / Git Hook
    participant CLI as CLI / VS Code Client
    participant Core as Static Core (AST/Diff)
    participant Store as Storage Engine (SQLite/JSON)
    participant Chain as Provider Fallback Chain
    participant Groq as Groq LLM Provider
    participant Rules as Deterministic Rule Provider
    participant Policy as Policy & Confidence Engine

    Dev->>CLI: Executes `vibe guard`
    CLI->>Core: Inspect Git working tree (git diff + staged status)
    Core->>Core: Parse AST, detect imports, trace symbols
    Core->>Store: Load declared requirements, constraints, ADRs
    Core->>Core: Compute architectural drift & blast radius
    Core-->>CLI: Return Deterministic Guard Report & Evidence[]

    CLI->>Chain: evaluate(DecisionRequest { evidence, context })
    alt Groq API Key Configured & Online
        Chain->>Groq: POST /chat/completions (Strict JSON, Temp: 0.1)
        Groq-->>Chain: Return DecisionResult (decision, confidence, reasoning)
    else Groq Offline / 4xx/5xx / AI Disabled
        Chain->>Rules: evaluate(DecisionRequest)
        Rules-->>Chain: Return Deterministic Heuristic Result
    end

    Chain-->>CLI: DecisionResult
    CLI->>Policy: evaluatePolicy(DecisionRequest, DecisionResult)
    Policy->>Policy: Compute finalConfidence = providerConfidence * evidenceQuality
    Policy->>Policy: Map to Action (ALLOW | WARN | REVIEW | BLOCK)
    Policy-->>CLI: PolicyResolutionRecord

    CLI->>Store: Log Decision Record to SQLite (`.vibe/vibe.db`)
    CLI-->>Dev: Formatted Terminal/UI Output + Action Directives
```

---

## 3. Monorepo Package Anatomy & Dependency Graph

The project is structured as an npm monorepo workspaces architecture under the publisher scope `devframes`.

```
vibe/
├── package.json                         # Root workspace definition
├── tsconfig.base.json                   # Shared TypeScript compiler options
├── packages/
│   ├── decision-core/                   # Universal contracts, interfaces & Evidence models
│   ├── storage/                         # Dual-engine storage (Node 22 SQLite + JSON fallback)
│   ├── decision-providers/
│   │   ├── rules/                       # Deterministic baseline provider (Zero network)
│   │   └── llm/                         # Groq OpenAI-compatible LLM inference adapter
│   ├── policy-engine/                   # Confidence calculus, policy resolver, fallback chain
│   ├── core/                            # AST parser, graph walker, git diff, drift detector
│   ├── cli/                             # Commander-based CLI tool (`vibe-dev`)
│   └── vscode-extension/                # VS Code Extension (`vibe-vscode-extension`)
```

### Dependency Graph Matrix

```
       [ vibe-dev (CLI) ]               [ vibe-vscode-extension ]
         /      |       \                            |
        v       |        v                           | (via CLI IPC / npx)
[ vibe-dev-core ] |   [ vibe-dev-policy-engine ]<-----+
        |       |          /             \
        |       |         v               v
        |       | [ provider-rules ]  [ provider-llm ]
        |       |         \               /
        |       |          v             v
        |       +---->[ vibe-dev-storage ]
        |                   |
        v                   v
     [ vibe-dev-decision-core ]
```

---

## 4. Deep-Dive Layer Analysis

### Layer 1: Deterministic Static Analysis & AST Engine (`vibe-dev-core`)
**Package**: `vibe-dev-core`  
**Purpose**: Absolute source of truth for the codebase's static topology.

#### Key Modules & Responsibilities:
1. **AST Scanner (`scanner.ts`)**:
   - Uses `typescript` Compiler API to generate ASTs (`ts.createSourceFile`) across all matched glob patterns (`fast-glob`).
   - Recursively traverses `ts.SyntaxKind.ImportDeclaration` and `ts.SyntaxKind.CallExpression` (dynamic `require` / `import()`).
   - Extracts external package dependencies vs. internal module cross-links.
2. **Graph Engine (`graph.ts`)**:
   - Constructs a directed acyclic graph (DAG) representing file-to-file and module-to-module dependencies.
   - Computes **Transitive Dependent Blast Radius**: Given file $F_0$, find all nodes $F_n$ reachable via reverse edge traversal ($F_n \to \dots \to F_0$).
3. **Git Integration Engine (`diff.ts`)**:
   - Interfaces with `simple-git`.
   - Distinguishes between untracked files, working tree modifications, and staged chunks.
   - Extracts file churn counts and diff scope.
4. **Architecture Drift Detector (`drift.ts`)**:
   - Compares declared framework manifests (in `architecture.yaml` / `.vibe/state.json`) against AST-detected import statements.
   - If `mongoose` or `mongodb` is imported in AST, but only `postgres` is declared, it flags a structural violation: `undeclaredButDetected`.
5. **Secret Scanner (`guard.ts`)**:
   - Deterministic Regex scanner inspecting line diffs for high-entropy tokens: AWS Access Keys (`AKIA[0-9A-Z]{16}`), generic private keys (`-----BEGIN PRIVATE KEY-----`), JWT patterns, and database connection strings (`postgres://`, `mongodb://`).

---

### Layer 2: Decision Contracts & Evidence Calculus (`vibe-dev-decision-core`)
**Package**: `vibe-dev-decision-core`  
**Purpose**: Immutable domain types and communication interfaces across engines.

#### The Universal Contracts:
```typescript
export type DecisionType = "boolean" | "choice" | "score" | "probability";

export interface DecisionRequest {
  id: string;
  type: DecisionType;
  question: string;
  context: {
    project: string;
    module?: string;
    filePath?: string;
    diffSummary?: string;
  };
  options?: string[];
  evidence: Evidence[];
  category?: "architecture" | "formatting" | "authentication" | "dependency" | "general";
  requiredConfidence?: number;
}

export interface Evidence {
  type: "architecture-drift" | "dependency-change" | "requirement-impact" | "secret-risk" | "test-coverage";
  source: string;
  details: string;
  weight: number; // Normalized strictly: [0.0, 1.0]
}

export interface DecisionResult {
  requestId: string;
  decision: "ALLOW" | "REVIEW_REQUIRED" | "BLOCK" | unknown;
  confidence: number; // Normalized: [0.0, 1.0]
  reasoning: string;
  evidence: Evidence[];
  provider: string;
  timestamp: string;
}

export interface DecisionProvider {
  name: string;
  capabilities(): DecisionCapability;
  evaluate(request: DecisionRequest): Promise<DecisionResult>;
}
```

---

### Layer 3: Decision Providers & Inference Adapters (`decision-providers`)
VIBE adopts the **Strategy Pattern** for decision evaluation.

#### 1. Rules Provider (`vibe-dev-provider-rules`)
- **Nature**: 100% Deterministic, zero network overhead, sub-millisecond execution.
- **Algorithm**:
  - Iterates over `request.evidence`.
  - If any evidence has `type === "secret-risk"` with `weight >= 0.8`: Returns `BLOCK` with `confidence = 1.0`.
  - If any evidence has `type === "architecture-drift"`: Returns `REVIEW_REQUIRED` with `confidence = 1.0`.
  - If evidence list is empty: Returns `ALLOW` with `confidence = 1.0`.

#### 2. Groq LLM Provider (`vibe-dev-provider-llm`)
- **Nature**: Ultra-fast inference via Groq cloud API using open-weights models (`openai/gpt-oss-120b`).
- **Prompt Engineering Invariants**:
  - Grounded strictly in structural evidence passed via `DecisionRequest.evidence`.
  - Negative constraints explicitly enforce: *"DO NOT invent facts or hallucinate outside the evidence list."*
  - Strict JSON schema enforcement with fallback string sanitization (stripping markdown fences ` ```json `).
- **Graceful Error Encapsulation**: HTTP non-200 responses, network disconnects, or malformed JSON trigger errors caught by the Fallback Chain.

---

### Layer 4: Confidence & Policy Engine (`vibe-dev-policy-engine`)
**Package**: `vibe-dev-policy-engine`  
**Purpose**: Resolves provider output and evidence weighting into deterministic organizational actions.

#### The Fallback Chain (`fallback-chain.ts`)
Implements resilient priority routing:
```typescript
export class ProviderChain {
  public async evaluate(request: DecisionRequest): Promise<DecisionResult> {
    if (this.llmProvider.isConfigured() && !this.isAiDisabled) {
      try {
        return await this.llmProvider.evaluate(request);
      } catch (err) {
        // Fallback transparently if network offline or model rate-limited
      }
    }
    return await this.ruleProvider.evaluate(request);
  }
}
```

#### Confidence Resolution & Policy Mapping
A high confidence score from an LLM is invalid if the evidence provided was weak or empty.

$$\text{Evidence Quality} = \begin{cases} 1.0, & \text{if evidence is empty (clean change)} \\ \max_{e \in \text{Evidence}}(\text{weight}_e), & \text{otherwise} \end{cases}$$

$$\text{Final Confidence} = \text{Provider Confidence} \times \text{Evidence Quality}$$

The action matrix resolves:
- If `Final Confidence < 0.40`: Automatically escalates to `REVIEW` (Preventing low-confidence automation).
- If `Decision == BLOCK`: Forces `ACTION: BLOCK` (Exits process with Code 1).
- If `Decision == REVIEW_REQUIRED` or `0.40 <= Confidence < 0.70`: Resolves to `REVIEW`.
- If `Decision == ALLOW` and `Confidence >= 0.70`: Resolves to `ALLOW`.

---

### Layer 5: Dual-Engine Storage Abstraction (`vibe-dev-storage`)
**Package**: `vibe-dev-storage`  
**Purpose**: Storage layer decoupling file-system JSON from high-throughput relational persistence.

#### Storage Architecture
1. **`StorageAdapter` Interface**: Enforces unified CRUD contracts for `saveState()`, `loadState()`, `logDecision()`, `getDecisionLogs()`, and `saveOverride()`.
2. **`SQLiteStorageAdapter`**:
   - Built on Node 22 native `node:sqlite` (`DatabaseSync`), eliminating compilation issues with native C++ bindings (`better-sqlite3` / `node-gyp`) on Windows/macOS/Linux.
   - Schema defines relational tables:
     - `project_state (id TEXT PRIMARY KEY, data TEXT, updated_at TEXT)`
     - `decision_logs (id TEXT PRIMARY KEY, request_id TEXT, provider TEXT, calculated_confidence REAL, confidence_level TEXT, resolved_action TEXT, request_json TEXT, result_json TEXT, override_json TEXT, timestamp TEXT)`
     - `engineering_graph (id TEXT PRIMARY KEY, type TEXT, source TEXT, target TEXT, metadata_json TEXT)`
3. **`JSONStorageAdapter`**: Legacy file persistence (`.vibe/state.json`, `.vibe/decisions.json`).
4. **Storage Migrator (`migrator.ts`)**: Performs lossless atomic transfer from JSON files to `.vibe/vibe.db`.

---

### Layer 6: CLI & Ergonomics Layer (`vibe-dev`)
**Package**: `vibe-dev`  
**Binary Alias**: `vibe` and `vibe-dev`  
**Framework**: Commander.js + Chalk + Ora

#### Advanced Ergonomics Features:
- **Auto-Initialization**: Commands auto-initialize `.vibe/` if invoked inside an uninitialized repository.
- **Natural Language Intent Pre-processor**: Intercepts casual input (e.g., `vibe what is the health`, `vibe add a task fix login`) and rewrites `process.argv` to structured subcommands.
- **Exit Code Protocol**: Non-zero exit codes on `ACTION: BLOCK` halt Git pre-commit hooks and CI/CD pipelines.

---

### Layer 7: IDE Extension Engine (`vibe-vscode-extension`)
**Publisher**: `devframes`  
**Package**: `devframes.vibe-vscode-extension`  
**Marketplace URL**: `https://marketplace.visualstudio.com/items?itemName=devframes.vibe-vscode-extension`

#### Architecture:
- Runs natively in VS Code without separate server processes.
- Contributes Activity Bar Container with 4 custom `TreeDataProvider` instances:
  - `RequirementsProvider`: Live statuses (`verified`, `at_risk`, `unverified`).
  - `DecisionsProvider`: Displays ADRs and confidence ratings.
  - `ConstraintsProvider`: Visual severity alerts (`critical`, `warning`, `info`).
  - `TasksProvider`: Sprints and todo state tracking.
- Features `FileSystemWatcher` attached to `.vibe/state.json` and `.vibe/vibe.db` for instant sidebar reactivity.
- Exposes 19 Command Palette actions invoking the local `vibe-dev` CLI.

---

## 5. Complete Mathematical & Algorithmic Formulations

### 1. Architectural Risk Score Formulation
Let $C$ be the set of static checks evaluated during `vibe guard`:

$$\text{Total Diff Risk} = 1.0 - \prod_{c \in C} (1.0 - R_c)$$

Where $R_c \in [0.0, 1.0]$ represents the localized risk of check $c$:
- **Scope Churn Risk ($R_{\text{scope}}$)**: $\min\left(1.0, \frac{\text{Changed Files}}{30}\right)$
- **Dependency Churn Risk ($R_{\text{dep}}$)**: $0.50$ if `package.json` modified, else $0.00$.
- **Blast Radius Risk ($R_{\text{blast}}$)**: $\min\left(1.0, \frac{\text{Transitive Dependents}}{15}\right)$
- **Secret Risk ($R_{\text{secret}}$)**: $1.00$ if regex pattern matched, else $0.00$.
- **Drift Risk ($R_{\text{drift}}$)**: $0.90$ if undeclared framework detected, else $0.00$.

### 2. Confidence Tier Classification
```
Confidence ∈ [0.00, 0.39]  --> UNKNOWN   (Force Review / Escalate)
Confidence ∈ [0.40, 0.59]  --> LOW       (Review Required)
Confidence ∈ [0.60, 0.79]  --> MODERATE  (Allow with Warnings)
Confidence ∈ [0.80, 0.89]  --> HIGH      (Allow)
Confidence ∈ [0.90, 1.00]  --> VERY HIGH (Allow)
```

---

## 6. Failure Modes, Edge Cases & Threat Modeling

| Component | Failure Mode / Threat | Mitigation Strategy in VIBE |
|---|---|---|
| **LLM Provider** | API Outage / Network Offline | `ProviderChain` catches HTTP errors and immediately executes `RulesProvider` fallback. |
| **LLM Provider** | Prompt Injection via Code Diff | Prompt structure encloses diff in JSON evidence payloads; system prompt instructs model to act purely as an analyzer and ignore instructions in diff. |
| **LLM Provider** | JSON Output Formatting Error | Sanitizer strips markdown code fences (` ```json `); fallback schema sets `decision = "REVIEW_REQUIRED"` upon parser error. |
| **AST Parser** | Syntax Errors in Uncommitted Code | TypeScript parser runs in fault-tolerant mode (`setExternalModuleIndicator`); unparseable files flagged as `risk: 0.50 (parsing-failure)`. |
| **Storage Engine**| SQLite Lock on Windows | SQLite database operations use `DatabaseSync` with immediate connection disposal; fallback writes to `state.json`. |
| **Git Engine** | Detached HEAD / Fresh Repo | Checks `git.checkIsRepo()`; if no commits exist, diff engine gracefully inspects untracked files instead of crashing. |
| **Secret Scanner**| False Positives (Test Fixtures) | Secret scanner checks if the matched file resides in `__tests__` or `fixtures/` and downweights severity. |

---

## 7. Production Deployment, Packaging & Registry Topologies

### Monorepo Publication Order
Because packages have strict version interdependencies, npm publishing requires topological ordering:

1. `vibe-dev-decision-core` (Base Contracts)
2. `vibe-dev-storage` (Persistence Layer)
3. `vibe-dev-provider-rules` (Rules Adapter)
4. `vibe-dev-provider-llm` (LLM Adapter)
5. `vibe-dev-policy-engine` (Policy & Fallback Orchestrator)
6. `vibe-dev-core` (AST & Static Engine)
7. `vibe-dev` (CLI Binary Distribution)
8. `devframes.vibe-vscode-extension` (VS Code Marketplace VSIX)

### Zero Secret Leaks Principle
- API keys (`groq_api_key`, etc.) are persisted exclusively in `.vibe/config.json`.
- Root `.gitignore` explicitly excludes `.vibe/config.json` and `.vibe/*.db`.
- CLI commands (`vibe config show`) mask key strings: `gsk_hfG...cg7J`.

---

## 8. Comprehensive Interview Q&A Bible (Technical & Architectural)

### Architectural & System Design Questions

#### Q1: "What is the core architectural innovation of VIBE compared to SonarQube, ESLint, or GitHub Copilot?"
> **Answer**:
> - **ESLint & SonarQube** are deterministic code analyzers; they evaluate localized syntax, code smells, or security ASTs, but have zero contextual awareness of business requirements, high-level architecture decisions (ADRs), or transitive blast radius.
> - **GitHub Copilot / Cursor** are generative AI tools that suggest code, but they suffer from hallucination and lack architectural governance.
> - **VIBE** is a **Decision Intelligence Engine**. It does not write code. It observes deterministic facts from the AST and Git diff, formulates structured Evidence objects, passes them through a confidence-weighted multi-provider chain (Rules $\to$ LLM), and applies an organizational Policy Calculus to determine whether changes are allowed. Facts remain 100% deterministic; AI is restricted to interpretation; policy dictates governance.

#### Q2: "Why did you build a Fallback Provider Chain instead of relying entirely on the LLM?"
> **Answer**:
> In enterprise CI/CD environments, reliability and determinism are paramount. Relying solely on an external LLM introduces network latency, rate limits, API outages, and cost overhead.
> 
> VIBE implements the Chain of Responsibility pattern via `ProviderChain`. If Groq is reachable and configured, VIBE leverages high-parameter reasoning for nuanced risk interpretation. If the network drops, rate limits occur, or the user passes `--no-ai`, VIBE falls back to `RulesProvider`. The system never fails open or crashes when external AI services degrade.

#### Q3: "How does VIBE prevent LLM hallucination from corrupting architectural decisions?"
> **Answer**:
> VIBE enforces the **Evidence-Grounding Invariant**. The LLM is never asked open-ended questions like *"Is this codebase clean?"*. 
> 
> Instead, VIBE's deterministic core scans the AST and Git diff first, generating a strictly typed `Evidence[]` array (e.g., `type: "architecture-drift"`, `source: "architecture.yaml"`, `details: "MongoDB detected but Postgres declared"`, `weight: 0.9`). This array is provided in the prompt context. Furthermore, the Policy Engine calculates `finalConfidence = providerConfidence * evidenceQuality`. If an LLM claims 99% confidence on empty evidence, its score is penalized.

---

### Low-Level Engineering & Implementation Questions

#### Q4: "How does the Transitive Blast Radius algorithm work in `vibe-dev-core`?"
> **Answer**:
> `vibe-dev-core` parses all import statements using the TypeScript Compiler API (`ts.createSourceFile`) across all matched files to build an in-memory Dependency DAG where an edge $A \to B$ indicates file $A$ imports file $B$.
> 
> When file $B$ changes in a Git diff, VIBE computes the reverse adjacency list (dependents) and performs a Breadth-First Search (BFS) or Depth-First Search (DFS) starting at $B$ across all reverse edges. The cardinality of the visited set defines the transitive blast radius. If $B$ is a foundational type definition imported by 40 modules, its blast radius risk score saturates at 1.0.

#### Q5: "Why did you adopt Node 22's native `node:sqlite` over `better-sqlite3` or Prisma?"
> **Answer**:
> CLI tools and VS Code extensions must install instantly across diverse environments (Windows x64, macOS ARM64/Apple Silicon, Linux). Packages like `better-sqlite3` rely on `node-gyp` and native C++ compilation, frequently failing on client machines lacking Python or Visual Studio Build Tools.
> 
> ORMs like Prisma introduce heavy binary engines (tens of megabytes). Node 22 introduced `node:sqlite` (`DatabaseSync`), providing synchronous SQLite execution with zero native dependencies, zero installation friction, and an unpacked size of just a few kilobytes.

#### Q6: "How does the human override mechanism (`vibe decision accept`) function under the hood?"
> **Answer**:
> When a decision resolves to `ACTION: REVIEW` or `ACTION: BLOCK` (e.g., `DEC-004`), the record is stored in `.vibe/vibe.db`. If a lead engineer determines the change is intentional (e.g., MongoDB was added for analytics), they execute:
> `vibe decision accept DEC-004 -r "MongoDB introduced intentionally for analytics service"`.
> 
> The engine loads the record via `StorageAdapter`, updates `resolvedAction` to the explicitly selected human action, appends a `HumanOverrideRecord` (recording user, reason, and ISO timestamp), and automatically records a new ADR in the architecture registry. The override is preserved in the SQLite audit ledger.

#### Q7: "How is the VS Code extension architected to prevent freezing the editor UI?"
> **Answer**:
> The VS Code extension (`packages/vscode-extension`) delegates computation via asynchronous Child Process IPC (`child_process.exec`). 
> 
> Heavy static analysis, AST traversal, and LLM network requests run in the CLI binary process. The extension communicates via standard output channels and listens for file system mutations using `vscode.workspace.createFileSystemWatcher` targeting `.vibe/state.json` and `.vibe/vibe.db`. When the database changes, it triggers `_onDidChangeTreeData.fire()`, ensuring 60fps UI performance.

---

### Edge Case & Security Questions

#### Q8: "How does VIBE handle sensitive API keys, and why are they never leaked?"
> **Answer**:
> 1. API keys are stored solely in `.vibe/config.json` at project root.
> 2. The root `.gitignore` ignores `.vibe/` configuration files.
> 3. CLI inspection commands (`vibe config show`) mask tokens (`gsk_hfG...cg7J`).
> 4. `vibe guard` scans all uncommitted diffs for API keys and blocks commits if a key is staged.

#### Q9: "What happens if a Git diff contains 5,000 changed files (e.g., a massive dependency update or vendor commit)?"
> **Answer**:
> VIBE incorporates safeguards:
> 1. The git diff extractor ignores directories matched by `.gitignore` (specifically `node_modules`, `dist`, `.git`).
> 2. `R_scope` caps at 1.0 when changed files exceed 30.
> 3. For LLM evaluation, diff payloads are summarized rather than raw-dumped, preventing token exhaustion and context window overflow.
> 4. If the diff exceeds safe boundaries, the engine marks `category: "scope"` and delegates to `RulesProvider`.

---

## 9. Summary Architecture Cheat-Sheet

```
+-----------------------------------------------------------------------------------------+
| FACT EXTRACTION (Core)      | TypeScript Compiler API, AST Traversal, Git Diff Scanner  |
| DECISION MODEL (Core)       | DecisionRequest, DecisionResult, Evidence (Weights 0-1)   |
| INFERENCE ENGINES (Adapters)| Groq LLM (gpt-oss-120b) + Deterministic RuleProvider      |
| POLICY CALCULUS (Policy)    | Confidence = ProviderConf * EvidenceQuality -> Action     |
| STORAGE ADAPTERS (Storage)  | Node 22 native SQLite (DatabaseSync) + Legacy JSON        |
| CLIENT SURFACES (CLI & IDE) | Commander.js (`vibe-dev`) + VS Code TreeDataProviders     |
+-----------------------------------------------------------------------------------------+
```
*(Save this reference file for technical interviews, design reviews, and architectural onboarding).*

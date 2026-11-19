# 18. AI Engineering, LLM Decision Systems & Confidence Calculus
**Document**: `docs/18-ai-engineering.md`  
**System**: VIBE (Vibe Intent & Boundary Engine)  
**Perspective**: Prompt Sandboxing, Graph-Augmented Generation & Mathematical Grounding

---

## 18.1 The AI Trap: Why Naive LLM Wrappers Fail in Production
Most "AI developer tools" built today are fragile toys. The developer takes an open prompt, dumps raw code into it, sends it to OpenAI with temperature 0.7, and hopes for the best.

**What happens in production?**
1. **Hallucination**: The LLM invents packages that don't exist (`import { secureAuth } from 'react-ultra-secure'`).
2. **Non-Determinism**: You run the check at 2:00 PM, and it says "ALLOW". You run the exact same check at 2:05 PM, and it says "BLOCK". Developers lose all faith in the tool.
3. **High Latency**: Waiting 4 seconds for GPT-4 to respond to a pre-commit check kills productivity.
4. **Prompt Injection**: A developer puts a funny comment in code, and the LLM gets tricked into approving an insecure architecture.

In VIBE, we treated the LLM as an **untrusted, probabilistic reasoning engine that must be strictly constrained by compiler math.**

---

## 18.2 Four Guardrails for Deterministic AI Reasoning

```
+---------------------------------------------------------------------------------+
|                       VIBE FOUR-TIER AI GUARDRAIL SYSTEM                        |
+-------------------+----------------------------+--------------------------------+
| Guardrail         | Technical Implementation   | Architectural Purpose          |
+-------------------+----------------------------+--------------------------------+
| 1. Temperature    | temperature: 0.1           | Eliminates creative variance;  |
|    Lock           |                            | guarantees output consistency  |
+-------------------+----------------------------+--------------------------------+
| 2. Hard Schema    | response_format:           | Model is physically unable to  |
|    Enforcement    | {"type": "json_object"}    | output conversational text     |
+-------------------+----------------------------+--------------------------------+
| 3. Graph-Augmented| Topological AST subgraphs  | Replaces fuzzy vector search   |
|    Generation     | injected into prompt       | with exact compiler facts      |
+-------------------+----------------------------+--------------------------------+
| 4. Multiplicative | Bayesian evidence calculus | Compiler evidence weights down |
|    Calculus       | Conf_final = Conf * sum(wQ)| overconfident AI scores        |
+-------------------+----------------------------+--------------------------------+
```

---

## 18.3 Graph-Augmented Generation (GAG) vs Vector RAG
In standard AI applications, people use **Vector RAG (Retrieval-Augmented Generation)**:
- Chunk code into 500-token blocks.
- Generate OpenAI embeddings.
- Perform cosine similarity search in Pinecone or Chroma.

### Why Vector Search is Completely Wrong for Software Architecture:
Vector search finds things that **look similar in prose**, not things that are **connected in logic**.
- If `auth.ts` imports `db.ts`, they might have completely different embedding vectors! Vector search misses the import completely.
- Vector search cannot tell you if there is a circular dependency.
- Vector search cannot compute a blast radius.

### VIBE's Graph-Augmented Generation (GAG):
Instead of fuzzy semantic search, VIBE queries the **in-memory AST Dependency Graph**:
1. It identifies the target file being modified.
2. It extracts the exact topological neighborhood (who it imports, and who imports it).
3. It bundles active ADRs and glob-matching boundary constraints.
4. It injects this exact, mathematically proven structural slice into the LLM prompt.

The LLM is not guessing the architecture; it is reasoning over **verified compiler ground truth.**

---

## 18.4 The Multiplicative Confidence Calculus
How do we know whether to trust an LLM's verdict?

LLMs are notoriously overconfident. A model will hallucinate a completely fake explanation and output `confidence: 0.99`.

VIBE solves this with a **Multiplicative Bayesian Evidence Formula**:

$$\text{Conf}_{\text{final}} = \text{Conf}_{\text{raw}} \times \left( \sum_{i=1}^{n} w_i \cdot Q(E_i) \right)$$

Where:
- $\text{Conf}_{\text{raw}}$: The confidence score reported by the LLM ($0.0 \le \text{Conf} \le 1.0$).
- $E_i$: An evidence piece evaluated against the compiler (e.g. AST scan clean, diff summary verified, active ADR match).
- $w_i$: The normalized weight of that evidence piece ($\sum w_i = 1.0$).
- $Q(E_i)$: The quality of the evidence:
  - $1.0$: Proven by the TypeScript Compiler AST.
  - $0.5$: Heuristic pattern match.
  - $0.0$: Evidence missing or contradictory.

### The Math in Action:
Imagine Groq reports: *"This change is fine! Verdict: ALLOW, Confidence: 0.95"*.
- But the TypeScript AST engine detects that an undocumented circular import was introduced!
- The AST evidence piece $Q(E_{\text{AST}})$ drops from $1.0$ to $0.0$.
- The confidence calculus executes:
  $$\text{Conf}_{\text{final}} = 0.95 \times 0.60 = 0.57$$
- Because $\text{Conf}_{\text{final}} < 0.85$, the Policy Engine immediately **overrides the LLM**, downgrading the verdict from `ALLOW` to `BLOCK`!

**The compiler always has the final word.**

---

## 18.5 The LPU Speed Advantage: Why Groq?
Why did we choose Groq LPUs instead of OpenAI or Anthropic?

### The Hardware Reality:
- **Standard GPUs (Nvidia H100)**: Optimized for parallel matrix multiplication in model training. During inference, they suffer from memory bandwidth bottlenecks, generating tokens at ~40 to 80 tokens/sec.
- **Groq LPUs (Language Processing Units)**: Built on a Tensor Streaming Processor (TSP) architecture with 230MB of ultra-fast on-die SRAM per chip. There is zero external DRAM memory bus contention.

### The Latency Comparison:
- **OpenAI GPT-4o**: 2,500ms - 4,000ms latency.
- **Anthropic Claude 3.5 Sonnet**: 2,000ms - 3,500ms latency.
- **Groq LPU (`gpt-oss-120b`)**: **220ms - 380ms total round-trip latency.**

In a developer CLI tool, sub-400ms feels instantaneous. It transforms architectural AI from an annoying background wait into a seamless, interactive command.

---

## 18.6 How to Defend This in an Interview
When an interviewer asks: *"How do you prevent your AI decision engine from hallucinating or approving bad code?"*

> *"I treated the LLM as an untrusted probabilistic classifier that must be grounded in compiler determinism.
>
> First, I rejected vector embeddings and semantic search. Software architecture is defined by directed graphs, not cosine similarity. I built Graph-Augmented Generation (GAG), which extracts exact topological subgraphs and compiler AST metadata and injects them directly into the context.
>
> Second, I locked inference temperature to 0.1 and enforced strict JSON schema output via Groq's API, eliminating conversational drift.
>
> Third, I implemented a Multiplicative Confidence Calculus: we take the LLM's self-reported confidence and weight it against compiler-proven evidence. If an LLM claims a code change is safe, but our AST engine proves it introduces a circular dependency, the evidence score drops, and the confidence calculus automatically downgrades the verdict to BLOCK.
>
> Finally, if the cloud API times out or fails, our circuit-breaker immediately falls back to our sub-millisecond offline deterministic rule engine. The compiler always acts as the ultimate truth."*

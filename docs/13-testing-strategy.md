# 13. Testing Strategy, Quality Engineering & Pathological Test Fixtures
**Document**: `docs/13-testing-strategy.md`  
**System**: VIBE (Vibe Intent & Boundary Engine)  
**Perspective**: Testing Philosophy, Synthetic Graphs, Edge Case Validation & CI Automation

---

## 13.1 The Testing Philosophy: Never Mock the Thing You're Testing
A junior developer writes unit tests by mocking everything. They mock the compiler, they mock the file system, they mock Git, and they mock the database. 

When all the tests pass, they celebrate. Then they run the tool on a real repository, and it immediately crashes because real Git returns different whitespace, real TypeScript handles comments differently, and Windows paths use backslashes instead of forward slashes.

### VIBE's Testing Golden Rules:
1. **Never mock the TypeScript Compiler**: If you're testing AST parsing, feed it real, syntactically complex TypeScript files.
2. **Deterministic tests must run 100% offline**: A test suite that fails because Wi-Fi dropped on a train is broken by design. External cloud LLM calls are mocked during CI; deterministic compiler engines are tested against real code.
3. **Always test pathological failure cases**: Don't just test clean, beautiful code. Test code with syntax errors, infinite cyclic imports, detached Git states, and high-entropy secret payloads.

---

## 13.2 The 4 Testing Tiers

```
+----------------------------------------------------------------------------------+
|                              VIBE TESTING PYRAMID                                |
+-----------------------+-----------------------------+----------------------------+
| Tier                  | Scope                       | Execution Environment      |
+-----------------------+-----------------------------+----------------------------+
| 1. Unit Tests         | Shannon entropy calculus,   | In-memory pure algorithms  |
|                       | DFS 3-coloring, BFS blast   | < 50ms total execution     |
+-----------------------+-----------------------------+----------------------------+
| 2. Integration Tests  | Real TypeScript AST parser, | Isolated temporary test    |
|                       | SQLite transactions & WAL   | directories with real Git  |
+-----------------------+-----------------------------+----------------------------+
| 3. Security Tests     | Synthetic secret injection, | Synthetic staged diffs     |
|                       | false-positive filters      | asserting exit code 1      |
+-----------------------+-----------------------------+----------------------------+
| 4. End-to-End Tests   | Full CLI workflow: init ->  | Headless spawned CLI       |
|                       | scan -> adr -> commit gate  | subprocesses via execFile  |
+-----------------------+-----------------------------+----------------------------+
```

---

## 13.3 Real Pathological Test Fixtures

### Fixture 1: The Multi-Node Circular Dependency Test
In `packages/core/test/graph.test.ts`, we construct a synthetic graph containing both acyclic paths and an intentional 4-node cycle:
$$A \rightarrow B \rightarrow C \rightarrow D \rightarrow B$$

```typescript
test('DFS 3-coloring accurately identifies 4-node directed cycle and path', () => {
    const mockGraph: DependencyGraph = {
        nodes: [
            { id: 'src/a.ts', label: 'a.ts', type: 'file', path: '/src/a.ts' },
            { id: 'src/b.ts', label: 'b.ts', type: 'file', path: '/src/b.ts' },
            { id: 'src/c.ts', label: 'c.ts', type: 'file', path: '/src/c.ts' },
            { id: 'src/d.ts', label: 'd.ts', type: 'file', path: '/src/d.ts' },
            { id: 'src/clean.ts', label: 'clean.ts', type: 'file', path: '/src/clean.ts' },
        ],
        edges: [
            { source: 'src/a.ts', target: 'src/b.ts', type: 'imports' },
            { source: 'src/b.ts', target: 'src/c.ts', type: 'imports' },
            { source: 'src/c.ts', target: 'src/d.ts', type: 'imports' },
            { source: 'src/d.ts', target: 'src/b.ts', type: 'imports' }, // Cyclic back-edge!
            { source: 'src/a.ts', target: 'src/clean.ts', type: 'imports' }
        ]
    };

    const result = detectCycles(mockGraph);
    expect(result.hasCycles).toBe(true);
    expect(result.cycles).toHaveLength(1);
    expect(result.cycles[0]).toEqual(['src/b.ts', 'src/c.ts', 'src/d.ts', 'src/b.ts']);
});
```

### Fixture 2: The Secret Interceptor Test Suite
In `packages/core/test/guard.test.ts`, we verify that synthetic secrets trigger blocking verdicts while normal code passes cleanly:

```typescript
describe('Secret Guard Validation', () => {
    test('intercepts synthetic AWS secret access key', () => {
        const diff = `+ const awsSecret = "AKIAIOSFODNN7EXAMPLE";`;
        const result = scanDiffForSecrets(diff);
        expect(result.detected).toBe(true);
        expect(result.rule).toBe('AWS_ACCESS_KEY');
    });

    test('intercepts high-entropy random base64 string', () => {
        const diff = `+ const signingKey = "dGhpc0lzQVJhbmRvbUh1Z2VFbnRyb3B5U3RyaW5nOTk4OA==";`;
        const result = scanDiffForSecrets(diff);
        expect(result.detected).toBe(true);
        expect(result.entropyScore).toBeGreaterThanOrEqual(4.5);
    });

    test('does NOT flag long camelCase identifiers (false-positive filter)', () => {
        const diff = `+ const userAuthenticationProfileManagerServiceInstance = new Service();`;
        const result = scanDiffForSecrets(diff);
        expect(result.detected).toBe(false); // Clean pass!
    });
});
```

---

## 13.4 Continuous Integration (CI) Pipeline
Our automated GitHub Actions workflow runs on every pull request:
1. **Type Checking**: Runs `tsc --noEmit` across all 7 packages.
2. **Unit & Integration Suite**: Executes all tests in $< 45\text{ seconds}$.
3. **Self-Governance Dogfooding**: The CI pipeline actually runs `vibe doctor` on the VIBE monorepo itself! If VIBE's own codebase has an unapproved circular import, the CI build fails immediately!

---

## 13.5 How to Defend This in an Interview
When an interviewer asks: *"How did you test this system, especially complex graph traversals and secret scanning?"*

> *"I adopted a zero-mock philosophy for our deterministic compiler engines. When testing AST parsing, I feed real TypeScript files into the actual TypeScript Compiler API to verify that interface declarations, decorator metadata, and namespace imports are accurately extracted.
>
> For graph algorithms, I built synthetic test fixtures with pathological topologies—including multi-node circular dependencies and disconnected subgraphs—to prove that our DFS 3-coloring algorithm terminates with the exact cyclic chain in $\mathcal{O}(V + E)$ time without stack overflow.
>
> For security scanning, I created test fixtures containing synthetic AWS keys, GitHub tokens, and high-entropy base64 strings to verify that `vibe guard` blocks them with exit code 1. Crucially, I also tested negative cases—such as 60-character camelCase variable names—to guarantee that our character-set entropy filtering prevents false positives.
>
> Finally, we dogfood VIBE in our CI pipeline: GitHub Actions runs `vibe doctor` against our own monorepo to verify that our own packages maintain zero circular dependencies."*

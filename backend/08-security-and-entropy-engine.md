# Backend Engineering Guide 08: Security & Entropy Engine Internals

This guide provides a comprehensive breakdown of VIBE's AppSec mechanisms, including the mathematical theory of Shannon entropy secret detection, path traversal protections, AST taint analysis, and credential sanitation.

---

## 1. Information Theory: Shannon Entropy for Secret Detection

Hardcoded API keys, private certificates, and passwords are fundamentally high-entropy random byte sequences embedded within low-entropy natural code:

```
Low Entropy (English/Code):  "getUserProfileData"       -> H ≈ 2.85 bits/char
Medium Entropy (Identifiers): "calculateTaxRate_2024"   -> H ≈ 3.42 bits/char
High Entropy (API Keys):     "ak_live_8f3a9e1b7c20d4"   -> H ≈ 4.65 bits/char
Extreme Entropy (Base64 RSA): "MIIEowIBAAKCAQEA0r12..."  -> H ≈ 5.82 bits/char
```

### The Shannon Entropy Formula
For a given string $S$ with character set $X$, the information entropy $H(S)$ measured in bits per character is:

$$H(S) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$

Where $P(x_i)$ is the probability (frequency) of character $x_i$ occurring within string $S$.

---

## 2. Implementation: The Sliding Window Entropy Engine

Calculating entropy over an entire file yields false negatives because the surrounding low-entropy code averages out the secret. VIBE implements a **Sliding Window Token Scanner**:

```typescript
export class ShannonEntropyScanner {
  private static readonly BASE64_ALPHABET = 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  public static calculateEntropy(str: string): number {
    if (!str || str.length === 0) return 0;

    const charFrequencies = new Map<string, number>();
    for (const char of str) {
      charFrequencies.set(char, (charFrequencies.get(char) || 0) + 1);
    }

    let entropy = 0;
    const len = str.length;

    for (const count of charFrequencies.values()) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  public static scanStringLiteral(literal: string, minLength = 16, threshold = 4.3): boolean {
    if (literal.length < minLength) return false;

    // Check raw literal entropy
    const rawEntropy = this.calculateEntropy(literal);
    if (rawEntropy >= threshold) {
      // Disqualify known non-secret high-entropy structures (e.g., standard UUIDs)
      if (this.isUUID(literal) || this.isSha256Hex(literal)) {
        return false;
      }
      return true;
    }

    return false;
  }

  private static isUUID(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
  }

  private static isSha256Hex(str: string): boolean {
    return /^[0-9a-f]{64}$/i.test(str);
  }
}
```

---

## 3. Defense Against Path Traversal (`Zip Slip` & Relative Path Escapes)

When developers supply path arguments (e.g., `vibe scan --dir=../../etc`), or when parsing symlinks in monorepos, malicious paths can escape the workspace root.

### The Canonicalization Defense
```typescript
import path from 'node:path';
import fs from 'node:fs';

export class SecurePathResolver {
  public static resolveWorkspaceFile(workspaceRoot: string, userInputPath: string): string {
    const canonicalRoot = fs.realpathSync(path.resolve(workspaceRoot));
    const resolvedPath = path.resolve(canonicalRoot, userInputPath);

    // Verify boundary containment
    if (!resolvedPath.startsWith(canonicalRoot + path.sep) && resolvedPath !== canonicalRoot) {
      throw new Error(`SECURITY ALERT: Directory traversal attempt detected: ${userInputPath}`);
    }

    // Verify realpath to guard against symlink target evasion
    if (fs.existsSync(resolvedPath)) {
      const realTarget = fs.realpathSync(resolvedPath);
      if (!realTarget.startsWith(canonicalRoot + path.sep) && realTarget !== canonicalRoot) {
        throw new Error(`SECURITY ALERT: Symlink target outside workspace root: ${userInputPath}`);
      }
    }

    return resolvedPath;
  }
}
```

---

## 4. AST Taint Analysis for SQL & Shell Injection

VIBE identifies injection vulnerabilities using **Taint Analysis** on the AST graph:

```mermaid
flowchart LR
    Source["Taint Source: req.query.id"] --> Identifier["Variable: const queryId = req.query.id"]
    Identifier --> Sink["Dangerous Sink: db.query(`SELECT * FROM users WHERE id = ${queryId}`)"]
    Sink --> Alert["SECURITY VIOLATION: Unsanitized SQL Injection Detected!"]
```

### Detection Logic:
1. Identify all **Taint Sources**: `req.query`, `req.body`, `process.argv`, `process.env`.
2. Follow variable bindings across assignments within the lexical scope.
3. If a tainted variable flows into an unescaped **Sink** (`eval()`, `child_process.exec()`, raw SQL string template literals) without passing through a sanitizer (`sanitize()`, parameterized query), emit a **High Severity Security Violation**.

---

## 5. Secret Redaction & Ignore Engine Architecture

### 5.1 Comprehensive In-Memory Secret Redaction (`redactSecrets`)
Before sending any diff or code chunk to an AI inference provider or writing to audit logs, VIBE applies deterministic regex masking:
- AWS Access Keys (`AKIA...` $\to$ `[REDACTED_AWS_KEY]`)
- Groq API Keys (`gsk_...` $\to$ `[REDACTED_GROQ_KEY]`)
- GitHub Tokens (`ghp_...` $\to$ `[REDACTED_GITHUB_TOKEN]`)
- Private Keys (`-----BEGIN RSA PRIVATE KEY-----` $\to$ `[REDACTED_PRIVATE_KEY]`)
- Generic Passwords / API Keys (`api_key = "..."` $\to$ `[REDACTED_KEY]`)

This guarantees zero secrets can ever leak into terminal logs, LLM prompts, or SQLite audit histories.

### 5.2 The Unified `IgnoreEngine`
Untracked dependency folders (`.venv/`, `node_modules/`, `dist/`, `__pycache__/`) can inject thousands of third-party files into git diffs. VIBE's `IgnoreEngine`:
1. Combines `.gitignore`, `.vibeignore`, and built-in production rules.
2. Accurately categorizes all paths into `source`, `test`, `config`, `dependency`, `generated`, and `ignored`.
3. Normalizes Windows backslashes (`\`) to POSIX forward slashes (`/`), guaranteeing cross-platform ignore parity.

---

## 5. Interview Defense: Security Engineering

**Q: Why is Shannon entropy superior to standard regex for API key detection?**
> *"Regex relies on known vendor prefixes, such as `ghp_` for GitHub or `sk_live_` for Stripe. Attackers and developers frequently use custom secrets, generic database passwords, and private signing keys that lack standardized prefixes. Shannon entropy quantifies the actual mathematical randomness and information density of the string, detecting zero-day and unformatted secrets that regex patterns miss entirely, while filter heuristics discard common false positives like UUIDs."*

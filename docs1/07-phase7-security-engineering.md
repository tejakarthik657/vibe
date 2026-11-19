# Phase 7: Security Engineering
**Document Ref**: `docs1/07-phase7-security-engineering.md`  
**System**: VIBE (Vibe Intent & Boundary Engine)  
**Phase**: Phase 7 of 10 — Security Architecture, Secret Interception & Threat Modeling

---

## Executive Overview: The Intent of Phase 7
Security must be designed into every layer, not bolted on at the end. In VIBE, security engineering focuses on pre-commit credential leak prevention, Shannon entropy mathematical detection, STRIDE threat modeling, and indirect prompt injection defense.

---

## 46. Application Security
*OWASP Top 10, secure coding, input sanitization, path traversal.*

### 46.1 Path Traversal Mitigation
All filesystem paths received via CLI arguments or glob constraints are normalized using `path.resolve` and checked against the repository root using `path.relative` to prevent directory traversal attacks (`../../etc/passwd`).

### 46.2 SQL Injection Prevention
All SQLite operations in `sqlite-adapter.ts` use parameterized SQL queries with bound values. Zero string interpolation is permitted in SQL strings.

---

## 47. API Security
*Rate limiting, API keys, authentication, request validation.*

### 47.1 Local Vault Isolation (`.vibe/config.json`)
API keys are stored exclusively in `.vibe/config.json` and masked in terminal displays (`gsk_hfG...cg7J`). The initialization command automatically adds `.vibe/config.json` to `.gitignore`.

### 47.2 Client-Side Rate Limiting
External calls to Groq implement exponential backoff with randomized jitter to handle HTTP 429 rate limit responses gracefully.

---

## 48. Data Security
*Encryption at rest, encryption in transit, sensitive data protection.*

- **In Transit**: All cloud communication with Groq uses TLS 1.3 encrypted HTTPS tunnels.
- **At Rest**: Relies on host operating system full-disk encryption (BitLocker on Windows, FileVault on macOS, LUKS on Linux).

---

## 49. Infrastructure Security: Shannon Entropy Secret Guard
*Network security, secrets management, entropy scanning.*

### 49.1 Shannon Entropy Mathematical Calculus (`guard.ts`)
For unformatted or custom cryptographic tokens, VIBE computes Shannon entropy over a sliding character window:

$$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$

- Strings with $H(X) \ge 4.5$ on a 64-character alphabet without whitespace are flagged as cryptographic keys.
- **False Positive Elimination**: Long camelCase variable names are filtered out by requiring character-set variance across digits, symbols, and non-dictionary character transitions.

### 49.2 Regex Credential Heuristics
- AWS Access Key: `AKIA[0-9A-Z]{16}`
- GitHub Personal Access Token: `ghp_[0-9a-zA-Z]{36}`
- Groq API Key: `gsk_[a-zA-Z0-9]{48,64}`
- Private RSA/ECDSA Key Headers: `-----BEGIN [A-Z ]+ PRIVATE KEY-----`

---

## 50. AI Security: Indirect Prompt Injection Defense
*Prompt injection, data leakage, insecure tool execution, model abuse.*

When passing source code to Groq LPUs, VIBE encapsulates untrusted code diffs inside structured JSON data fields, separating them from the LLM system prompt instructions. System instructions mandate that code comments must never be interpreted as commands.

---

## 51. Privacy & Compliance
*Consent, data retention, audit trails, regulatory requirements.*

- **Zero Cloud Telemetry**: Core governance, scanning, and rule evaluation transmit **zero bytes** to external servers.
- **Immutable Audit Trails**: Every decision is recorded in SQLite with timestamps and reasoning, satisfying SOC2 and ISO 27001 auditability requirements.

---

## 52. Identity & Access Management
*User roles, tenant isolation, least privilege, permission policies.*

Because VIBE is local-first, permissions mirror operating system file ACLs. The Git pre-commit hook acts as the gatekeeper, denying commit permissions (exit code `1`) when policy or security violations are detected.

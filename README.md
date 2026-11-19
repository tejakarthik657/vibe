# VIBE — Autonomous Compiler-Level Architectural Governance & Decision Intelligence System

> **"AI generates the code. VIBE governs the engineering."**

[![NPM Version](https://img.shields.io/npm/v/vibe-dev.svg?style=flat-square&color=007acc)](https://www.npmjs.com/package/vibe-dev)
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/devframes.vibe-vscode-extension.svg?style=flat-square&color=blueviolet)](https://marketplace.visualstudio.com/items?itemName=devframes.vibe-vscode-extension)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## Complete Production-Grade Engineering Documentation

VIBE maintains a comprehensive engineering documentation hierarchy split into 24 distinct, dedicated technical documents:

- **[Master Technical Architecture Manual (All-in-One)](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/TECHNICAL_ARCHITECTURE.md)**: Master architectural specification.
- **[Documentation Hub & Category Index](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/README.md)**: Categorized directory of all 24 technical documents.

### Dedicated Technical Specifications (`docs/`)
1. **[01. Project Overview & Product Understanding](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/01-project-overview.md)**
2. **[02. Requirements Engineering](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/02-requirements-engineering.md)**
3. **[03. System Architecture & High-Level Design](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/03-system-architecture.md)**
4. **[04. Technology Stack & Engineering Decisions](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/04-technology-stack.md)**
5. **[05. Codebase Organization & Monorepo Structure](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/05-codebase-organization.md)**
6. **[06. Database Design & Persistence Architecture](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/06-database-design.md)**
7. **[07. Backend Engineering & Runtime Internals](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/07-backend-engineering.md)**
8. **[08. API Design & Inter-Process Contracts](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/08-api-design.md)**
9. **[09. Frontend Architecture & IDE Client Engine](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/09-frontend-architecture.md)**
10. **[10. Security Architecture & Threat Modeling](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/10-security-architecture.md)**
11. **[11. Performance & Scalability Engineering](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/11-performance-scalability.md)**
12. **[12. Distributed Systems & Advanced Backend Concepts](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/12-distributed-systems.md)**
13. **[13. Testing Strategy & Quality Engineering](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/13-testing-strategy.md)**
14. **[14. DevOps, CI/CD & Deployment](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/14-devops-deployment.md)**
15. **[15. Production Observability & Monitoring](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/15-production-observability.md)**
16. **[16. Reliability & Resilience Engineering](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/16-reliability-engineering.md)**
17. **[17. Engineering Decision Records (ADRs)](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/17-engineering-decisions.md)**
18. **[18. AI Engineering & LLM Decision Systems](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/18-ai-engineering.md)**
19. **[19. Product Engineering & User Experience](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/19-product-engineering.md)**
20. **[20. Engineering Workflow & Practices](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/20-engineering-workflow.md)**
21. **[21. Developer Guide & Setup Playbook](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/21-developer-guide.md)**
22. **[22. Technical Challenges & Problem Solving](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/22-engineering-challenges.md)**
23. **[23. Project Ownership & Staff-Level Interview Preparation](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/23-interview-preparation.md)**
24. **[24. Engineering Learning Log & Knowledge Gaps](file:///c:/Programming/Projects/05_Social-Impact/vibe-v1/vibe/docs/24-learning-log.md)**

---

## Quick Start Guide

### 1. Installation
Install the VIBE CLI globally:
```bash
npm install -g vibe-dev
```

### 2. Initialize Your Repository
Navigate to any git repository and run:
```bash
vibe init
```

### 3. Scan Codebase AST & Build Graph
```bash
vibe scan
```

### 4. Install Git Pre-Commit Hook (Sub-120ms Gate)
```bash
vibe install-hooks
```

### 5. Codify ADRs and Boundaries
```bash
# Register an Architectural Decision Record
vibe adr add "Database Engine" -c "Need high performance relational store" -d "Use PostgreSQL and Prisma"

# Register a system boundary constraint
vibe con add "Zero direct database queries from UI components" -t "src/components/**"
```

### 6. Verify System Health & Audit Drift
```bash
vibe doctor
# Machine-readable CI output (exits non-zero for high/critical findings)
vibe doctor --format json
```

---

## Monorepo Architecture Overview
VIBE is divided into 7 decoupled packages:
```
packages/
├── decision-core/          # Pure domain contracts (zero dependencies)
├── core/                   # AST parser, DAG builder, diff engine, secret scanner
├── decision-providers/
│   ├── rules/              # Zero-network deterministic rule engine
│   └── llm/                # High-throughput Groq LPU inference adapter
├── policy-engine/          # Confidence calculus and circuit-breaking fallback chain
├── storage/                # Node 22 native SQLite and atomic JSON adapters
├── cli/                    # 25+ Commander commands, preprocessor, and git hooks
└── vscode-extension/       # Reactive IDE client with 4 TreeView providers
```

---

## License
MIT License. Maintained for production-grade software engineering and architectural governance.

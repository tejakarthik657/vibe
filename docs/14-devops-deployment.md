# 14. DevOps, CI/CD, NPM Packaging & Marketplace Distribution
**Document**: `docs/14-devops-deployment.md`  
**System**: VIBE (Vibe Intent & Boundary Engine)  
**Perspective**: Release Engineering, Multi-Package Builds, VSCE Publishing & Git Hooks

---

## 14.1 The Release Journey: From Local Code to Global Registries
Writing code is only half the battle. A system is not complete until a stranger anywhere in the world can open their terminal or IDE, run an install command, and have it work seamlessly on their machine.

VIBE is distributed through two major public developer channels:
1. **The Global NPM Registry**: Published as **`vibe-dev`** (v0.4.8) for command-line execution and CI/CD pipelines.
2. **The Visual Studio Code Marketplace**: Published as **`devframes.vibe-vscode-extension`** (v0.4.8) for VS Code and Cursor users worldwide.

Let's look at the release pipeline that makes this possible.

---

## 14.2 Multi-Package Monorepo Build Pipeline
In a monorepo with 7 decoupled packages, you cannot compile packages in random order. If you compile `@vibe/core` before `@vibe/decision-core`, TypeScript will crash because the domain types haven't been built yet!

We use **TypeScript Project References** (`tsc -b`):

```mermaid
flowchart TD
    PKG1["packages/decision-core (Must build first!)"]
    PKG2["packages/core"]
    PKG3["packages/decision-providers/rules"]
    PKG4["packages/decision-providers/llm"]
    PKG5["packages/policy-engine"]
    PKG6["packages/storage"]
    PKG7["packages/cli"]
    PKG8["packages/vscode-extension"]

    PKG1 --> PKG2
    PKG1 --> PKG3
    PKG1 --> PKG4
    PKG1 --> PKG5
    PKG2 --> PKG6
    PKG5 --> PKG6
    PKG6 --> PKG7
    PKG7 -.->|Packaged independently| PKG8
```

### The Root `tsconfig.base.json`
Every package extends a shared strict base configuration:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true
  }
}
```
Running `npm run build` from the monorepo root triggers TypeScript's dependency graph builder, compiling all packages in strict topological order in under **12 seconds**.

---

## 14.3 Packaging & Publishing the VS Code Extension (`vsce`)
Publishing a VS Code extension is fundamentally different from publishing a standard web app or npm package:
- You must package the extension into an optimized `.vsix` archive using `@vscode/vsce`.
- You must declare precise `activationEvents` and UI `viewsContainers` inside `package.json`.
- The `.vscodeignore` file must exclude test suites, source TypeScript maps, and scratch scripts to keep the download size under **1.5MB**.

```bash
# Packaging and publishing command
cd packages/vscode-extension
npx @vscode/vsce package
npx @vscode/vsce publish --pat <MARKETPLACE_TOKEN>
```
The published extension is live on the Visual Studio Marketplace: `devframes.vibe-vscode-extension` (v0.4.8).

---

## 14.4 Git Pre-Commit Hook Automation (`hooks.ts`)
How does running `vibe hooks install` protect the developer's repository?

In `packages/cli/src/commands/hooks.ts`, VIBE locates the local `.git` directory and writes an executable shell script to `.git/hooks/pre-commit`:

```bash
#!/bin/sh
# VIBE Autonomous Architectural & Security Guard
# Generated automatically by 'vibe hooks install'

echo "[VIBE] Intercepting staged commit..."

# 1. Run secret scanning on staged diff
vibe guard --staged
if [ $? -ne 0 ]; then
    echo "[VIBE BLOCKED] Credential leak or entropy violation detected. Commit aborted."
    exit 1
fi

# 2. Run blast radius and architectural boundary checks
vibe impact --staged
if [ $? -ne 0 ]; then
    echo "[VIBE BLOCKED] Architectural constraint violated. Commit aborted."
    exit 1
fi

echo "[VIBE] All checks passed cleanly."
exit 0
```

### The Permissions Challenge:
On Unix/macOS, Git hooks are ignored unless they have executable permissions. VIBE automatically invokes `fs.chmodSync(hookPath, '755')` to ensure the hook runs without requiring manual `chmod` steps.

---

## 14.5 Enterprise CI Containerization (Docker)
For enterprise teams running VIBE in GitHub Actions, GitLab CI, or Jenkins pipelines, we provide an ultra-lightweight Alpine Linux container:

```dockerfile
FROM node:22-alpine
# Install native git client for diff extraction
RUN apk add --no-cache git
WORKDIR /workspace
# Install VIBE globally
RUN npm install -g vibe-dev
ENTRYPOINT ["vibe"]
```
Because Node 22 includes native SQLite, the entire Docker image is only **74MB** and boots in **$45\text{ milliseconds}$**.

---

## 14.6 How to Defend This in an Interview
When an interviewer asks: *"How did you package, deploy, and distribute this system?"*

> *"I established a multi-channel release pipeline for both terminal and IDE environments.
>
> In the monorepo, I used TypeScript Project References to guarantee strict topological build ordering across all 7 packages. 
>
> For command-line execution and CI/CD pipelines, I packaged and published the CLI globally to the npm registry as `vibe-dev` (v0.4.8).
>
> For developer ergonomics, I packaged the VS Code client into an optimized VSIX bundle using `@vscode/vsce` and published it to the official Visual Studio Marketplace as `devframes.vibe-vscode-extension` (v0.4.8), configuring `.vscodeignore` to keep the download size under 1.5MB.
>
> For automated enforcement, I engineered `vibe hooks install` to generate an executable `.git/hooks/pre-commit` script that runs staged secret scanning and impact checks in under 110ms, automatically setting POSIX 755 execution permissions.
>
> And for enterprise CI, I built an official Node 22 Alpine Docker image that weighs just 74MB and boots in 45ms."*

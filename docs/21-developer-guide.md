# 21. Developer Guide: Zero-to-One Local Setup & Operational Playbook
**Document**: `docs/21-developer-guide.md`  
**System**: VIBE (Vibe Intent & Boundary Engine)  
**Perspective**: The Onboarding Manual, Local Linking, Debugging & Troubleshooting

---

## 21.1 The Golden Standard of Onboarding
Another engineer should be able to clone your repository, run two commands, and have the entire system compiling, tested, and running locally in **under three minutes** without asking you a single question.

If a project requires 15 manual environment variables, custom global dependencies, and obscure database credentials to get started, the engineering onboarding is broken.

Here is the exact step-by-step operational playbook for running and modifying VIBE locally.

---

## 21.2 Prerequisites & System Requirements
- **Node.js**: `v22.0.0` or higher (Required for native `node:sqlite` support). Verify with `node -v`.
- **NPM**: `v10.0.0` or higher.
- **Git**: `v2.40.0` or higher.
- **Operating System**: Windows 10/11, macOS 12+, or modern Linux (Ubuntu 22.04+ / Alpine).
- **RAM**: Minimum 4GB (8GB recommended).

---

## 21.3 Step-by-Step Setup from Scratch

```bash
# 1. Clone the repository
git clone https://github.com/your-org/vibe.git
cd vibe

# 2. Install all dependencies across all 7 monorepo packages
npm install

# 3. Compile all TypeScript packages in topological order
npm run build

# 4. Run the full unit and integration test suite
npm test
```
At this point, all packages in `packages/*` are compiled into their respective `dist/` folders.

---

## 21.4 Local CLI Linking: Testing Changes in Real Time
To test the CLI on your machine as if it were installed globally via npm:

```bash
# Link the CLI package globally
cd packages/cli
npm link

# Test the linked command from any terminal directory
vibe --help
```

### Developing in Watch Mode:
If you are actively modifying code in `@vibe/core`:
```bash
# In terminal 1 (Monorepo root): Recompile on save
npm run watch

# In terminal 2: Run commands in a test repo
vibe scan
```

---

## 21.5 Debugging the VS Code Extension Locally
To run and debug the VS Code extension (`packages/vscode-extension`):
1. Open the `vibe` monorepo root in Visual Studio Code or Cursor.
2. Press **`F5`** (or go to `Run and Debug` $\rightarrow$ select `Launch Extension`).
3. A new **Extension Development Host** window will open.
4. In the new window, open any TypeScript project.
5. Look at the Activity Bar: click the **VIBE** icon.
6. The 4 reactive TreeViews will load and update as you edit files!

---

## 21.6 Troubleshooting Common Developer Errors

### Error 1: `TypeError: Cannot read properties of undefined (reading 'DatabaseSync')`
- **Cause**: You are running Node 18 or Node 20. Native SQLite (`node:sqlite`) was introduced in Node 22.
- **Fix**: Upgrade Node.js:
  ```bash
  # Using nvm (Node Version Manager)
  nvm install 22
  nvm use 22
  ```

### Error 2: `vibe: The term 'vibe' is not recognized as the name of a cmdlet`
- **Cause**: Global npm bin directory is missing from your system `PATH` environment variable.
- **Fix**:
  - Run `npm config get prefix`.
  - Add that folder (on Windows: `C:\Users\<user>\AppData\Roaming\npm`) to your system `PATH`.
  - Or run the local bin script directly: `node packages/cli/dist/index.js status`.

### Error 3: `EEXIST: file already exists, symlink` during `npm link`
- **Cause**: A previous global install conflicts with your local symlink.
- **Fix**: Run `npm uninstall -g vibe-dev` or `npm link --force`.

---

## 21.7 How to Defend This in an Interview
When an interviewer asks: *"How easy is it for a new developer to get started on your project?"*

> *"I engineered the onboarding to be completely frictionless. Because I eliminated all native C++ build addons by leveraging Node 22 native SQLite, there is zero need to configure Python or C++ compilers.
>
> A developer simply clones the repository, runs `npm install`, and runs `npm run build`. The root npm workspace automatically links all 7 internal packages, and TypeScript Project References compile everything in topological order in under 12 seconds.
>
> To test the CLI locally, developers run `npm link` inside `packages/cli`, allowing them to execute `vibe` commands across any local repository in real time.
>
> And for the VS Code extension, pressing F5 launches an isolated Extension Development Host with full breakpoint debugging support."*

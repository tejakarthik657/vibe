import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";

interface Requirement {
  id: string;
  text: string;
  status: string;
  linkedFiles: string[];
}
interface Decision {
  id: string;
  title: string;
  decision: string;
  source: string;
  confidence: number;
}
interface Constraint {
  id: string;
  text: string;
  severity: string;
}
interface Task {
  id: string;
  title: string;
  status: string;
  requirementIds: string[];
}
interface VibeState {
  schemaVersion?: number;
  project: { name: string };
  requirements: Requirement[];
  decisions: Decision[];
  constraints: Constraint[];
  tasks: Task[];
  architecture?: { frameworks: string[] } | null;
}

function workspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function statePath(): string | undefined {
  const root = workspaceRoot();
  if (!root) return undefined;
  return path.join(root, ".vibe", "state.json");
}

function readState(): VibeState | undefined {
  const p = statePath();
  if (!p || !fs.existsSync(p)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return undefined;
  }
}

/**
 * Resolves the VIBE CLI executable in priority order:
 * 1. Workspace-local node_modules/.bin/vibe
 * 2. User configured path in vibe.cliPath setting
 * 3. Global vibe command in PATH
 * 4. npx fallback
 */
function resolveVibeCommand(root: string): { command: string; source: string } {
  // 1. Check workspace local node_modules/.bin
  const localBinVibe = path.join(root, "node_modules", ".bin", process.platform === "win32" ? "vibe.cmd" : "vibe");
  if (fs.existsSync(localBinVibe)) {
    return { command: `"${localBinVibe}"`, source: "workspace-local" };
  }

  // 2. User configured setting
  const configPath = vscode.workspace.getConfiguration("vibe").get<string>("cliPath");
  if (configPath && fs.existsSync(configPath)) {
    return { command: `"${configPath}"`, source: "configured" };
  }

  // 3. Global vibe in PATH
  return { command: "vibe", source: "global" };
}

class RequirementItem extends vscode.TreeItem {
  constructor(public req: Requirement, root?: string) {
    super(`${req.id}  ${req.text}`, vscode.TreeItemCollapsibleState.None);
    this.description = req.status ? req.status.toUpperCase() : "ACTIVE";
    this.tooltip = `${req.id} [${req.status}]\n${req.text}\nLinked: ${req.linkedFiles.join(", ") || "(none)"}`;
    this.iconPath = new vscode.ThemeIcon(
      req.status === "at_risk"
        ? "error"
        : req.status === "verified"
        ? "pass-filled"
        : "circle-outline"
    );

    // Click to open first linked file if available
    if (root && req.linkedFiles.length > 0) {
      const targetFile = path.join(root, req.linkedFiles[0]);
      if (fs.existsSync(targetFile)) {
        this.command = {
          command: "vscode.open",
          title: "Open File",
          arguments: [vscode.Uri.file(targetFile)],
        };
      }
    }
  }
}

class DecisionItem extends vscode.TreeItem {
  constructor(public dec: Decision) {
    super(`${dec.id}  ${dec.title}`, vscode.TreeItemCollapsibleState.None);
    const confPct = Math.round((dec.confidence ?? 0.8) * 100);
    this.description = `${dec.source} · ${confPct}% conf`;
    this.tooltip = `${dec.title}\n\n${dec.decision}`;
    this.iconPath = new vscode.ThemeIcon(dec.confidence >= 0.8 ? "lightbulb" : "lightbulb-autofix");
  }
}

class ConstraintItem extends vscode.TreeItem {
  constructor(public con: Constraint) {
    super(`${con.id}  ${con.text}`, vscode.TreeItemCollapsibleState.None);
    this.description = con.severity.toUpperCase();
    this.iconPath = new vscode.ThemeIcon(
      con.severity === "critical" ? "error" : con.severity === "warning" ? "warning" : "info"
    );
  }
}

class TaskItem extends vscode.TreeItem {
  constructor(public task: Task) {
    super(`${task.id}  ${task.title}`, vscode.TreeItemCollapsibleState.None);
    this.description = task.status.replace("_", " ").toUpperCase();
    this.tooltip = task.requirementIds.length ? `Scope: ${task.requirementIds.join(", ")}` : "";
    this.iconPath = new vscode.ThemeIcon(
      task.status === "done" ? "pass-filled" : task.status === "in_progress" ? "sync~spin" : "circle-large-outline"
    );
  }
}

class RequirementsProvider implements vscode.TreeDataProvider<RequirementItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  getTreeItem(el: RequirementItem) {
    return el;
  }
  getChildren() {
    const root = workspaceRoot();
    const state = readState();
    if (!state) return [];
    return state.requirements.map((r) => new RequirementItem(r, root));
  }
}

class DecisionsProvider implements vscode.TreeDataProvider<DecisionItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  getTreeItem(el: DecisionItem) {
    return el;
  }
  getChildren() {
    const state = readState();
    if (!state) return [];
    return state.decisions.map((d) => new DecisionItem(d));
  }
}

class ConstraintsProvider implements vscode.TreeDataProvider<ConstraintItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  getTreeItem(el: ConstraintItem) {
    return el;
  }
  getChildren() {
    const state = readState();
    if (!state) return [];
    return (state.constraints ?? []).map((c) => new ConstraintItem(c));
  }
}

class TasksProvider implements vscode.TreeDataProvider<TaskItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  getTreeItem(el: TaskItem) {
    return el;
  }
  getChildren() {
    const state = readState();
    if (!state) return [];
    return (state.tasks ?? []).map((t) => new TaskItem(t));
  }
}

function runVibe(args: string, channel: vscode.OutputChannel, onDone?: () => void) {
  const root = workspaceRoot();
  if (!root) {
    vscode.window.showErrorMessage("VIBE: No active workspace folder open.");
    return;
  }

  const { command: cliCmd, source } = resolveVibeCommand(root);
  const startTime = Date.now();

  channel.show(true);
  channel.appendLine(`\n------------------------------------------------------------`);
  channel.appendLine(`[VIBE] Executing: ${cliCmd} ${args} (${source})`);
  channel.appendLine(`[STATUS] Running...`);
  channel.appendLine(`------------------------------------------------------------`);

  const fullCmd = `${cliCmd} ${args}`;

  exec(fullCmd, { cwd: root }, (err, stdout, stderr) => {
    const duration = Date.now() - startTime;
    if (stdout) channel.append(stdout);
    if (stderr) channel.append(stderr);

    const exitCode = err ? err.code ?? 1 : 0;
    channel.appendLine(`\n------------------------------------------------------------`);
    channel.appendLine(`[STATUS] ${exitCode === 0 ? "Completed successfully" : "Failed with exit code " + exitCode} in ${duration}ms`);
    channel.appendLine(`------------------------------------------------------------\n`);

    if (err && exitCode === 2) {
      vscode.window.showWarningMessage("VIBE Guard: Commit / diff BLOCKED due to high risk or architectural findings.");
    } else if (err && exitCode !== 0) {
      vscode.window.showErrorMessage(`VIBE command failed with exit code ${exitCode}. Check output channel.`);
    }

    onDone?.();
  });
}

export function activate(context: vscode.ExtensionContext) {
  const channel = vscode.window.createOutputChannel("VIBE");

  const reqProvider = new RequirementsProvider();
  const decProvider = new DecisionsProvider();
  const conProvider = new ConstraintsProvider();
  const taskProvider = new TasksProvider();
  vscode.window.registerTreeDataProvider("vibeRequirements", reqProvider);
  vscode.window.registerTreeDataProvider("vibeDecisions", decProvider);
  vscode.window.registerTreeDataProvider("vibeConstraints", conProvider);
  vscode.window.registerTreeDataProvider("vibeTasks", taskProvider);

  const refreshAll = () => {
    reqProvider.refresh();
    decProvider.refresh();
    conProvider.refresh();
    taskProvider.refresh();
  };

  const watcherPath = statePath();
  if (watcherPath) {
    const watcher = vscode.workspace.createFileSystemWatcher(watcherPath);
    watcher.onDidChange(refreshAll);
    watcher.onDidCreate(refreshAll);
    context.subscriptions.push(watcher);
  }

  // Display version and resolution info in Output channel at startup
  const root = workspaceRoot();
  const extVersion = (context as any)?.extension?.packageJSON?.version ?? "0.4.7";
  if (root) {
    const { command: cliCmd, source } = resolveVibeCommand(root);
    exec(`${cliCmd} --version`, { cwd: root }, (err, stdout) => {
      const cliVersion = stdout ? stdout.trim() : (err ? "not found" : "unknown");
      const compat = err ? "missing" : "supported";
      channel.appendLine(`VIBE extension: ${extVersion} | CLI: ${cliVersion} (${source}) | Compatibility: ${compat}`);
    });
  } else {
    channel.appendLine(`VIBE extension: ${extVersion} | CLI resolution: none | Compatibility: supported`);
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("vibe.refresh", refreshAll),
    vscode.commands.registerCommand("vibe.scan", () => runVibe("scan", channel, refreshAll)),
    vscode.commands.registerCommand("vibe.status", () => runVibe("status", channel)),
    vscode.commands.registerCommand("vibe.doctor", () => runVibe("doctor", channel)),
    vscode.commands.registerCommand("vibe.guard", () => {
      if (root && !fs.existsSync(path.join(root, ".git"))) {
        vscode.window.showErrorMessage("VIBE Guard requires a Git repository to compute working tree diffs.");
        return;
      }
      runVibe("guard", channel);
    }),
    vscode.commands.registerCommand("vibe.impact", async () => {
      const activeEditor = vscode.window.activeTextEditor;
      const file = activeEditor ? activeEditor.document.fileName : await vscode.window.showInputBox({ prompt: "File path to analyze impact for" });
      if (file) runVibe(`impact "${file}"`, channel);
    }),
    vscode.commands.registerCommand("vibe.drift", () => {
      const state = readState();
      if (!state?.architecture) {
        vscode.window.showInformationMessage("No architecture declared yet. Run `VIBE: Bootstrap Architecture Presets` first.");
      }
      runVibe("drift", channel);
    }),
    vscode.commands.registerCommand("vibe.checkpoint", () => runVibe("checkpoint", channel, refreshAll)),
    vscode.commands.registerCommand("vibe.explain", () => runVibe("explain", channel)),
    vscode.commands.registerCommand("vibe.context", async () => {
      const task = await vscode.window.showInputBox({ prompt: "Task to scope context for (e.g. 'implement OAuth authentication')" });
      if (task) runVibe(`context "${task.replace(/"/g, '\\"')}"`, channel);
    }),
    vscode.commands.registerCommand("vibe.decisions", () => runVibe("decisions", channel)),
    vscode.commands.registerCommand("vibe.acceptDecision", async () => {
      const decId = await vscode.window.showInputBox({ prompt: "Decision ID to override (e.g. DEC-004)" });
      if (!decId) return;
      const reason = await vscode.window.showInputBox({ prompt: "Reason for override" });
      if (!reason) return;
      runVibe(`override ${decId} -r "${reason.replace(/"/g, '\\"')}"`, channel, refreshAll);
    }),
    vscode.commands.registerCommand("vibe.testProviders", () => runVibe("test-providers", channel)),
    vscode.commands.registerCommand("vibe.migrateStorage", () => runVibe("migrate-storage", channel, refreshAll)),
    vscode.commands.registerCommand("vibe.configShow", () => runVibe("config show", channel)),
    vscode.commands.registerCommand("vibe.trace", async () => {
      const activeEditor = vscode.window.activeTextEditor;
      let defaultSymbol = "";
      if (activeEditor) {
        const sel = activeEditor.selection;
        defaultSymbol = activeEditor.document.getText(sel).trim();
      }
      const symbol = await vscode.window.showInputBox({ prompt: "Symbol, route, or requirement to trace across graph", value: defaultSymbol });
      if (symbol) runVibe(`trace "${symbol.replace(/"/g, '\\"')}"`, channel);
    }),
    vscode.commands.registerCommand("vibe.why", async () => {
      const activeEditor = vscode.window.activeTextEditor;
      const file = activeEditor ? activeEditor.document.fileName : await vscode.window.showInputBox({ prompt: "File path or symbol to explain" });
      if (file) runVibe(`why "${file.replace(/"/g, '\\"')}"`, channel);
    }),
    vscode.commands.registerCommand("vibe.onboard", () => runVibe("onboard", channel)),
    vscode.commands.registerCommand("vibe.bootstrap", () => runVibe("bootstrap", channel, refreshAll)),

    vscode.commands.registerCommand("vibe.addRequirement", async () => {
      const text = await vscode.window.showInputBox({ prompt: "Requirement text" });
      if (!text) return;
      runVibe(`requirement add "${text.replace(/"/g, '\\"')}"`, channel, refreshAll);
    }),

    vscode.commands.registerCommand("vibe.addDecision", async () => {
      const title = await vscode.window.showInputBox({ prompt: "Decision title" });
      if (!title) return;
      const ctx = await vscode.window.showInputBox({ prompt: "Context (why did this come up?)" });
      if (ctx === undefined) return;
      const decision = await vscode.window.showInputBox({ prompt: "What was decided?" });
      if (decision === undefined) return;
      const args = `decision add "${title.replace(/"/g, '\\"')}" -c "${ctx.replace(/"/g, '\\"')}" -d "${decision.replace(/"/g, '\\"')}"`;
      runVibe(args, channel, refreshAll);
    }),

    vscode.commands.registerCommand("vibe.addConstraint", async () => {
      const text = await vscode.window.showInputBox({ prompt: "Constraint text" });
      if (!text) return;
      runVibe(`constraint add "${text.replace(/"/g, '\\"')}"`, channel, refreshAll);
    }),

    vscode.commands.registerCommand("vibe.addTask", async () => {
      const title = await vscode.window.showInputBox({ prompt: "Task title" });
      if (!title) return;
      runVibe(`task add "${title.replace(/"/g, '\\"')}"`, channel, refreshAll);
    })
  );
}

export function deactivate() {}

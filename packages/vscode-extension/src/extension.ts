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
  project: { name: string };
  requirements: Requirement[];
  decisions: Decision[];
  constraints: Constraint[];
  tasks: Task[];
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

class RequirementItem extends vscode.TreeItem {
  constructor(public req: Requirement) {
    super(`${req.id}  ${req.text}`, vscode.TreeItemCollapsibleState.None);
    this.description = req.status;
    this.tooltip = `${req.id}\nLinked files: ${req.linkedFiles.join(", ") || "(none)"}`;
    this.iconPath = new vscode.ThemeIcon(
      req.status === "at_risk" ? "warning" : req.status === "verified" ? "check" : "circle-outline"
    );
  }
}

class DecisionItem extends vscode.TreeItem {
  constructor(public dec: Decision) {
    super(`${dec.id}  ${dec.title}`, vscode.TreeItemCollapsibleState.None);
    this.description = `${dec.source} · conf ${dec.confidence}`;
    this.tooltip = dec.decision;
    this.iconPath = new vscode.ThemeIcon("lightbulb");
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
    const state = readState();
    if (!state) return [];
    return state.requirements.map((r) => new RequirementItem(r));
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

class ConstraintItem extends vscode.TreeItem {
  constructor(public con: Constraint) {
    super(`${con.id}  ${con.text}`, vscode.TreeItemCollapsibleState.None);
    this.description = con.severity;
    this.iconPath = new vscode.ThemeIcon(con.severity === "critical" ? "error" : con.severity === "warning" ? "warning" : "info");
  }
}

class TaskItem extends vscode.TreeItem {
  constructor(public task: Task) {
    super(`${task.id}  ${task.title}`, vscode.TreeItemCollapsibleState.None);
    this.description = task.status;
    this.tooltip = task.requirementIds.length ? `Scope: ${task.requirementIds.join(", ")}` : "";
    this.iconPath = new vscode.ThemeIcon(
      task.status === "done" ? "pass-filled" : task.status === "in_progress" ? "sync" : "circle-large-outline"
    );
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
    vscode.window.showErrorMessage("VIBE: no workspace folder open.");
    return;
  }
  channel.show(true);
  channel.appendLine(`$ vibe ${args}`);
  // Prefer a locally installed CLI (npx will resolve node_modules/.bin or fall back to registry)
  exec(`npx --yes vibe-dev ${args}`, { cwd: root }, (err, stdout, stderr) => {
    if (stdout) channel.append(stdout);
    if (stderr) channel.append(stderr);
    if (err) channel.appendLine(`\n[exit code ${err.code}]`);
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

  context.subscriptions.push(
    vscode.commands.registerCommand("vibe.refresh", refreshAll),

    vscode.commands.registerCommand("vibe.scan", () => runVibe("scan", channel, refreshAll)),

    vscode.commands.registerCommand("vibe.doctor", () => runVibe("doctor", channel)),

    vscode.commands.registerCommand("vibe.guard", () => runVibe("guard", channel)),

    vscode.commands.registerCommand("vibe.drift", () => runVibe("drift", channel)),

    vscode.commands.registerCommand("vibe.checkpoint", () => runVibe("checkpoint", channel, refreshAll)),

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
    })
  );
}

export function deactivate() {}

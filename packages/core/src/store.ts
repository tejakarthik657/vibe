import * as fs from "fs";
import * as path from "path";
import { VibeState } from "./types";

const VIBE_DIR = ".vibe";
const STATE_FILE = "state.json";

function emptyState(name: string): VibeState {
  return {
    project: {
      name,
      description: "",
      createdAt: new Date().toISOString(),
    },
    requirements: [],
    decisions: [],
    constraints: [],
    tasks: [],
    nodes: [],
    edges: [],
    lastScan: null,
    architecture: null,
    snapshots: [],
  };
}

export class VibeStore {
  private root: string;
  private statePath: string;
  private state: VibeState;

  constructor(root: string) {
    this.root = root;
    this.statePath = path.join(root, VIBE_DIR, STATE_FILE);
    this.state = this.load();
  }

  static exists(root: string): boolean {
    return fs.existsSync(path.join(root, VIBE_DIR, STATE_FILE));
  }

  static init(root: string, projectName: string): VibeStore {
    const dir = path.join(root, VIBE_DIR);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const store = new VibeStore(root);
    store.state = emptyState(projectName);
    store.save();
    return store;
  }

  private load(): VibeState {
    if (!fs.existsSync(this.statePath)) {
      return emptyState(path.basename(this.root));
    }
    const raw = fs.readFileSync(this.statePath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<VibeState>;
    // Backward-compat: fill in fields added in later versions if loading an older state.json
    return {
      ...emptyState(parsed.project?.name ?? path.basename(this.root)),
      ...parsed,
      architecture: parsed.architecture ?? null,
      snapshots: parsed.snapshots ?? [],
      constraints: parsed.constraints ?? [],
      tasks: parsed.tasks ?? [],
    };
  }

  save(): void {
    const dir = path.dirname(this.statePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.statePath, JSON.stringify(this.state, null, 2), "utf-8");
  }

  get(): VibeState {
    return this.state;
  }

  set(state: VibeState): void {
    this.state = state;
  }
}

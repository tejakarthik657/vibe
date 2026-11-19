import * as fs from "fs";
import * as path from "path";
import { VibeState } from "./types";

const VIBE_DIR = ".vibe";
const STATE_FILE = "state.json";
const LOCK_FILE = ".lock";
const CURRENT_SCHEMA_VERSION = 1;

function emptyState(name: string): VibeState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
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

export class VibeLock {
  private lockPath: string;

  constructor(root: string) {
    this.lockPath = path.join(root, VIBE_DIR, LOCK_FILE);
  }

  public acquire(timeoutMs = 15000): boolean {
    const dir = path.dirname(this.lockPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(this.lockPath)) {
      try {
        const raw = fs.readFileSync(this.lockPath, "utf-8");
        const lockInfo = JSON.parse(raw);
        const age = Date.now() - (lockInfo.timestamp || 0);

        // If lock is younger than timeout and PID is active, another command is running
        if (age < timeoutMs) {
          return false;
        }
      } catch {
        /* invalid lock file, overwrite */
      }
    }

    try {
      const lockData = {
        pid: process.pid,
        timestamp: Date.now(),
      };
      fs.writeFileSync(this.lockPath, JSON.stringify(lockData), "utf-8");
      return true;
    } catch {
      return false;
    }
  }

  public release(): void {
    if (fs.existsSync(this.lockPath)) {
      try {
        fs.unlinkSync(this.lockPath);
      } catch {
        /* best effort */
      }
    }
  }
}

export class VibeStore {
  private root: string;
  private statePath: string;
  private state: VibeState;
  private lock: VibeLock;

  constructor(root: string) {
    this.root = root;
    this.statePath = path.join(root, VIBE_DIR, STATE_FILE);
    this.lock = new VibeLock(root);
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

  public backup(label?: string): string {
    const dir = path.join(this.root, VIBE_DIR, "snapshots");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const name = `backup-${label ? label + "-" : ""}${timestamp}.json`;
    const backupPath = path.join(dir, name);
    fs.writeFileSync(backupPath, JSON.stringify(this.state, null, 2), "utf-8");
    return backupPath;
  }

  private load(): VibeState {
    if (!fs.existsSync(this.statePath)) {
      return emptyState(path.basename(this.root));
    }
    try {
      const raw = fs.readFileSync(this.statePath, "utf-8");
      const parsed = JSON.parse(raw) as Partial<VibeState>;

      // Auto-migrate if schemaVersion is missing or outdated
      const schemaVersion = parsed.schemaVersion || 1;
      const state: VibeState = {
        ...emptyState(parsed.project?.name ?? path.basename(this.root)),
        ...parsed,
        schemaVersion,
        architecture: parsed.architecture ?? null,
        snapshots: parsed.snapshots ?? [],
        constraints: parsed.constraints ?? [],
        tasks: parsed.tasks ?? [],
      };
      return state;
    } catch {
      return emptyState(path.basename(this.root));
    }
  }

  /**
   * Atomic file write: writes to temp file, validates JSON, and atomically renames.
   */
  save(): void {
    const dir = path.dirname(this.statePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const tempPath = `${this.statePath}.tmp.${Date.now()}`;
    const payload = JSON.stringify(this.state, null, 2);

    try {
      // 1. Write to temporary file
      fs.writeFileSync(tempPath, payload, "utf-8");

      // 2. Validate written contents
      const verification = JSON.parse(fs.readFileSync(tempPath, "utf-8"));
      if (!verification.project) {
        throw new Error("Verification failed: corrupted state payload");
      }

      // 3. Atomic rename
      fs.renameSync(tempPath, this.statePath);
    } catch (err) {
      if (fs.existsSync(tempPath)) {
        try {
          fs.unlinkSync(tempPath);
        } catch {
          /* ignore */
        }
      }
      throw err;
    }
  }

  public migrate(targetVersion = CURRENT_SCHEMA_VERSION): { fromVersion: number; toVersion: number; backupPath: string } {
    const currentVersion = this.state.schemaVersion || 1;
    const backupPath = this.backup(`v${currentVersion}-to-v${targetVersion}`);

    const preReqs = this.state.requirements.length;
    const preDecs = this.state.decisions.length;

    // Apply schema migrations
    this.state.schemaVersion = targetVersion;
    if (!this.state.constraints) this.state.constraints = [];
    if (!this.state.tasks) this.state.tasks = [];
    if (!this.state.snapshots) this.state.snapshots = [];

    // Save atomically
    this.save();

    // Verify record counts
    if (this.state.requirements.length !== preReqs || this.state.decisions.length !== preDecs) {
      throw new Error("Migration integrity error: record count mismatch after migration!");
    }

    return { fromVersion: currentVersion, toVersion: targetVersion, backupPath };
  }

  get(): VibeState {
    return this.state;
  }

  set(state: VibeState): void {
    this.state = state;
  }
}

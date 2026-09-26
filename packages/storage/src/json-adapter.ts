import * as fs from "fs";
import * as path from "path";
import { DecisionLogRecord, StorageAdapter } from "./interfaces/storage-adapter";

export class JSONStorageAdapter implements StorageAdapter {
  public name = "json";
  private vibeDir: string;
  private statePath: string;
  private decisionsPath: string;

  constructor(rootPath: string) {
    this.vibeDir = path.join(rootPath, ".vibe");
    this.statePath = path.join(this.vibeDir, "state.json");
    this.decisionsPath = path.join(this.vibeDir, "decisions.json");
  }

  public async initialize(): Promise<void> {
    if (!fs.existsSync(this.vibeDir)) {
      fs.mkdirSync(this.vibeDir, { recursive: true });
    }
  }

  public async close(): Promise<void> {
    // No-op for JSON file adapter
  }

  public async saveState(state: any): Promise<void> {
    await this.initialize();
    fs.writeFileSync(this.statePath, JSON.stringify(state, null, 2), "utf-8");
  }

  public async loadState(): Promise<any> {
    if (!fs.existsSync(this.statePath)) return null;
    try {
      return JSON.parse(fs.readFileSync(this.statePath, "utf-8"));
    } catch {
      return null;
    }
  }

  public async logDecision(record: DecisionLogRecord): Promise<void> {
    await this.initialize();
    const logs = await this.getDecisionLogs();
    const existingIdx = logs.findIndex((l) => l.id === record.id);
    if (existingIdx >= 0) {
      logs[existingIdx] = record;
    } else {
      logs.push(record);
    }
    fs.writeFileSync(this.decisionsPath, JSON.stringify(logs, null, 2), "utf-8");
  }

  public async getDecisionLogs(): Promise<DecisionLogRecord[]> {
    if (!fs.existsSync(this.decisionsPath)) return [];
    try {
      return JSON.parse(fs.readFileSync(this.decisionsPath, "utf-8"));
    } catch {
      return [];
    }
  }

  public async getDecisionLog(id: string): Promise<DecisionLogRecord | null> {
    const logs = await this.getDecisionLogs();
    return logs.find((l) => l.id === id) || null;
  }

  public async saveOverride(id: string, overrideData: { acceptedBy: string; reason: string; timestamp: string }): Promise<boolean> {
    const logs = await this.getDecisionLogs();
    const rec = logs.find((l) => l.id === id);
    if (!rec) return false;
    rec.override = overrideData;
    rec.resolvedAction = "ALLOW";
    fs.writeFileSync(this.decisionsPath, JSON.stringify(logs, null, 2), "utf-8");
    return true;
  }
}

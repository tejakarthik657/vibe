import * as fs from "fs";
import * as path from "path";
import { DecisionLogRecord, StorageAdapter } from "./interfaces/storage-adapter";

export class SQLiteStorageAdapter implements StorageAdapter {
  public name = "sqlite";
  private dbPath: string;
  private vibeDir: string;
  private db: any = null;

  constructor(rootPath: string) {
    this.vibeDir = path.join(rootPath, ".vibe");
    this.dbPath = path.join(this.vibeDir, "vibe.db");
  }

  public async initialize(): Promise<void> {
    if (!fs.existsSync(this.vibeDir)) {
      fs.mkdirSync(this.vibeDir, { recursive: true });
    }

    try {
      const { DatabaseSync } = require("node:sqlite");
      this.db = new DatabaseSync(this.dbPath);
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS project_state (
          id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS decision_logs (
          id TEXT PRIMARY KEY,
          request_id TEXT NOT NULL,
          provider TEXT NOT NULL,
          calculated_confidence REAL NOT NULL,
          confidence_level TEXT NOT NULL,
          resolved_action TEXT NOT NULL,
          request_json TEXT NOT NULL,
          result_json TEXT NOT NULL,
          override_json TEXT,
          timestamp TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS engineering_graph (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          source TEXT NOT NULL,
          target TEXT NOT NULL,
          metadata_json TEXT
        );
      `);
    } catch (err) {
      // Fallback if node:sqlite throws unexpected error
      console.warn("[WARN] SQLiteStorageAdapter fallback warning:", err);
    }
  }

  public async close(): Promise<void> {
    if (this.db && typeof this.db.close === "function") {
      this.db.close();
      this.db = null;
    }
  }

  public async saveState(state: any): Promise<void> {
    await this.initialize();
    if (!this.db) return;
    const stmt = this.db.prepare(`
      INSERT INTO project_state (id, data, updated_at)
      VALUES ('current', ?, ?)
      ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at
    `);
    stmt.run(JSON.stringify(state), new Date().toISOString());
  }

  public async loadState(): Promise<any> {
    await this.initialize();
    if (!this.db) return null;
    const stmt = this.db.prepare("SELECT data FROM project_state WHERE id = 'current'");
    const row = stmt.get();
    if (!row || !row.data) return null;
    try {
      return JSON.parse(row.data);
    } catch {
      return null;
    }
  }

  public async logDecision(record: DecisionLogRecord): Promise<void> {
    await this.initialize();
    if (!this.db) return;
    const stmt = this.db.prepare(`
      INSERT INTO decision_logs (
        id, request_id, provider, calculated_confidence, confidence_level, resolved_action, request_json, result_json, override_json, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        provider=excluded.provider,
        calculated_confidence=excluded.calculated_confidence,
        confidence_level=excluded.confidence_level,
        resolved_action=excluded.resolved_action,
        request_json=excluded.request_json,
        result_json=excluded.result_json,
        override_json=excluded.override_json,
        timestamp=excluded.timestamp
    `);

    stmt.run(
      record.id,
      record.request.id,
      record.result.provider,
      record.calculatedConfidence,
      record.confidenceLevel,
      record.resolvedAction,
      JSON.stringify(record.request),
      JSON.stringify(record.result),
      record.override ? JSON.stringify(record.override) : null,
      record.timestamp
    );
  }

  public async getDecisionLogs(): Promise<DecisionLogRecord[]> {
    await this.initialize();
    if (!this.db) return [];
    const stmt = this.db.prepare("SELECT * FROM decision_logs ORDER BY timestamp DESC");
    const rows = stmt.all();
    return rows.map((r: any) => ({
      id: r.id,
      request: JSON.parse(r.request_json),
      result: JSON.parse(r.result_json),
      calculatedConfidence: r.calculated_confidence,
      confidenceLevel: r.confidence_level,
      resolvedAction: r.resolved_action,
      override: r.override_json ? JSON.parse(r.override_json) : undefined,
      timestamp: r.timestamp,
    }));
  }

  public async getDecisionLog(id: string): Promise<DecisionLogRecord | null> {
    await this.initialize();
    if (!this.db) return null;
    const stmt = this.db.prepare("SELECT * FROM decision_logs WHERE id = ?");
    const r = stmt.get(id);
    if (!r) return null;
    return {
      id: r.id,
      request: JSON.parse(r.request_json),
      result: JSON.parse(r.result_json),
      calculatedConfidence: r.calculated_confidence,
      confidenceLevel: r.confidence_level,
      resolvedAction: r.resolved_action,
      override: r.override_json ? JSON.parse(r.override_json) : undefined,
      timestamp: r.timestamp,
    };
  }

  public async saveOverride(id: string, overrideData: { acceptedBy: string; reason: string; timestamp: string }): Promise<boolean> {
    await this.initialize();
    if (!this.db) return false;
    const rec = await this.getDecisionLog(id);
    if (!rec) return false;
    rec.override = overrideData;
    rec.resolvedAction = "ALLOW";
    await this.logDecision(rec);
    return true;
  }
}

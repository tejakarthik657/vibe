import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  DecisionLogRecord,
  DecisionRequest,
  DecisionResult,
  HumanOverrideRecord,
} from "vibe-dev-decision-core";
import { evaluatePolicy } from "./policy";
import { getConfidenceLevel } from "./confidence";
import { getStorageAdapter, StorageAdapter } from "vibe-dev-storage";

export class DecisionStore {
  private root: string;
  private storage: StorageAdapter;
  private logPath: string;

  constructor(root: string) {
    this.root = root;
    const vibeDir = path.join(root, ".vibe");
    if (!fs.existsSync(vibeDir)) {
      fs.mkdirSync(vibeDir, { recursive: true });
    }
    this.logPath = path.join(vibeDir, "decisions.json");
    this.storage = getStorageAdapter(root);
  }

  public getLogs(): DecisionLogRecord[] {
    if (!fs.existsSync(this.logPath)) return [];
    try {
      const content = fs.readFileSync(this.logPath, "utf-8");
      return JSON.parse(content) as DecisionLogRecord[];
    } catch {
      return [];
    }
  }

  public logDecision(request: DecisionRequest, result: DecisionResult): DecisionLogRecord {
    const logs = this.getLogs();
    const policyResult = evaluatePolicy(request, result);
    
    const record: DecisionLogRecord = {
      id: `DEC-${String(logs.length + 1).padStart(3, "0")}`,
      request,
      result,
      calculatedConfidence: policyResult.finalConfidence,
      confidenceLevel: getConfidenceLevel(policyResult.finalConfidence),
      resolvedAction: policyResult.action,
      timestamp: new Date().toISOString(),
    };

    logs.push(record);
    fs.writeFileSync(this.logPath, JSON.stringify(logs, null, 2), "utf-8");

    // Persist asynchronously to SQLiteStorageAdapter as well
    this.storage.logDecision(record as any).catch(() => {});

    return record;
  }

  public recordOverride(
    decisionId: string,
    userAction: "ALLOW" | "BLOCK",
    reason: string,
    overrideBy: string = "developer",
    adrId?: string
  ): DecisionLogRecord | null {
    const logs = this.getLogs();
    const record = logs.find((r) => r.id === decisionId);
    if (!record) return null;

    const override: HumanOverrideRecord = {
      id: uuidv4(),
      decisionId,
      originalAction: record.resolvedAction,
      userAction,
      reason,
      overrideBy,
      timestamp: new Date().toISOString(),
      adrId,
    };

    record.override = override;
    record.resolvedAction = "ALLOW";
    fs.writeFileSync(this.logPath, JSON.stringify(logs, null, 2), "utf-8");

    this.storage.saveOverride(decisionId, { acceptedBy: overrideBy, reason, timestamp: override.timestamp }).catch(() => {});

    return record;
  }
}

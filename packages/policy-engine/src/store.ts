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

export class DecisionStore {
  private logPath: string;

  constructor(root: string) {
    const vibeDir = path.join(root, ".vibe");
    if (!fs.existsSync(vibeDir)) {
      fs.mkdirSync(vibeDir, { recursive: true });
    }
    this.logPath = path.join(vibeDir, "decisions.json");
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
    fs.writeFileSync(this.logPath, JSON.stringify(logs, null, 2), "utf-8");
    return record;
  }
}

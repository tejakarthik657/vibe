import { DecisionRequest, DecisionResult } from "vibe-dev-decision-core";

export interface DecisionLogRecord {
  id: string;
  request: DecisionRequest;
  result: DecisionResult;
  calculatedConfidence: number;
  confidenceLevel: string;
  resolvedAction: string;
  override?: {
    acceptedBy: string;
    reason: string;
    timestamp: string;
  };
  timestamp: string;
}

export interface StorageAdapter {
  name: string;
  initialize(): Promise<void>;
  close(): Promise<void>;
  saveState(state: any): Promise<void>;
  loadState(): Promise<any>;
  logDecision(record: DecisionLogRecord): Promise<void>;
  getDecisionLogs(): Promise<DecisionLogRecord[]>;
  getDecisionLog(id: string): Promise<DecisionLogRecord | null>;
  saveOverride(id: string, overrideData: { acceptedBy: string; reason: string; timestamp: string }): Promise<boolean>;
}

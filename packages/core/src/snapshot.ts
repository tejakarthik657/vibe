import * as fs from "fs";
import * as path from "path";
import { v4 as uuid } from "uuid";
import { EngineeringSnapshot, VibeState } from "./types";
import { runDoctor, DoctorFinding } from "./doctor";

export function createSnapshot(root: string, state: VibeState): { snapshot: EngineeringSnapshot; findings: DoctorFinding[] } {
  const findings = runDoctor(root, state);
  const snapshot: EngineeringSnapshot = {
    id: `CKPT-${String(state.snapshots.length + 1).padStart(3, "0")}`,
    createdAt: new Date().toISOString(),
    requirementCount: state.requirements.length,
    decisionCount: state.decisions.length,
    taskCount: state.tasks.length,
    constraintCount: state.constraints.length,
    criticalFindings: findings.filter((f) => f.severity === "critical").length,
    highFindings: findings.filter((f) => f.severity === "high").length,
    totalFindings: findings.length,
    fileCount: state.lastScan?.files.length ?? 0,
    moduleCount: state.lastScan?.modules.length ?? 0,
  };
  state.snapshots.push(snapshot);

  const dir = path.join(root, ".vibe", "snapshots");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${snapshot.id}-${uuid().slice(0, 8)}.json`);
  fs.writeFileSync(filePath, JSON.stringify({ snapshot, findings }, null, 2), "utf-8");

  return { snapshot, findings };
}

export function listSnapshots(state: VibeState): EngineeringSnapshot[] {
  return state.snapshots;
}

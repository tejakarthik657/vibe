import { Constraint, VibeState } from "./types";
import { addNode } from "./graph";

export function addConstraint(
  state: VibeState,
  text: string,
  severity: Constraint["severity"] = "warning"
): Constraint {
  const constraint: Constraint = {
    id: `CON-${String(state.constraints.length + 1).padStart(3, "0")}`,
    text,
    severity,
    createdAt: new Date().toISOString(),
  };
  state.constraints.push(constraint);
  addNode(state, "Constraint", constraint.id, { text, severity });
  return constraint;
}

export function listConstraints(state: VibeState): Constraint[] {
  return state.constraints;
}

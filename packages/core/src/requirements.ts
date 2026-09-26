import { v4 as uuid } from "uuid";
import { Requirement, VibeState } from "./types";
import { addNode, addEdge } from "./graph";

export function addRequirement(state: VibeState, text: string, tags: string[] = []): Requirement {
  const req: Requirement = {
    id: `REQ-${String(state.requirements.length + 1).padStart(3, "0")}`,
    text,
    tags,
    linkedFiles: [],
    createdAt: new Date().toISOString(),
    status: "active",
  };
  state.requirements.push(req);
  addNode(state, "Requirement", req.id, { text, tags });
  return req;
}

export function linkRequirementToFile(state: VibeState, reqId: string, filePath: string): boolean {
  const req = state.requirements.find((r) => r.id === reqId);
  if (!req) return false;
  if (!req.linkedFiles.includes(filePath)) req.linkedFiles.push(filePath);

  const reqNode = state.nodes.find((n) => n.type === "Requirement" && n.label === reqId);
  const fileNode = state.nodes.find((n) => n.type === "File" && n.label === filePath);
  if (reqNode && fileNode) {
    addEdge(state, reqNode.id, fileNode.id, "IMPLEMENTED_BY");
  }
  return true;
}

export function listRequirements(state: VibeState): Requirement[] {
  return state.requirements;
}

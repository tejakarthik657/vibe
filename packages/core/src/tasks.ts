import { Task, VibeState } from "./types";
import { addNode, addEdge } from "./graph";

export function addTask(
  state: VibeState,
  title: string,
  description: string,
  requirementIds: string[] = []
): Task {
  const task: Task = {
    id: `TASK-${String(state.tasks.length + 1).padStart(3, "0")}`,
    title,
    description,
    requirementIds,
    status: "todo",
    createdAt: new Date().toISOString(),
  };
  state.tasks.push(task);
  const taskNode = addNode(state, "Task", task.id, { title, description });

  for (const reqId of requirementIds) {
    const reqNode = state.nodes.find((n) => n.type === "Requirement" && n.label === reqId);
    if (reqNode) addEdge(state, taskNode.id, reqNode.id, "LINKED_TO");
  }
  return task;
}

export function setTaskStatus(state: VibeState, taskId: string, status: Task["status"]): boolean {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return false;
  task.status = status;
  return true;
}

export function listTasks(state: VibeState): Task[] {
  return state.tasks;
}

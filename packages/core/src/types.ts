export type NodeType =
  | "Module"
  | "File"
  | "Function"
  | "Class"
  | "Requirement"
  | "Decision"
  | "Task"
  | "Constraint"
  | "Test";

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  meta?: Record<string, unknown>;
}

export type EdgeType =
  | "CONTAINS"
  | "DEPENDS_ON"
  | "IMPLEMENTED_BY"
  | "VERIFIED_BY"
  | "AFFECTS"
  | "LINKED_TO";

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  type: EdgeType;
}

export interface Requirement {
  id: string;
  text: string;
  tags: string[];
  linkedFiles: string[];
  createdAt: string;
  status: "proposed" | "active" | "verified" | "at_risk";
  evidence?: {
    protectedRoutes?: number;
    authenticatedRoutes?: number;
    orgScopedRoutes?: number;
    crossTenantTests?: number;
    verifyingTests?: string[];
  };
}

export interface Decision {
  id: string;
  title: string;
  context: string;
  decision: string;
  consequences: string;
  source: "developer" | "inferred";
  confidence: number; // 0-1
  createdAt: string;
}

export interface Constraint {
  id: string;
  text: string;
  severity: "info" | "warning" | "critical";
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  requirementIds: string[];
  status: "todo" | "in_progress" | "done";
  createdAt: string;
}

export interface FileRecord {
  path: string;
  language: string;
  lines: number;
  imports: string[];
  exportsFunctions: string[];
  exportsClasses: string[];
  module: string;
}

export interface TechnologyRecord {
  technology: string;
  role: "framework" | "database" | "ai" | "task-queue" | "tool" | "infrastructure";
  evidence: string[];
  confidence: number;
}

export interface ProjectModel {
  languages: Record<string, number>;
  frameworks: string[];
  technologies?: TechnologyRecord[];
  modules: string[];
  files: FileRecord[];
  scannedAt: string;
  scanConfidence?: number;
}

export interface ProjectConfig {
  name: string;
  description: string;
  createdAt: string;
}

export interface DeclaredArchitecture {
  frameworks: string[];
  database?: string;
  notes?: string;
  setAt: string;
}

export interface EngineeringSnapshot {
  id: string;
  createdAt: string;
  requirementCount: number;
  decisionCount: number;
  taskCount: number;
  constraintCount: number;
  criticalFindings: number;
  highFindings: number;
  totalFindings: number;
  fileCount: number;
  moduleCount: number;
}

export interface VibeState {
  schemaVersion?: number;
  project: ProjectConfig;
  requirements: Requirement[];
  decisions: Decision[];
  constraints: Constraint[];
  tasks: Task[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  lastScan: ProjectModel | null;
  architecture: DeclaredArchitecture | null;
  snapshots: EngineeringSnapshot[];
}

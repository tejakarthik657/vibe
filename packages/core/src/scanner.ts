import * as fs from "fs";
import * as path from "path";
import fg from "fast-glob";
import * as ts from "typescript";
import { FileRecord, ProjectModel, TechnologyRecord } from "./types";
import { IgnoreEngine, DEFAULT_IGNORE_PATTERNS, normalizePath } from "./ignore";

const LANGUAGE_BY_EXT: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".py": "Python",
  ".java": "Java",
  ".go": "Go",
  ".rs": "Rust",
  ".rb": "Ruby",
  ".php": "PHP",
  ".cs": "C#",
  ".cpp": "C++",
  ".c": "C",
  ".kt": "Kotlin",
  ".swift": "Swift",
};

const FRAMEWORK_DEPENDENCY_MAP: Record<string, { name: string; role: TechnologyRecord["role"] }> = {
  react: { name: "React", role: "framework" },
  next: { name: "Next.js", role: "framework" },
  vue: { name: "Vue", role: "framework" },
  "@angular/core": { name: "Angular", role: "framework" },
  svelte: { name: "Svelte", role: "framework" },
  express: { name: "Express", role: "framework" },
  "@nestjs/core": { name: "NestJS", role: "framework" },
  fastify: { name: "Fastify", role: "framework" },
  django: { name: "Django", role: "framework" },
  flask: { name: "Flask", role: "framework" },
  fastapi: { name: "FastAPI", role: "framework" },
  "spring-boot": { name: "Spring Boot", role: "framework" },
  rails: { name: "Ruby on Rails", role: "framework" },
  vite: { name: "Vite", role: "tool" },
};

export function detectTechnologies(root: string): TechnologyRecord[] {
  const records = new Map<string, TechnologyRecord>();

  const addTech = (
    name: string,
    role: TechnologyRecord["role"],
    evidence: string,
    confidence = 0.95
  ) => {
    const existing = records.get(name);
    if (existing) {
      if (!existing.evidence.includes(evidence)) existing.evidence.push(evidence);
      existing.confidence = Math.max(existing.confidence, confidence);
    } else {
      records.set(name, { technology: name, role, evidence: [evidence], confidence });
    }
  };

  // 1. Scan package.json files (root and subdirectories up to 3 levels deep)
  try {
    const pkgFiles = fg.sync(["**/package.json"], {
      cwd: root,
      ignore: DEFAULT_IGNORE_PATTERNS,
      deep: 4,
    });
    for (const pkgRel of pkgFiles) {
      try {
        const pkgContent = fs.readFileSync(path.join(root, pkgRel), "utf-8");
        const pkg = JSON.parse(pkgContent);
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        for (const dep of Object.keys(deps)) {
          if (FRAMEWORK_DEPENDENCY_MAP[dep]) {
            const def = FRAMEWORK_DEPENDENCY_MAP[dep];
            addTech(def.name, def.role, pkgRel, 0.95);
          }
        }
      } catch {
        /* skip */
      }
    }
  } catch {
    /* skip */
  }

  // 2. Python requirements.txt or pyproject.toml
  const checkPythonDep = (dep: string, source: string) => {
    const lower = dep.toLowerCase();
    if (lower.includes("fastapi")) addTech("FastAPI", "framework", source, 0.98);
    if (lower.includes("django")) addTech("Django", "framework", source, 0.98);
    if (lower.includes("flask")) addTech("Flask", "framework", source, 0.98);

    // Databases: Normalized deduplicated records
    if (lower.includes("psycopg2") || lower.includes("asyncpg")) {
      addTech("PostgreSQL", "database", source, 0.98);
    }
    if (lower.includes("sqlalchemy")) {
      addTech("PostgreSQL", "database", source, 0.9);
      addTech("SQLAlchemy", "tool", source, 0.95);
    }
    if (lower.includes("redis")) addTech("Redis", "database", source, 0.95);
    if (lower.includes("qdrant-client")) addTech("Qdrant", "database", source, 0.95);
    if (lower.includes("motor") || lower.includes("pymongo")) addTech("MongoDB", "database", source, 0.95);

    // AI & LLM
    if (lower.includes("anthropic")) addTech("Anthropic/Claude", "ai", source, 0.95);
    if (lower.includes("openai")) addTech("OpenAI", "ai", source, 0.95);
    if (lower.includes("voyageai")) addTech("Voyage AI", "ai", source, 0.95);
    if (lower.includes("groq")) addTech("Groq", "ai", source, 0.95);
    if (lower.includes("langchain")) addTech("LangChain", "ai", source, 0.95);
    if (lower.includes("transformers")) addTech("Transformers", "ai", source, 0.95);

    // Task queues
    if (lower.includes("celery")) addTech("Celery", "task-queue", source, 0.95);
    if (lower.includes("dramatiq")) addTech("Dramatiq", "task-queue", source, 0.95);
    if (lower.includes("rq")) addTech("RQ", "task-queue", source, 0.95);
  };

  const reqPath = path.join(root, "requirements.txt");
  if (fs.existsSync(reqPath)) {
    try {
      const text = fs.readFileSync(reqPath, "utf-8");
      for (const line of text.split("\n")) {
        const clean = line.trim();
        if (clean && !clean.startsWith("#")) checkPythonDep(clean, "requirements.txt");
      }
    } catch {
      /* skip */
    }
  }

  const pyprojectPath = path.join(root, "pyproject.toml");
  if (fs.existsSync(pyprojectPath)) {
    try {
      const text = fs.readFileSync(pyprojectPath, "utf-8");
      checkPythonDep(text, "pyproject.toml");
    } catch {
      /* skip */
    }
  }

  // 3. Infrastructure & configs
  if (fs.existsSync(path.join(root, "docker-compose.yml")) || fs.existsSync(path.join(root, "docker-compose.yaml")) || fs.existsSync(path.join(root, "Dockerfile"))) {
    addTech("Docker", "infrastructure", "Dockerfile / docker-compose", 0.99);
  }

  if (fs.existsSync(path.join(root, "alembic.ini"))) {
    addTech("Alembic", "tool", "alembic.ini", 0.95);
  }

  return Array.from(records.values());
}

export function detectFrameworks(root: string): string[] {
  const techs = detectTechnologies(root);
  return techs.map((t) => t.technology);
}

function moduleOf(root: string, filePath: string): string {
  const rel = normalizePath(path.relative(root, filePath));
  const parts = rel.split("/");
  if (parts[0] === "src" && parts.length > 1) return parts[1];
  if (parts.length > 1) return parts[0];
  return "root";
}

function analyzePythonFile(filePath: string): { imports: string[]; funcs: string[]; classes: string[] } {
  const imports: string[] = [];
  const funcs: string[] = [];
  const classes: string[] = [];
  try {
    const text = fs.readFileSync(filePath, "utf-8");
    const lines = text.split("\n");
    let routerPrefix = "";
    let pendingRoute: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Detect APIRouter prefix
      const prefixMatch = trimmed.match(/APIRouter\s*\([^)]*prefix\s*=\s*["']([^"']+)["']/i);
      if (prefixMatch) {
        routerPrefix = prefixMatch[1].trim();
      }

      // Detect FastAPI / Flask route decorators
      const routeDecoratorMatch = trimmed.match(
        /^@(?:router|app|api_router)\.(get|post|put|patch|delete|api_route|route)\s*\(\s*["']?([^"'\s,]*)["']?/i
      );
      if (routeDecoratorMatch) {
        const method = routeDecoratorMatch[1].toUpperCase();
        const rawSubPath = routeDecoratorMatch[2] || "";
        const cleanSub = rawSubPath ? (rawSubPath.startsWith("/") ? rawSubPath : "/" + rawSubPath) : "";
        const fullRoutePath = (routerPrefix + cleanSub).replace(/\/+/g, "/") || "/";
        pendingRoute = `${method} ${fullRoutePath}`;
        funcs.push(`route:${method}:${fullRoutePath}`);
      }

      const fromImport = trimmed.match(/^from\s+([.\w]+)\s+import\s+/);
      if (fromImport) {
        imports.push(fromImport[1]);
        continue;
      }
      const plainImport = trimmed.match(/^import\s+([.\w]+)/);
      if (plainImport) {
        imports.push(plainImport[1]);
        continue;
      }

      // Supports async def and normal def
      const funcMatch = trimmed.match(/^(?:async\s+)?def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
      if (funcMatch) {
        const funcName = funcMatch[1];
        funcs.push(funcName);
        if (pendingRoute) {
          funcs.push(`route_handler:${funcName}:${pendingRoute}`);
          pendingRoute = null;
        }
        continue;
      }

      const classMatch = trimmed.match(/^class\s+([A-Za-z_][A-Za-z0-9_]*)/);
      if (classMatch) {
        classes.push(classMatch[1]);
      }
    }
  } catch {
    /* best effort */
  }
  return { imports, funcs, classes };
}

function analyzeTsJsFile(filePath: string): { imports: string[]; funcs: string[]; classes: string[] } {
  const imports: string[] = [];
  const funcs: string[] = [];
  const classes: string[] = [];
  try {
    const text = fs.readFileSync(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true);

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        imports.push(node.moduleSpecifier.text);
      }
      if (ts.isFunctionDeclaration(node) && node.name) {
        funcs.push(node.name.text);
      }
      if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (
            ts.isIdentifier(decl.name) &&
            decl.initializer &&
            (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))
          ) {
            funcs.push(decl.name.text);
          }
        }
      }
      if (ts.isClassDeclaration(node) && node.name) {
        classes.push(node.name.text);
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  } catch {
    /* best effort */
  }
  return { imports, funcs, classes };
}

export async function scanProject(root: string): Promise<ProjectModel> {
  const ignoreEngine = IgnoreEngine.fromRoot(root);

  const rawEntries = await fg(["**/*"], {
    cwd: root,
    ignore: DEFAULT_IGNORE_PATTERNS,
    onlyFiles: true,
    dot: false,
  });

  const languages: Record<string, number> = {};
  const files: FileRecord[] = [];
  const modulesSet = new Set<string>();

  let parsedCount = 0;
  let attemptedCount = 0;

  for (const rawRel of rawEntries) {
    const relPath = normalizePath(rawRel);
    if (ignoreEngine.isIgnored(relPath)) continue;

    const ext = path.extname(relPath).toLowerCase();
    const language = LANGUAGE_BY_EXT[ext];
    if (!language) continue;

    attemptedCount++;
    const abs = path.join(root, relPath);

    languages[language] = (languages[language] || 0) + 1;
    const mod = moduleOf(root, abs);
    modulesSet.add(mod);

    let imports: string[] = [];
    let funcs: string[] = [];
    let classes: string[] = [];
    let lines = 0;

    try {
      const content = fs.readFileSync(abs, "utf-8");
      lines = content.split("\n").length;
      if (language === "TypeScript" || language === "JavaScript") {
        const analysis = analyzeTsJsFile(abs);
        imports = analysis.imports;
        funcs = analysis.funcs;
        classes = analysis.classes;
        parsedCount++;
      } else if (language === "Python") {
        const analysis = analyzePythonFile(abs);
        imports = analysis.imports;
        funcs = analysis.funcs;
        classes = analysis.classes;
        parsedCount++;
      } else {
        parsedCount++;
      }
    } catch {
      /* skip unreadable */
    }

    files.push({
      path: relPath,
      language,
      lines,
      imports,
      exportsFunctions: funcs,
      exportsClasses: classes,
      module: mod,
    });
  }

  const technologies = detectTechnologies(root);
  const scanConfidence = attemptedCount > 0 ? parseFloat((parsedCount / attemptedCount).toFixed(2)) : 1.0;

  return {
    languages,
    frameworks: technologies.map((t) => t.technology),
    technologies,
    modules: Array.from(modulesSet).sort(),
    files,
    scannedAt: new Date().toISOString(),
    scanConfidence,
  };
}

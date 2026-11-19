import * as fs from "fs";
import * as path from "path";
import fg from "fast-glob";
import * as ts from "typescript";
import { FileRecord, ProjectModel } from "./types";

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

const FRAMEWORK_DEPENDENCY_MAP: Record<string, string> = {
  react: "React",
  next: "Next.js",
  vue: "Vue",
  "@angular/core": "Angular",
  svelte: "Svelte",
  express: "Express",
  "@nestjs/core": "NestJS",
  fastify: "Fastify",
  django: "Django",
  flask: "Flask",
  fastapi: "FastAPI",
  "spring-boot": "Spring Boot",
  rails: "Ruby on Rails",
  vite: "Vite",
};

const IGNORE = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/coverage/**",
  "**/.vibe/**",
  "**/venv/**",
  "**/.venv/**",
  "**/env/**",
  "**/.env/**",
  "**/vendor/**",
  "**/site-packages/**",
  "**/target/**",
  "**/out/**",
  // Extended Python / tooling ignores
  "**/__pycache__/**",
  "**/*.pyc",
  "**/.pytest_cache/**",
  "**/alembic/versions/**",
  "**/htmlcov/**",
  "**/.mypy_cache/**",
];

/** Python requirements.txt dep → human-readable label */
const PYTHON_DEP_MAP: { pattern: RegExp; label: string }[] = [
  // Frameworks (keep parity with package.json detection)
  { pattern: /^django\b/i, label: "Django" },
  { pattern: /^flask\b/i, label: "Flask" },
  { pattern: /^fastapi\b/i, label: "FastAPI" },
  // Databases
  { pattern: /^sqlalchemy\b/i, label: "[DB] PostgreSQL/SQLAlchemy" },
  { pattern: /^psycopg2\b/i, label: "[DB] PostgreSQL" },
  { pattern: /^asyncpg\b/i, label: "[DB] PostgreSQL" },
  { pattern: /^redis\b/i, label: "[DB] Redis" },
  { pattern: /^qdrant-client\b/i, label: "[DB] Qdrant" },
  { pattern: /^motor\b/i, label: "[DB] MongoDB" },
  { pattern: /^pymongo\b/i, label: "[DB] MongoDB" },
  // AI / ML
  { pattern: /^anthropic\b/i, label: "Anthropic/Claude" },
  { pattern: /^openai\b/i, label: "OpenAI" },
  { pattern: /^voyageai\b/i, label: "Voyage AI" },
  { pattern: /^groq\b/i, label: "Groq" },
  { pattern: /^langchain\b/i, label: "LangChain" },
  { pattern: /^transformers\b/i, label: "HuggingFace Transformers" },
  // Task queues
  { pattern: /^celery\b/i, label: "Celery" },
  { pattern: /^dramatiq\b/i, label: "Dramatiq" },
  { pattern: /^rq\b/i, label: "RQ" },
];

function detectFrameworks(root: string): string[] {
  const found = new Set<string>();

  // --- Top-level package.json ---
  const topPkgPath = path.join(root, "package.json");
  if (fs.existsSync(topPkgPath)) {
    _readPackageJsonDeps(topPkgPath, found);
  }

  // --- Sub-directory package.json files (up to 3 levels deep) ---
  // Pattern: */package.json  **/package.json up to depth 3
  const subPkgGlob = [
    "*/package.json",
    "*/*/package.json",
    "*/*/*/package.json",
  ];
  for (const pattern of subPkgGlob) {
    const matches = fg.sync(pattern, { cwd: root, ignore: IGNORE, dot: false });
    for (const rel of matches) {
      const abs = path.join(root, rel);
      _readPackageJsonDeps(abs, found);
    }
  }

  // --- requirements.txt ---
  const reqPath = path.join(root, "requirements.txt");
  if (fs.existsSync(reqPath)) {
    try {
      const lines = fs.readFileSync(reqPath, "utf-8").split("\n");
      for (const rawLine of lines) {
        // Strip comments and version specifiers
        const dep = rawLine.split("#")[0].trim().split(/[>=<![\s]/)[0].toLowerCase();
        if (!dep) continue;
        for (const { pattern, label } of PYTHON_DEP_MAP) {
          if (pattern.test(dep)) {
            found.add(label);
            break;
          }
        }
      }
    } catch {
      /* ignore unreadable */
    }
  }

  // --- Docker ---
  if (
    fs.existsSync(path.join(root, "docker-compose.yml")) ||
    fs.existsSync(path.join(root, "docker-compose.yaml")) ||
    fs.existsSync(path.join(root, "Dockerfile"))
  ) {
    found.add("Docker");
  }

  // --- Vite config anywhere in the project ---
  const viteConfigs = fg.sync(["**/vite.config.ts", "**/vite.config.js"], {
    cwd: root,
    ignore: IGNORE,
    dot: false,
  });
  if (viteConfigs.length > 0) {
    found.add("Vite");
  }

  return Array.from(found);
}

function _readPackageJsonDeps(pkgPath: string, found: Set<string>): void {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    for (const dep of Object.keys(deps)) {
      if (FRAMEWORK_DEPENDENCY_MAP[dep]) found.add(FRAMEWORK_DEPENDENCY_MAP[dep]);
    }
  } catch {
    /* ignore malformed package.json */
  }
}

function moduleOf(root: string, filePath: string): string {
  const rel = path.relative(root, filePath);
  const parts = rel.split(path.sep);
  // src/<module>/... -> module ; else top-level dir ; else "root"
  if (parts[0] === "src" && parts.length > 1) return parts[1];
  if (parts.length > 1) return parts[0];
  return "root";
}

function analyzePythonFile(
  filePath: string
): { imports: string[]; funcs: string[]; classes: string[]; routes: string[] } {
  const imports: string[] = [];
  const funcs: string[] = [];
  const classes: string[] = [];
  const routes: string[] = [];
  try {
    const text = fs.readFileSync(filePath, "utf-8");
    const lines = text.split("\n");
    let pendingRouteDecorator: string | null = null;

    for (const line of lines) {
      const trimmed = line.trim();

      // Route decorators: @app.route("/path"), @router.get("/path"), @router.post("/path"), etc.
      const routeDecoratorMatch = trimmed.match(
        /^@(?:\w+)\.(?:route|get|post|put|patch|delete|head|options)\s*\(\s*["']([^"']+)["']/
      );
      if (routeDecoratorMatch) {
        pendingRouteDecorator = routeDecoratorMatch[1];
        continue;
      }

      // Imports
      const fromImport = trimmed.match(/^from\s+([\.\w]+)\s+import\s+/);
      if (fromImport) {
        imports.push(fromImport[1]);
        pendingRouteDecorator = null;
        continue;
      }
      const plainImport = trimmed.match(/^import\s+([\.\w]+)/);
      if (plainImport) {
        imports.push(plainImport[1]);
        pendingRouteDecorator = null;
        continue;
      }

      // Functions (sync and async)
      const funcMatch = trimmed.match(/^(?:async\s+)?def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
      if (funcMatch) {
        funcs.push(funcMatch[1]);
        if (pendingRouteDecorator !== null) {
          routes.push(`route:${pendingRouteDecorator}`);
          pendingRouteDecorator = null;
        }
        continue;
      }

      // Classes
      const classMatch = trimmed.match(/^class\s+([A-Za-z_][A-Za-z0-9_]*)/);
      if (classMatch) {
        classes.push(classMatch[1]);
        pendingRouteDecorator = null;
      }
    }
  } catch {
    /* best effort */
  }
  return { imports, funcs, classes, routes };
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
  const entries = await fg(["**/*"], {
    cwd: root,
    ignore: IGNORE,
    onlyFiles: true,
    dot: false,
  });

  const languages: Record<string, number> = {};
  const files: FileRecord[] = [];
  const modulesSet = new Set<string>();
  let totalFiles = 0;
  let successfullyAnalyzed = 0;

  for (const relPath of entries) {
    const abs = path.join(root, relPath);
    const ext = path.extname(relPath);
    const language = LANGUAGE_BY_EXT[ext];
    if (!language) continue;

    totalFiles++;
    languages[language] = (languages[language] || 0) + 1;
    const mod = moduleOf(root, abs);
    modulesSet.add(mod);

    let imports: string[] = [];
    let funcs: string[] = [];
    let classes: string[] = [];
    let routes: string[] = [];
    let lines = 0;
    let analyzed = false;

    try {
      const content = fs.readFileSync(abs, "utf-8");
      lines = content.split("\n").length;
      if (language === "TypeScript" || language === "JavaScript") {
        const analysis = analyzeTsJsFile(abs);
        imports = analysis.imports;
        funcs = analysis.funcs;
        classes = analysis.classes;
        analyzed = true;
      } else if (language === "Python") {
        const analysis = analyzePythonFile(abs);
        imports = analysis.imports;
        funcs = analysis.funcs;
        classes = analysis.classes;
        routes = analysis.routes;
        analyzed = true;
      } else {
        // Other supported languages: counted but not deeply analyzed
        analyzed = true;
      }
    } catch {
      /* skip unreadable files */
    }

    if (analyzed) successfullyAnalyzed++;

    files.push({
      path: relPath,
      language,
      lines,
      imports,
      exportsFunctions: [...funcs, ...routes],
      exportsClasses: classes,
      module: mod,
    });
  }

  const scanConfidence = totalFiles > 0 ? successfullyAnalyzed / totalFiles : 1;

  return {
    languages,
    frameworks: detectFrameworks(root),
    modules: Array.from(modulesSet).sort(),
    files,
    scannedAt: new Date().toISOString(),
    scanConfidence,
  } as ProjectModel & { scanConfidence: number };
}

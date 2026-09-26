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
};

const IGNORE = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/coverage/**",
  "**/.vibe/**",
];

function detectFrameworks(root: string): string[] {
  const found = new Set<string>();
  const pkgPath = path.join(root, "package.json");
  if (fs.existsSync(pkgPath)) {
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
  const reqPath = path.join(root, "requirements.txt");
  if (fs.existsSync(reqPath)) {
    const text = fs.readFileSync(reqPath, "utf-8").toLowerCase();
    if (text.includes("django")) found.add("Django");
    if (text.includes("flask")) found.add("Flask");
    if (text.includes("fastapi")) found.add("FastAPI");
  }
  return Array.from(found);
}

function moduleOf(root: string, filePath: string): string {
  const rel = path.relative(root, filePath);
  const parts = rel.split(path.sep);
  // src/<module>/... -> module ; else top-level dir ; else "root"
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
    for (const line of lines) {
      const trimmed = line.trim();
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
      const funcMatch = trimmed.match(/^def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
      if (funcMatch) {
        funcs.push(funcMatch[1]);
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

  for (const relPath of entries) {
    const abs = path.join(root, relPath);
    const ext = path.extname(relPath);
    const language = LANGUAGE_BY_EXT[ext];
    if (!language) continue;

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
      } else if (language === "Python") {
        const analysis = analyzePythonFile(abs);
        imports = analysis.imports;
        funcs = analysis.funcs;
        classes = analysis.classes;
      }
    } catch {
      /* skip unreadable files */
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

  return {
    languages,
    frameworks: detectFrameworks(root),
    modules: Array.from(modulesSet).sort(),
    files,
    scannedAt: new Date().toISOString(),
  };
}

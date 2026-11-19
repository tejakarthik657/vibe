import * as fs from "fs";
import * as path from "path";

export type FileCategory =
  | "source"
  | "test"
  | "config"
  | "dependency"
  | "generated"
  | "documentation"
  | "ignored";

export const DEFAULT_IGNORE_PATTERNS = [
  ".git",
  ".git/**",
  "**/.git/**",
  ".venv",
  ".venv/**",
  "**/.venv/**",
  "venv",
  "venv/**",
  "**/venv/**",
  "env",
  "env/**",
  "**/env/**",
  ".env",
  ".env.*",
  "**/.env",
  "**/.env.*",
  "node_modules",
  "node_modules/**",
  "**/node_modules/**",
  "__pycache__",
  "__pycache__/**",
  "**/__pycache__/**",
  "*.pyc",
  "**/*.pyc",
  ".pytest_cache",
  ".pytest_cache/**",
  "**/.pytest_cache/**",
  "dist",
  "dist/**",
  "**/dist/**",
  "build",
  "build/**",
  "**/build/**",
  "coverage",
  "coverage/**",
  "**/coverage/**",
  "htmlcov",
  "htmlcov/**",
  "**/htmlcov/**",
  "*.log",
  "**/*.log",
  "*.vsix",
  "**/*.vsix",
  ".mypy_cache",
  ".mypy_cache/**",
  "**/.mypy_cache/**",
  ".next",
  ".next/**",
  "**/.next/**",
  "site-packages",
  "site-packages/**",
  "**/site-packages/**",
  "alembic/versions",
  "alembic/versions/**",
  "**/alembic/versions/**",
  ".vibe",
  ".vibe/**",
  "**/.vibe/**",
  ".lock",
  "**/.lock",
  "*.tmp",
  "**/*.tmp"
];

const SOURCE_EXTENSIONS = new Set([
  ".py", ".ts", ".tsx", ".js", ".jsx", ".java", ".go", ".rs", ".rb",
  ".php", ".cs", ".cpp", ".c", ".kt", ".swift", ".scala", ".m", ".h"
]);

const CONFIG_FILENAMES = new Set([
  "package.json", "package-lock.json", "tsconfig.json", "tsconfig.base.json",
  "pyproject.toml", "requirements.txt", "requirements-dev.txt", "setup.py", "setup.cfg",
  "dockerfile", "docker-compose.yml", "docker-compose.yaml", ".gitignore", ".vibeignore",
  "alembic.ini", "vite.config.ts", "vite.config.js", "webpack.config.js", "jest.config.js",
  "pytest.ini"
]);

/**
 * Normalizes any Windows or POSIX path to a clean forward-slash relative path.
 */
export function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\.\//, "").trim();
}

/**
 * Checks if a simple glob pattern matches a normalized path.
 */
function matchPattern(pattern: string, filePath: string): boolean {
  const normPattern = normalizePath(pattern);
  const normPath = normalizePath(filePath);

  if (!normPattern || normPattern.startsWith("#")) return false;

  // Exact match
  if (normPattern === normPath) return true;

  // Directory prefix match (e.g. "node_modules/" matches "node_modules/pkg/index.js")
  const cleanDirPattern = normPattern.endsWith("/") ? normPattern.slice(0, -1) : normPattern;
  if (normPath === cleanDirPattern || normPath.startsWith(cleanDirPattern + "/")) {
    return true;
  }

  // Any folder match (e.g. "**/__pycache__/**" or "**/.venv/**")
  if (normPattern.includes("**/")) {
    const stripped = normPattern.replace(/^\*\*\//, "").replace(/\/\*\*$/, "");
    if (normPath.includes(stripped + "/") || normPath.endsWith("/" + stripped) || normPath === stripped) {
      return true;
    }
  }

  // Extension wildcard match (e.g. "*.pyc", "**/*.pyc", "*.log")
  if (normPattern.startsWith("*.") || normPattern.startsWith("**/*.")) {
    const ext = normPattern.slice(normPattern.lastIndexOf("."));
    if (normPath.endsWith(ext)) return true;
  }

  // Prefix wildcard match
  if (normPattern.endsWith("/**")) {
    const prefix = normPattern.slice(0, -3);
    if (normPath === prefix || normPath.startsWith(prefix + "/")) return true;
  }

  return false;
}

export class IgnoreEngine {
  private patterns: string[] = [];

  constructor(patterns: string[] = []) {
    this.patterns = [...DEFAULT_IGNORE_PATTERNS, ...patterns];
  }

  /**
   * Loads an IgnoreEngine from repository root by merging built-ins,
   * .gitignore, and .vibeignore.
   */
  static fromRoot(root: string): IgnoreEngine {
    const customPatterns: string[] = [];

    const gitignorePath = path.join(root, ".gitignore");
    if (fs.existsSync(gitignorePath)) {
      try {
        const content = fs.readFileSync(gitignorePath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            customPatterns.push(trimmed);
          }
        }
      } catch {
        /* best effort */
      }
    }

    const vibeignorePath = path.join(root, ".vibeignore");
    if (fs.existsSync(vibeignorePath)) {
      try {
        const content = fs.readFileSync(vibeignorePath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#")) {
            customPatterns.push(trimmed);
          }
        }
      } catch {
        /* best effort */
      }
    }

    return new IgnoreEngine(customPatterns);
  }

  public isIgnored(filePath: string): boolean {
    const norm = normalizePath(filePath);
    if (!norm) return true;
    return this.patterns.some((pattern) => matchPattern(pattern, norm));
  }

  public categorize(filePath: string): FileCategory {
    const norm = normalizePath(filePath);
    if (this.isIgnored(norm)) {
      if (
        norm.includes("node_modules") ||
        norm.includes(".venv") ||
        norm.includes("venv") ||
        norm.includes("site-packages")
      ) {
        return "dependency";
      }
      if (
        norm.includes("__pycache__") ||
        norm.includes(".pytest_cache") ||
        norm.includes("dist/") ||
        norm.includes("build/") ||
        norm.includes("alembic/versions") ||
        norm.endsWith(".pyc")
      ) {
        return "generated";
      }
      return "ignored";
    }

    const filename = path.basename(norm).toLowerCase();
    const ext = path.extname(norm).toLowerCase();

    if (/(test|spec|tests)/i.test(norm) || filename.startsWith("test_") || filename.endsWith("_test.py")) {
      return "test";
    }

    if (SOURCE_EXTENSIONS.has(ext)) {
      return "source";
    }

    if (CONFIG_FILENAMES.has(filename) || ext === ".yaml" || ext === ".yml" || ext === ".ini" || ext === ".json") {
      return "config";
    }

    if (ext === ".md" || ext === ".rst" || ext === ".txt") {
      return "documentation";
    }

    return "source";
  }

  public filterPaths(filePaths: string[]): {
    sourceFiles: string[];
    testFiles: string[];
    configFiles: string[];
    ignoredFiles: string[];
    allUnignored: string[];
  } {
    const sourceFiles: string[] = [];
    const testFiles: string[] = [];
    const configFiles: string[] = [];
    const ignoredFiles: string[] = [];
    const allUnignored: string[] = [];

    for (const file of filePaths) {
      const category = this.categorize(file);
      if (category === "ignored" || category === "dependency" || category === "generated") {
        ignoredFiles.push(file);
      } else {
        allUnignored.push(file);
        if (category === "source") sourceFiles.push(file);
        else if (category === "test") testFiles.push(file);
        else if (category === "config") configFiles.push(file);
      }
    }

    return { sourceFiles, testFiles, configFiles, ignoredFiles, allUnignored };
  }
}

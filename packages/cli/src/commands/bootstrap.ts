import { Command } from "commander";
import * as path from "path";
import chalk from "chalk";
import { VibeStore, addConstraint, setDeclaredArchitecture } from "vibe-dev-core";

const STACK_PRESETS: Record<string, { frameworks: string[]; database?: string; constraints: string[] }> = {
  nextjs: {
    frameworks: ["Next.js", "TypeScript", "React"],
    database: "PostgreSQL",
    constraints: [
      "Never expose server-side environment variables (SECRET_*, DATABASE_URL) to client bundles",
      "Do not make direct database calls inside UI React components",
      "All API routes under /api must include standard exception handling",
    ],
  },
  express: {
    frameworks: ["Express", "TypeScript", "Node.js"],
    database: "PostgreSQL",
    constraints: [
      "Never store plain text passwords in database",
      "All endpoints must use centralized error handling middleware",
      "Authentication routes must use rate limiting middleware",
    ],
  },
  python: {
    frameworks: ["FastAPI", "Python"],
    database: "PostgreSQL",
    constraints: [
      "Never hardcode secret keys in python source files",
      "Type hints required for all public API handler parameters",
      "Database connections must use connection pooling or async session manager",
    ],
  },
  general: {
    frameworks: ["TypeScript"],
    constraints: [
      "Never commit secret API keys or private tokens to git history",
      "Keep all file sizes under 500 lines for maintainability",
      "All public methods must include explicit return type annotations",
    ],
  },
};

export function registerBootstrap(program: Command) {
  program
    .command("bootstrap [preset...]")
    .description("Bootstrap project with pre-configured industry architectural constraints & stack definition")
    .action((presetParts: string[]) => {
      const root = process.cwd();
      if (!VibeStore.exists(root)) {
        VibeStore.init(root, path.basename(root));
        console.log(chalk.blue(`ℹ Auto-initialized VIBE for "${path.basename(root)}"`));
      }
      const store = new VibeStore(root);
      const state = store.get();

      const raw = Array.isArray(presetParts) ? presetParts.join(" ").toLowerCase().trim() : "general";
      let key = "general";
      if (raw.includes("next")) key = "nextjs";
      else if (raw.includes("express") || raw.includes("node")) key = "express";
      else if (raw.includes("py") || raw.includes("fastapi") || raw.includes("django")) key = "python";

      const preset = STACK_PRESETS[key] || STACK_PRESETS.general;

      // Declare arch
      setDeclaredArchitecture(state, preset.frameworks, preset.database, `Bootstrapped using ${key} preset`);

      // Add constraints
      for (const text of preset.constraints) {
        addConstraint(state, text, "warning");
      }

      store.set(state);
      store.save();

      console.log(chalk.green(`\n✔ Bootstrapped VIBE project constitution with standard ${key.toUpperCase()} preset:`));
      console.log(`  Frameworks: ${preset.frameworks.join(", ")}${preset.database ? ` + ${preset.database}` : ""}`);
      console.log(chalk.bold("\nAdded Architectural Non-Negotiables:"));
      for (const c of preset.constraints) {
        console.log(`  • ${c}`);
      }
      console.log(chalk.dim("\nRun `vibe status` or `vibe onboard` to view state.\n"));
    });
}

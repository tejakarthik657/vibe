import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import { VibeStore } from "vibe-dev-core";

const ESSENTIAL_GITIGNORE_RULES = [
  "# Environment and Secrets",
  ".env",
  ".env.*",
  "",
  "# VIBE Configuration and State",
  ".vibe/config.json",
  ".vibe/.lock",
  "",
  "# Dependencies and Virtual Environments",
  "node_modules/",
  ".venv/",
  "venv/",
  "env/",
  "",
  "# Build outputs and Caches",
  "dist/",
  "build/",
  ".next/",
  "coverage/",
  "htmlcov/",
  ".pytest_cache/",
  "__pycache__/",
  "*.pyc",
  "*.log",
  "*.vsix",
  "release/",
];

export function ensureSafeGitignore(root: string): { created: boolean; updated: boolean } {
  const gitignorePath = path.join(root, ".gitignore");
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, ESSENTIAL_GITIGNORE_RULES.join("\n") + "\n", "utf-8");
    return { created: true, updated: false };
  }

  const existing = fs.readFileSync(gitignorePath, "utf-8");
  const lines = existing.split("\n").map((l) => l.trim());
  const toAdd: string[] = [];

  const mandatory = [
    ".env",
    ".vibe/config.json",
    "node_modules/",
    ".venv/",
    "dist/",
    "build/",
    ".pytest_cache/",
    "__pycache__/",
  ];

  for (const item of mandatory) {
    if (!lines.includes(item)) {
      toAdd.push(item);
    }
  }

  if (toAdd.length > 0) {
    const updated = existing.trimEnd() + "\n\n# Added by VIBE safety guard\n" + toAdd.join("\n") + "\n";
    fs.writeFileSync(gitignorePath, updated, "utf-8");
    return { created: false, updated: true };
  }

  return { created: false, updated: false };
}

export function registerInit(program: Command) {
  program
    .command("init")
    .description("Initialize VIBE in the current project")
    .option("-n, --name <name>", "Project name")
    .action((opts) => {
      const root = process.cwd();
      const name = opts.name || path.basename(root);

      if (VibeStore.exists(root)) {
        console.log(chalk.yellow("VIBE is already initialized here (.vibe/state.json exists)."));
      } else {
        const store = VibeStore.init(root, name);
        store.save();
        console.log(chalk.green(`✔ Initialized VIBE for "${name}"`));
        console.log(chalk.dim(`  Created .vibe/state.json`));
      }

      // Automatically ensure a safe .gitignore exists
      const gitignoreStatus = ensureSafeGitignore(root);
      if (gitignoreStatus.created) {
        console.log(chalk.green(`✔ Created safe .gitignore protecting secrets and dependencies.`));
      } else if (gitignoreStatus.updated) {
        console.log(chalk.green(`✔ Updated .gitignore with missing security exclusions.`));
      }

      console.log("");
      console.log("Next steps:");
      console.log(`  ${chalk.cyan("vibe scan")}             Analyze the repository`);
      console.log(`  ${chalk.cyan("vibe requirement add")}   Record what you're building`);
      console.log(`  ${chalk.cyan("vibe status")}           See the current engineering state`);
    });
}

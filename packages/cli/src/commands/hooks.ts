import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";

export function registerHooks(program: Command) {
  program
    .command("install-hooks")
    .alias("hooks")
    .description("Install git pre-commit hook to run `vibe guard` automatically on every commit")
    .action(() => {
      let root = process.cwd();
      let gitDir = path.join(root, ".git");

      if (!fs.existsSync(gitDir)) {
        try {
          require("child_process").execSync("git init", { cwd: root });
          console.log(chalk.blue(`ℹ Initialized git repository in "${root}"`));
        } catch {
          /* best effort */
        }
      }

      if (!fs.existsSync(gitDir)) {
        console.log(chalk.red("Error: Unable to initialize git repository. Ensure git CLI is installed."));
        process.exitCode = 1;
        return;
      }

      const hooksDir = path.join(gitDir, "hooks");
      if (!fs.existsSync(hooksDir)) {
        fs.mkdirSync(hooksDir, { recursive: true });
      }

      const preCommitPath = path.join(hooksDir, "pre-commit");

      const hookContent = `#!/bin/sh
# VIBE Engineering Intelligence pre-commit guard
echo "[VIBE] Running Pre-commit Guard..."
npx vibe-engine guard
if [ $? -ne 0 ]; then
  echo "[BLOCKED] VIBE Guard blocked commit due to architectural risk, secrets, or missing coverage."
  echo "          Run 'vibe guard' to inspect findings or fix issues before committing."
  exit 1
fi
`;

      try {
        fs.writeFileSync(preCommitPath, hookContent, { mode: 0o755, encoding: "utf-8" });
        console.log(chalk.green("[OK] Installed VIBE pre-commit git hook at .git/hooks/pre-commit"));
        console.log(chalk.dim("  Every `git commit` will now automatically be guarded against architectural drift & secrets."));
      } catch (err) {
        console.log(chalk.red(`Failed to write git hook: ${err}`));
        process.exitCode = 1;
      }
    });
}

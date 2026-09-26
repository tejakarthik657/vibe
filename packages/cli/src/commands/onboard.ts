import { Command } from "commander";
import chalk from "chalk";
import { VibeStore, listRequirements, listDecisions, listConstraints, listTasks, computeDrift } from "@vibe/core";
import * as path from "path";

export function registerOnboard(program: Command) {
  program
    .command("onboard")
    .alias("welcome")
    .description("5-second instant developer onboarding summary for the current project")
    .action(() => {
      const root = process.cwd();
      if (!VibeStore.exists(root)) {
        VibeStore.init(root, path.basename(root));
        console.log(chalk.blue(`ℹ Auto-initialized VIBE for "${path.basename(root)}"`));
      }
      const store = new VibeStore(root);
      const state = store.get();
      const projName = state.project.name || path.basename(root);

      console.log(chalk.bold.cyan(`\n═════════════════════════════════════════════════════════════`));
      console.log(chalk.bold.cyan(`  🚀 VIBE ONBOARDING — ${projName.toUpperCase()}`));
      console.log(chalk.bold.cyan(`═════════════════════════════════════════════════════════════\n`));

      // 1. Tech Stack & Architecture
      console.log(chalk.bold.yellow("📌 Tech Stack & Architecture:"));
      if (state.lastScan) {
        console.log(`  Languages:  ${Object.keys(state.lastScan.languages).join(", ") || "None detected"}`);
        console.log(`  Frameworks: ${state.lastScan.frameworks.join(", ") || "None detected"}`);
        console.log(`  Modules:    ${state.lastScan.modules.join(", ") || "(none)"}`);
        console.log(`  Codebase:   ${state.lastScan.files.length} file(s) across ${state.nodes.length} graph nodes`);
      } else {
        console.log(chalk.dim("  (Codebase not scanned yet. Run `vibe scan` to build graph)"));
      }

      // 2. Drift status
      if (state.architecture) {
        const drift = computeDrift(state);
        if (drift.undeclaredButDetected.length > 0) {
          console.log(chalk.yellow(`  ⚠ Arch Drift Detected: Undeclared frameworks (${drift.undeclaredButDetected.join(", ")})`));
        } else {
          console.log(chalk.green(`  ✔ Architecture matching declared spec (${state.architecture.frameworks.join(", ")})`));
        }
      }

      // 3. Non-negotiables (Constraints)
      console.log(`\n${chalk.bold.red("🛡️ Architectural Non-Negotiables (Constraints):")}`);
      const cons = listConstraints(state);
      if (cons.length > 0) {
        for (const c of cons) {
          console.log(`  • [${c.severity.toUpperCase()}] ${c.text}`);
        }
      } else {
        console.log(chalk.dim("  (No active constraints defined. Add with `vibe con <rule>`)"));
      }

      // 4. Open Tasks
      console.log(`\n${chalk.bold.green("📋 Active Sprint Tasks:")}`);
      const tasks = listTasks(state).filter((t) => t.status !== "done");
      if (tasks.length > 0) {
        for (const t of tasks) {
          console.log(`  ○ ${chalk.cyan(t.id)}: ${t.title}`);
        }
      } else {
        console.log(chalk.dim("  (No active tasks. Add with `vibe task <title>`)"));
      }

      // 5. Active Requirements
      console.log(`\n${chalk.bold.magenta("🎯 Core Requirements:")}`);
      const reqs = listRequirements(state);
      if (reqs.length > 0) {
        for (const r of reqs.slice(0, 5)) {
          console.log(`  • ${chalk.cyan(r.id)}: ${r.text}`);
        }
      } else {
        console.log(chalk.dim("  (No requirements listed. Add with `vibe req <text>`)"));
      }

      console.log(chalk.bold.cyan(`\n═════════════════════════════════════════════════════════════`));
      console.log(chalk.dim("  Tip: Run `vibe guard` before submitting PRs or commits."));
      console.log(chalk.bold.cyan(`═════════════════════════════════════════════════════════════\n`));
    });
}

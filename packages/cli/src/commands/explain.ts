import { Command } from "commander";
import chalk from "chalk";
import { VibeStore, explainModule } from "@vibe/core";

export function registerExplain(program: Command) {
  program
    .command("explain [module...]")
    .description("Explain what a module is, why it exists, and how it connects to the rest of the system")
    .action((moduleParts: string[]) => {
      const root = process.cwd();
      if (!VibeStore.exists(root)) {
        VibeStore.init(root, require("path").basename(root));
        console.log(chalk.blue(`ℹ Auto-initialized VIBE for "${require("path").basename(root)}"`));
      }
      const queryModule = Array.isArray(moduleParts) ? moduleParts.join(" ").trim() : String(moduleParts || "").trim();
      if (!queryModule) {
        console.log(chalk.red("Please specify a module name. E.g.: vibe explain auth"));
        return;
      }

      const state = new VibeStore(root).get();
      let result = explainModule(state, queryModule);

      // Try fuzzy module lookup if exact match failed
      if (!result && state.lastScan?.modules) {
        const fuzzy = state.lastScan.modules.find((m) => m.toLowerCase().includes(queryModule.toLowerCase()));
        if (fuzzy) {
          result = explainModule(state, fuzzy);
        }
      }

      if (!result) {
        console.log(chalk.red(`No module matching "${queryModule}" found. Run \`vibe scan\` first, or check \`vibe status\` for module names.`));
        process.exitCode = 1;
        return;
      }

      console.log(chalk.bold(`Module: ${result.module}`));
      console.log(chalk.dim(`${result.files.length} file(s)`));
      console.log("");

      console.log(chalk.bold("Implements requirements:"));
      console.log(
        result.linkedRequirements.length
          ? result.linkedRequirements.map((r) => `  - ${r.id}: ${r.text}`).join("\n")
          : "  (none linked yet)"
      );
      console.log("");

      console.log(chalk.bold("Related architecture decisions:"));
      console.log(
        result.relatedDecisions.length
          ? result.relatedDecisions.map((d) => `  - ${d.id}: ${d.decision}`).join("\n")
          : "  (none mention this module by name)"
      );
      console.log("");

      console.log(chalk.bold("Depends on (outside this module):"));
      console.log(result.externalDependencies.length ? result.externalDependencies.map((f) => `  - ${f}`).join("\n") : "  (none)");
      console.log("");

      console.log(chalk.bold("Depended on by (outside this module):"));
      console.log(result.externalDependents.length ? result.externalDependents.map((f) => `  - ${f}`).join("\n") : "  (none)");
    });
}

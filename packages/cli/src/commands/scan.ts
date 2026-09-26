import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { VibeStore, scanProject, rebuildCodeGraph, recordInferredDecisions } from "vibe-dev-core";

export function registerScan(program: Command) {
  program
    .command("scan")
    .alias("adopt")
    .description("Scan the repository and rebuild the engineering graph")
    .action(async () => {
      const root = process.cwd();
      if (!VibeStore.exists(root)) {
        const name = require("path").basename(root);
        VibeStore.init(root, name);
        console.log(chalk.blue(`ℹ Auto-initialized VIBE for "${name}"`));
      }
      const spinner = ora("Scanning repository...").start();
      const store = new VibeStore(root);
      const state = store.get();

      try {
        const model = await scanProject(root);
        state.lastScan = model;
        rebuildCodeGraph(state, model);
        const inferred = recordInferredDecisions(state);
        store.set(state);
        store.save();
        spinner.succeed("Scan complete.");
        if (inferred.length) {
          console.log(chalk.dim(`  Recorded ${inferred.length} inferred decision(s) for new dependencies: ${inferred.join(", ")}`));
          console.log(chalk.dim(`  Review with \`vibe decision list\` — these are provenance-tagged "inferred", not developer-confirmed.`));
        }
      } catch (err) {
        spinner.fail("Scan failed.");
        console.error(err);
        process.exitCode = 1;
        return;
      }

      const model = state.lastScan!;
      console.log("");
      console.log(chalk.bold("Languages:"));
      for (const [lang, count] of Object.entries(model.languages)) {
        console.log(`  ${lang}: ${count} file(s)`);
      }
      if (model.frameworks.length) {
        console.log("");
        console.log(chalk.bold("Frameworks detected:"), model.frameworks.join(", "));
      }
      console.log("");
      console.log(chalk.bold("Modules:"), model.modules.join(", ") || "(none)");
      console.log(chalk.bold("Total files analyzed:"), model.files.length);
      console.log(chalk.bold("Graph nodes:"), state.nodes.length, chalk.dim("edges:"), state.edges.length);
    });
}

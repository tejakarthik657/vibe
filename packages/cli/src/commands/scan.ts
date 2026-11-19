import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { VibeStore, scanProject, rebuildCodeGraph, recordInferredDecisions } from "vibe-dev-core";

export function registerScan(program: Command) {
  program
    .command("scan")
    .alias("adopt")
    .description("Scan the repository and rebuild the engineering graph")
    .option("-f, --format <format>", "text | json", "text")
    .option("--quiet", "Suppress progress spinner and info logs")
    .action(async (opts) => {
      const root = process.cwd();
      if (!VibeStore.exists(root)) {
        const name = require("path").basename(root);
        VibeStore.init(root, name);
        if (opts.format !== "json" && !opts.quiet) {
          console.log(chalk.blue(`ℹ Auto-initialized VIBE for "${name}"`));
        }
      }

      const isJson = opts.format === "json";
      const spinner = isJson || opts.quiet ? null : ora("Scanning repository...").start();

      const store = new VibeStore(root);
      const state = store.get();

      try {
        const model = await scanProject(root);
        state.lastScan = model;
        rebuildCodeGraph(state, model);
        const inferred = recordInferredDecisions(state);
        store.set(state);
        store.save();

        if (spinner) spinner.succeed("Scan complete.");

        if (isJson) {
          console.log(
            JSON.stringify(
              {
                project: state.project.name,
                scannedAt: model.scannedAt,
                scanConfidence: model.scanConfidence,
                languages: model.languages,
                frameworks: model.frameworks,
                technologies: model.technologies,
                modules: model.modules,
                totalFiles: model.files.length,
                graphNodes: state.nodes.length,
                graphEdges: state.edges.length,
                inferredDecisions: inferred,
              },
              null,
              2
            )
          );
          return;
        }

        if (!opts.quiet && inferred.length) {
          console.log(
            chalk.dim(
              `  Recorded ${inferred.length} inferred decision(s) for new dependencies: ${inferred.join(", ")}`
            )
          );
          console.log(
            chalk.dim(`  Review with \`vibe decision list\` — these are provenance-tagged "inferred", not developer-confirmed.`)
          );
        }
      } catch (err) {
        if (spinner) spinner.fail("Scan failed.");
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
      if (model.modules.length) {
        console.log("");
        console.log(chalk.bold("Modules:"), model.modules.join(", "));
      }
      console.log(chalk.dim(`Total files analyzed: ${model.files.length} (Confidence: ${((model.scanConfidence ?? 1.0) * 100).toFixed(0)}%)`));
      console.log(chalk.dim(`Graph nodes: ${state.nodes.length} edges: ${state.edges.length}`));
    });
}

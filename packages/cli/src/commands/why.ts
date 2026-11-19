import { Command } from "commander";
import chalk from "chalk";
import { VibeStore, explainWhy } from "vibe-dev-core";

export function registerWhy(program: Command) {
  program
    .command("why [query...]")
    .description("Explain why a file, module, or symbol exists: linked requirements, decisions, dependents, and tests")
    .option("-f, --format <format>", "text | json", "text")
    .action((queryParts: string[], opts) => {
      const root = process.cwd();
      if (!VibeStore.exists(root)) {
        VibeStore.init(root, require("path").basename(root));
        console.log(chalk.blue(`ℹ Auto-initialized VIBE for "${require("path").basename(root)}"`));
      }
      const rawQuery = Array.isArray(queryParts) ? queryParts.join(" ").trim() : String(queryParts || "").trim();
      if (!rawQuery) {
        console.log(chalk.red("Please specify a file path, module, or symbol. E.g.: vibe why app/core/deps.py"));
        process.exitCode = 1;
        return;
      }

      const state = new VibeStore(root).get();
      const result = explainWhy(root, state, rawQuery);

      if (!result) {
        console.log(chalk.red(`No graph data matching "${rawQuery}". Run \`vibe scan\` first or check the query.`));
        process.exitCode = 1;
        return;
      }

      if (opts.format === "json") {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      console.log(chalk.bold(result.resolvedPath));
      console.log(chalk.dim(`  Type: ${result.isModule ? "Module" : "Source File"}, Query: "${result.target}"`));
      console.log("");

      console.log(chalk.bold("Implements Requirements:"));
      console.log(
        result.requirements.length
          ? result.requirements.map((r) => `  - ${r.id}: ${r.text}`).join("\n")
          : "  (none linked — link with `vibe requirement link`)"
      );
      console.log("");

      console.log(chalk.bold("Architecture Decisions (ADRs):"));
      console.log(
        result.decisions.length
          ? result.decisions.map((d) => `  - ${d.id} (${d.title}): ${d.decision}`).join("\n")
          : "  (no direct ADRs associated)"
      );
      console.log("");

      console.log(chalk.bold("Active Constraints:"));
      console.log(
        result.constraints.length
          ? result.constraints.map((c) => `  - [${c.severity.toUpperCase()}] ${c.text}`).join("\n")
          : "  (no constraints defined)"
      );
      console.log("");

      console.log(chalk.bold("Depended on by (Callers & Routes):"));
      console.log(
        result.dependents.length
          ? result.dependents.map((f) => `  - ${f}`).join("\n")
          : "  (no tracked dependents)"
      );
      console.log("");

      console.log(chalk.bold("Depends on:"));
      console.log(
        result.dependencies.length
          ? result.dependencies.map((f) => `  - ${f}`).join("\n")
          : "  (no tracked dependencies)"
      );
      console.log("");

      console.log(chalk.bold("Verifying Tests:"));
      console.log(
        result.tests.length
          ? result.tests.map((t) => `  - ${t}`).join("\n")
          : "  (no direct tests detected)"
      );
    });
}

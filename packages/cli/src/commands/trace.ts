import { Command } from "commander";
import chalk from "chalk";
import { VibeStore, traceRequirement, traceSymbol } from "vibe-dev-core";

export function registerTrace(program: Command) {
  program
    .command("trace [query...]")
    .description("Trace a requirement, symbol, function, class, or route through code and tests")
    .option("-f, --format <format>", "text | json", "text")
    .action((queryParts: string[], opts) => {
      const root = process.cwd();
      if (!VibeStore.exists(root)) {
        VibeStore.init(root, require("path").basename(root));
        console.log(chalk.blue(`ℹ Auto-initialized VIBE for "${require("path").basename(root)}"`));
      }
      const query = Array.isArray(queryParts) ? queryParts.join(" ").trim() : String(queryParts || "").trim();
      if (!query) {
        console.log(chalk.red("Please specify a requirement ID, symbol, or route to trace. E.g.: vibe trace REQ-001 or vibe trace get_current_user"));
        process.exitCode = 1;
        return;
      }

      const state = new VibeStore(root).get();
      let reqId = query;

      // Fuzzy match if not exact ID
      const exactMatch = state.requirements.find((r) => r.id.toLowerCase() === query.toLowerCase());
      if (!exactMatch) {
        const fuzzy = state.requirements.find((r) => r.text.toLowerCase().includes(query.toLowerCase()));
        if (fuzzy) {
          reqId = fuzzy.id;
          console.log(chalk.dim(`Matched query "${query}" to ${fuzzy.id}: ${fuzzy.text}`));
        }
      } else {
        reqId = exactMatch.id;
      }

      const result = traceRequirement(state, reqId);
      if (!result) {
        // Fall back to symbol / route / function / class trace
        const symbolResult = traceSymbol(state, query);
        if (symbolResult.definitions.length === 0) {
          console.log(chalk.red(`No requirement or symbol matching "${query}" found.`));
          process.exitCode = 1;
          return;
        }

        if (opts.format === "json") {
          console.log(JSON.stringify(symbolResult, null, 2));
          return;
        }

        console.log(chalk.bold(`Symbol: ${symbolResult.symbol}`));
        console.log("");
        console.log(chalk.bold("Definitions:"));
        console.log(
          symbolResult.definitions.map((def) => `  - [${def.kind.toUpperCase()}] ${def.file}`).join("\n")
        );
        console.log("");

        if (symbolResult.imports.length) {
          console.log(chalk.bold("Imports:"));
          console.log(symbolResult.imports.slice(0, 10).map((imp) => `  - ${imp}`).join("\n"));
          console.log("");
        }

        console.log(chalk.bold("Callers & Dependent Files:"));
        console.log(
          symbolResult.callers.length
            ? symbolResult.callers.map((file) => `  - ${file}`).join("\n")
            : "  (no callers tracked in graph)"
        );
        console.log("");

        console.log(chalk.bold("Likely Tests:"));
        console.log(
          symbolResult.likelyTests.length
            ? symbolResult.likelyTests.map((file) => `  - ${file}`).join("\n")
            : "  (none found)"
        );
        console.log("");

        if (symbolResult.linkedRequirements.length) {
          console.log(chalk.bold("Associated Requirements:"));
          console.log(symbolResult.linkedRequirements.map((r) => `  - ${r.id}: ${r.text}`).join("\n"));
          console.log("");
        }

        if (symbolResult.relatedDecisions.length) {
          console.log(chalk.bold("Related Architecture Decisions:"));
          console.log(symbolResult.relatedDecisions.map((d) => `  - ${d.id}: ${d.title}`).join("\n"));
          console.log("");
        }

        return;
      }

      if (opts.format === "json") {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      console.log(chalk.bold(`${result.requirementId}`), result.requirementText);
      console.log("");
      console.log(chalk.bold("Linked Files:"));
      console.log(
        result.linkedFiles.length
          ? result.linkedFiles.map((f) => `  - ${f}`).join("\n")
          : "  (none linked yet — use `vibe requirement link`)"
      );
      console.log("");
      console.log(chalk.bold("Likely Tests:"));
      console.log(
        result.likelyTests.length
          ? result.likelyTests.map((f) => `  - ${f}`).join("\n")
          : "  (none found)"
      );
      console.log("");
      console.log(chalk.bold("Dependent Files (would be affected by changes here):"));
      console.log(
        result.dependents.length
          ? result.dependents.map((f) => `  - ${f}`).join("\n")
          : "  (none tracked)"
      );
    });
}

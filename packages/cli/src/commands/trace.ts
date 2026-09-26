import { Command } from "commander";
import chalk from "chalk";
import { VibeStore, traceRequirement } from "@vibe/core";

export function registerTrace(program: Command) {
  program
    .command("trace [query...]")
    .description("Trace a requirement through architecture, code and tests")
    .action((queryParts: string[]) => {
      const root = process.cwd();
      if (!VibeStore.exists(root)) {
        VibeStore.init(root, require("path").basename(root));
        console.log(chalk.blue(`ℹ Auto-initialized VIBE for "${require("path").basename(root)}"`));
      }
      const query = Array.isArray(queryParts) ? queryParts.join(" ").trim() : String(queryParts || "").trim();
      if (!query) {
        console.log(chalk.red("Please specify a requirement ID or query to trace. E.g.: vibe trace REQ-001"));
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
        console.log(chalk.red(`No requirement matching "${query}" found.`));
        process.exitCode = 1;
        return;
      }
      console.log(chalk.bold(`${result.requirementId}`), result.requirementText);
      console.log("");
      console.log(chalk.bold("Linked files:"));
      console.log(result.linkedFiles.length ? result.linkedFiles.map((f) => `  - ${f}`).join("\n") : "  (none linked yet — use `vibe requirement link`)");
      console.log("");
      console.log(chalk.bold("Likely tests:"));
      console.log(result.likelyTests.length ? result.likelyTests.map((f) => `  - ${f}`).join("\n") : "  (none found)");
      console.log("");
      console.log(chalk.bold("Dependent files (would be affected by changes here):"));
      console.log(result.dependents.length ? result.dependents.map((f) => `  - ${f}`).join("\n") : "  (none tracked)");
    });
}

import { Command } from "commander";
import chalk from "chalk";
import { VibeStore } from "@vibe/core";

export function registerWhy(program: Command) {
  program
    .command("why [filePath...]")
    .description("Explain why a file exists: linked requirements, decisions, dependents")
    .action((fileParts: string[]) => {
      const root = process.cwd();
      if (!VibeStore.exists(root)) {
        VibeStore.init(root, require("path").basename(root));
        console.log(chalk.blue(`ℹ Auto-initialized VIBE for "${require("path").basename(root)}"`));
      }
      const queryPath = Array.isArray(fileParts) ? fileParts.join(" ").trim() : String(fileParts || "").trim();
      if (!queryPath) {
        console.log(chalk.red("Please specify a file path. E.g.: vibe why src/auth/service.ts"));
        return;
      }

      const state = new VibeStore(root).get();
      // Try exact match or fuzzy label match
      let fileNode = state.nodes.find((n) => n.type === "File" && n.label === queryPath);
      if (!fileNode) {
        fileNode = state.nodes.find((n) => n.type === "File" && n.label?.toLowerCase().includes(queryPath.toLowerCase()));
      }

      if (!fileNode) {
        console.log(chalk.red(`No graph data matching "${queryPath}". Run \`vibe scan\` first.`));
        process.exitCode = 1;
        return;
      }

      const filePath = fileNode.label || queryPath;
      console.log(chalk.bold(filePath));
      const meta = fileNode.meta || {};
      console.log(chalk.dim(`  language: ${meta.language ?? "unknown"}, lines: ${meta.lines ?? "?"}`));
      console.log("");

      const linkedReqs = state.requirements.filter((r) => r.linkedFiles.includes(filePath));
      console.log(chalk.bold("Implements requirements:"));
      console.log(linkedReqs.length ? linkedReqs.map((r) => `  - ${r.id}: ${r.text}`).join("\n") : "  (none linked)");
      console.log("");

      const dependents = state.edges
        .filter((e) => e.type === "DEPENDS_ON" && e.to === fileNode.id)
        .map((e) => state.nodes.find((n) => n.id === e.from)?.label)
        .filter((x): x is string => !!x);
      console.log(chalk.bold("Depended on by:"));
      console.log(dependents.length ? dependents.map((f) => `  - ${f}`).join("\n") : "  (no tracked dependents)");
      console.log("");

      const dependencies = state.edges
        .filter((e) => e.type === "DEPENDS_ON" && e.from === fileNode.id)
        .map((e) => state.nodes.find((n) => n.id === e.to)?.label)
        .filter((x): x is string => !!x);
      console.log(chalk.bold("Depends on:"));
      console.log(dependencies.length ? dependencies.map((f) => `  - ${f}`).join("\n") : "  (no tracked dependencies)");
    });
}

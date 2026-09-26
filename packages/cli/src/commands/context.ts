import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import { VibeStore, buildContext, renderAgentsMd } from "@vibe/core";

export function registerContext(program: Command) {
  program
    .command("context [task...]")
    .description("Generate a scoped AI-agent context bundle (AGENTS.md) for a task")
    .option("-o, --out <file>", "Output file", "AGENTS.md")
    .action((taskParts: string[], opts) => {
      const root = process.cwd();
      if (!VibeStore.exists(root)) {
        VibeStore.init(root, path.basename(root));
        console.log(chalk.blue(`ℹ Auto-initialized VIBE for "${path.basename(root)}"`));
      }
      const task = Array.isArray(taskParts) ? taskParts.join(" ").trim() : String(taskParts || "").trim();
      if (!task) {
        console.log(chalk.red("Please specify a task. E.g.: vibe context implement OAuth authentication flow"));
        return;
      }
      const state = new VibeStore(root).get();
      const bundle = buildContext(state, task);
      const md = renderAgentsMd(state, bundle);
      const outPath = path.join(root, opts.out);
      fs.writeFileSync(outPath, md, "utf-8");
      console.log(chalk.green(`✔ Wrote ${opts.out}`));
      console.log(chalk.dim(`  ${bundle.relevantRequirements.length} requirement(s), ${bundle.relevantDecisions.length} decision(s), ${bundle.relevantFiles.length} file(s) in scope.`));
    });
}

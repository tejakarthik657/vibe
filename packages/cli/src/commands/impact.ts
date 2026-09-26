import { Command } from "commander";
import chalk from "chalk";
import { VibeStore, analyzeImpact } from "@vibe/core";

const RISK_COLOR: Record<string, (s: string) => string> = {
  low: chalk.green.bold,
  medium: chalk.yellow.bold,
  high: chalk.red.bold,
};

export function registerImpact(program: Command) {
  program
    .command("impact [filePath...]")
    .description("Analyze the full transitive blast radius of changing a file")
    .action((fileParts: string[]) => {
      const root = process.cwd();
      if (!VibeStore.exists(root)) {
        VibeStore.init(root, require("path").basename(root));
        console.log(chalk.blue(`ℹ Auto-initialized VIBE for "${require("path").basename(root)}"`));
      }
      const queryPath = Array.isArray(fileParts) ? fileParts.join(" ").trim() : String(fileParts || "").trim();
      if (!queryPath) {
        console.log(chalk.red("Please specify a file path. E.g.: vibe impact src/auth/service.ts"));
        return;
      }

      const state = new VibeStore(root).get();
      let targetPath = queryPath;
      const fileNode = state.nodes.find((n) => n.type === "File" && n.label?.toLowerCase().includes(queryPath.toLowerCase()));
      if (fileNode && fileNode.label) {
        targetPath = fileNode.label;
      }

      const result = analyzeImpact(state, targetPath);
      if (!result) {
        console.log(chalk.red(`No graph data matching "${queryPath}". Run \`vibe scan\` first.`));
        process.exitCode = 1;
        return;
      }

      console.log(chalk.bold(`IMPACT ANALYSIS — ${result.targetFile}`));
      console.log("");
      console.log(chalk.bold("Direct dependents:"), result.directDependents.length);
      for (const f of result.directDependents) console.log(`  - ${f}`);
      console.log("");
      console.log(chalk.bold("Transitive dependents (full blast radius):"), result.transitiveDependents.length);
      for (const f of result.transitiveDependents) console.log(`  - ${f}`);
      console.log("");
      console.log(chalk.bold("Requirements affected:"), result.affectedRequirements.length ? result.affectedRequirements.join(", ") : "(none tracked)");
      console.log(chalk.bold("Tests likely affected:"), result.affectedTests.length ? result.affectedTests.join(", ") : "(none found)");
      console.log("");
      console.log("Risk:", RISK_COLOR[result.riskLevel](result.riskLevel.toUpperCase()));
    });
}

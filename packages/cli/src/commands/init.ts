import { Command } from "commander";
import * as path from "path";
import chalk from "chalk";
import { VibeStore } from "vibe-dev-core";

export function registerInit(program: Command) {
  program
    .command("init")
    .description("Initialize VIBE in the current project")
    .option("-n, --name <name>", "Project name")
    .action((opts) => {
      const root = process.cwd();
      if (VibeStore.exists(root)) {
        console.log(chalk.yellow("VIBE is already initialized here (.vibe/state.json exists)."));
        return;
      }
      const name = opts.name || path.basename(root);
      const store = VibeStore.init(root, name);
      store.save();
      console.log(chalk.green(`✔ Initialized VIBE for "${name}"`));
      console.log(chalk.dim(`  Created .vibe/state.json`));
      console.log("");
      console.log("Next steps:");
      console.log(`  ${chalk.cyan("vibe scan")}          Analyze the repository`);
      console.log(`  ${chalk.cyan("vibe requirement add")}  Record what you're building`);
      console.log(`  ${chalk.cyan("vibe status")}        See the current engineering state`);
    });
}

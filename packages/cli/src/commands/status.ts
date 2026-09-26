import { Command } from "commander";
import chalk from "chalk";
import { VibeStore } from "vibe-dev-core";

export function registerStatus(program: Command) {
  program
    .command("status")
    .description("Show the current engineering state")
    .action(() => {
      const root = process.cwd();
      if (!VibeStore.exists(root)) {
        console.log(chalk.red("VIBE is not initialized. Run `vibe init` first."));
        process.exitCode = 1;
        return;
      }
      const state = new VibeStore(root).get();

      console.log(chalk.bold.underline(`VIBE — ${state.project.name}`));
      console.log("");
      console.log(chalk.bold("Requirements:"), state.requirements.length);
      for (const r of state.requirements) console.log(`  ${chalk.cyan(r.id)} [${r.status}] ${r.text}`);
      console.log("");
      console.log(chalk.bold("Decisions:"), state.decisions.length);
      for (const d of state.decisions)
        console.log(`  ${chalk.magenta(d.id)} (${d.source}, conf ${d.confidence}) ${d.title}`);
      console.log("");
      console.log(chalk.bold("Constraints:"), state.constraints.length);
      for (const c of state.constraints) console.log(`  [${c.severity}] ${c.text}`);
      console.log("");
      if (state.lastScan) {
        console.log(chalk.bold("Last scan:"), state.lastScan.scannedAt);
        console.log(`  ${state.lastScan.files.length} files across ${state.lastScan.modules.length} modules.`);
      } else {
        console.log(chalk.yellow("No scan yet. Run `vibe scan`."));
      }
    });
}

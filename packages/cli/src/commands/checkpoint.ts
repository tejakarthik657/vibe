import { Command } from "commander";
import chalk from "chalk";
import { VibeStore, createSnapshot, listSnapshots } from "@vibe/core";

export function registerCheckpoint(program: Command) {
  const cmd = program.command("checkpoint").description("Record an engineering health snapshot");

  cmd
    .command("create", { isDefault: true })
    .description("Create a new checkpoint")
    .action(() => {
      const root = process.cwd();
      const store = new VibeStore(root);
      const state = store.get();
      const { snapshot, findings } = createSnapshot(root, state);
      store.set(state);
      store.save();

      console.log(chalk.bold(`Engineering checkpoint ${snapshot.id}`));
      console.log("");
      console.log(`Requirements:  ${snapshot.requirementCount}`);
      console.log(`Decisions:     ${snapshot.decisionCount}`);
      console.log(`Tasks:         ${snapshot.taskCount}`);
      console.log(`Constraints:   ${snapshot.constraintCount}`);
      console.log(`Files scanned: ${snapshot.fileCount} across ${snapshot.moduleCount} module(s)`);
      console.log("");
      const health =
        snapshot.criticalFindings > 0
          ? chalk.red.bold("AT RISK")
          : snapshot.highFindings > 0
          ? chalk.yellow.bold("NEEDS ATTENTION")
          : chalk.green.bold("HEALTHY");
      console.log(`Doctor findings: ${snapshot.totalFindings} (${snapshot.criticalFindings} critical, ${snapshot.highFindings} high)`);
      console.log(`Project state: ${health}`);
      console.log(chalk.dim(`Saved to .vibe/snapshots/`));
    });

  cmd
    .command("list")
    .description("List past checkpoints")
    .action(() => {
      const root = process.cwd();
      const state = new VibeStore(root).get();
      for (const s of listSnapshots(state)) {
        console.log(
          `${chalk.cyan(s.id)} ${s.createdAt}  reqs:${s.requirementCount} decisions:${s.decisionCount} findings:${s.totalFindings} (${s.criticalFindings} critical)`
        );
      }
      if (listSnapshots(state).length === 0) console.log(chalk.dim("No checkpoints yet. Run `vibe checkpoint`."));
    });
}

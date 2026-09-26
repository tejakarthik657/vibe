import { Command } from "commander";
import chalk from "chalk";
import { migrateJSONToSQLite } from "vibe-dev-storage";

export function registerMigrateStorage(program: Command) {
  program
    .command("migrate-storage")
    .description("Migrate VIBE JSON state and decision logs losslessly into relational SQLite database (.vibe/vibe.db)")
    .action(async () => {
      const root = process.cwd();
      console.log(chalk.bold("VIBE STORAGE MIGRATOR"));
      console.log(chalk.dim("Migrating .vibe/state.json and .vibe/decisions.json to .vibe/vibe.db..."));

      try {
        const res = await migrateJSONToSQLite(root);
        console.log(chalk.green(`✔ Storage Migration Completed Successfully!`));
        console.log(`  State Migrated:         ${res.migratedState ? chalk.bold("YES") : chalk.dim("NO (No state.json found)")}`);
        console.log(`  Decision Logs Migrated: ${chalk.bold(res.decisionLogsCount)} record(s)`);
        console.log(chalk.dim("\n  Database created at: .vibe/vibe.db (Node 22 SQLite Engine)"));
      } catch (err: any) {
        console.log(chalk.red(`✖ Storage Migration Failed: ${err.message}`));
      }
    });
}

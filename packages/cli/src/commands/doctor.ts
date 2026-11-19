import { Command } from "commander";
import chalk from "chalk";
import { VibeStore, runDoctor, generateDoctorSarif } from "vibe-dev-core";

export function registerDoctor(program: Command) {
  program
    .command("doctor")
    .description("Run an evidence-based engineering diagnostic")
    .option("-f, --format <format>", "text | json | sarif", "text")
    .option("--quiet", "Suppress non-error output")
    .action((opts) => {
      const root = process.cwd();
      if (!VibeStore.exists(root)) {
        VibeStore.init(root, require("path").basename(root));
        if (opts.format === "text" && !opts.quiet) {
          console.log(chalk.blue(`ℹ Auto-initialized VIBE for "${require("path").basename(root)}"`));
        }
      }
      const store = new VibeStore(root);
      const state = store.get();
      const findings = runDoctor(root, state);
      const hasCriticalOrHigh = findings.some(
        (f) => f.severity === "critical" || f.severity === "high"
      );

      if (opts.format === "sarif") {
        console.log(JSON.stringify(generateDoctorSarif(findings), null, 2));
        process.exitCode = hasCriticalOrHigh ? 1 : 0;
        return;
      }

      if (opts.format === "json") {
        console.log(JSON.stringify({ findings, count: findings.length, hasCriticalOrHigh }, null, 2));
        process.exitCode = hasCriticalOrHigh ? 1 : 0;
        return;
      }

      if (findings.length === 0) {
        if (!opts.quiet) console.log(chalk.green("✔ No issues found. Repository passes all diagnostic checks."));
        process.exitCode = 0;
        return;
      }

      if (!opts.quiet) {
        console.log(chalk.bold(`VIBE DOCTOR — ${findings.length} finding(s)`));
        console.log("");
        for (const f of findings) {
          const colorFn =
            f.severity === "critical"
              ? chalk.bgRed.white.bold
              : f.severity === "high"
              ? chalk.red.bold
              : f.severity === "medium"
              ? chalk.yellow.bold
              : chalk.dim;
          console.log(`${colorFn(` ${f.severity.toUpperCase()} `)} ${f.message}`);
          if (f.evidence) console.log(chalk.dim(`   evidence: ${f.evidence}`));
        }
      }

      process.exitCode = hasCriticalOrHigh ? 1 : 0;
    });
}

import { Command } from "commander";
import chalk from "chalk";
import { VibeStore, runDoctor } from "vibe-dev-core";

const COLORS: Record<string, (s: string) => string> = {
  critical: chalk.bgRed.white.bold,
  high: chalk.red.bold,
  medium: chalk.yellow,
  low: chalk.dim,
};

export function registerDoctor(program: Command) {
  program
    .command("doctor")
    .description("Run an evidence-based engineering diagnostic")
    .option("-f, --format <format>", "text | json", "text")
    .action((opts) => {
      const root = process.cwd();
      if (!VibeStore.exists(root)) {
        VibeStore.init(root, require("path").basename(root));
        if (opts.format !== "json") {
          console.log(chalk.blue(`ℹ Auto-initialized VIBE for "${require("path").basename(root)}"`));
        }
      }
      const store = new VibeStore(root);
      const state = store.get();
      const findings = runDoctor(root, state);

      if (opts.format === "json") {
        console.log(JSON.stringify({ findings, count: findings.length }, null, 2));
        if (findings.some((finding) => finding.severity === "critical" || finding.severity === "high")) {
          process.exitCode = 1;
        }
        return;
      }

      if (findings.length === 0) {
        console.log(chalk.green("✔ No issues found."));
        return;
      }

      console.log(chalk.bold(`VIBE DOCTOR — ${findings.length} finding(s)`));
      console.log("");
      for (const f of findings) {
        const colorFn = COLORS[f.severity] || chalk.white;
        console.log(`${colorFn(` ${f.severity.toUpperCase()} `)} ${f.message}`);
        if (f.evidence) console.log(chalk.dim(`   evidence: ${f.evidence}`));
      }
      if (findings.some((finding) => finding.severity === "critical" || finding.severity === "high")) {
        process.exitCode = 1;
      }
    });
}

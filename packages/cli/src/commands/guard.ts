import { Command } from "commander";
import chalk from "chalk";
import { VibeStore, getWorkingDiff, runGuard } from "@vibe/core";

export function registerGuard(program: Command) {
  program
    .command("guard")
    .description("Analyze uncommitted changes for scope, requirement impact and risk")
    .option("-f, --format <format>", "text | md", "text")
    .action(async (opts) => {
      const root = process.cwd();
      if (!VibeStore.exists(root)) {
        VibeStore.init(root, require("path").basename(root));
        console.log(chalk.blue(`ℹ Auto-initialized VIBE for "${require("path").basename(root)}"`));
      }
      const store = new VibeStore(root);
      const state = store.get();
      const diff = await getWorkingDiff(root);

      if (!diff.isRepo) {
        console.log(chalk.red("Not a git repository — `vibe guard` needs git to compute a diff."));
        process.exitCode = 1;
        return;
      }
      if (diff.changedFiles.length === 0) {
        console.log(chalk.green("✔ No working tree changes to review."));
        return;
      }

      const report = runGuard(root, state, diff);

      if (opts.format === "md") {
        printMarkdown(diff.changedFiles.length, report);
        if (report.overall === "blocked") process.exitCode = 1;
        return;
      }

      console.log(chalk.bold("VIBE GUARD"));
      console.log(chalk.dim(`${diff.changedFiles.length} file(s) changed`));
      console.log("");
      for (const check of report.checks) {
        const icon = check.status === "ok" ? chalk.green("✓") : check.status === "warning" ? chalk.yellow("⚠") : chalk.red("✗");
        console.log(`${icon} ${check.name.padEnd(28)} risk ${check.risk.toFixed(2)}  ${chalk.dim(check.detail)}`);
      }
      console.log("");
      const overallLabel =
        report.overall === "safe"
          ? chalk.green.bold("SAFE")
          : report.overall === "review"
          ? chalk.yellow.bold("REVIEW REQUIRED")
          : chalk.red.bold("BLOCKED");
      console.log(`Decision: ${overallLabel}`);
      if (report.affectedRequirements.length) {
        console.log(chalk.dim(`Affected requirements: ${report.affectedRequirements.join(", ")}`));
      }

      if (report.overall === "blocked") process.exitCode = 1;
    });
}

function printMarkdown(fileCount: number, report: ReturnType<typeof runGuard>) {
  const lines: string[] = [];
  lines.push(`### VIBE Guard`);
  lines.push(`${fileCount} file(s) changed.`);
  lines.push("");
  lines.push(`| Check | Risk | Detail |`);
  lines.push(`|---|---|---|`);
  for (const c of report.checks) {
    const icon = c.status === "ok" ? "✅" : c.status === "warning" ? "⚠️" : "🔴";
    lines.push(`| ${icon} ${c.name} | ${c.risk.toFixed(2)} | ${c.detail} |`);
  }
  lines.push("");
  const label = report.overall === "safe" ? "✅ SAFE" : report.overall === "review" ? "⚠️ REVIEW REQUIRED" : "🔴 BLOCKED";
  lines.push(`**Decision:** ${label}`);
  if (report.affectedRequirements.length) {
    lines.push(`**Affected requirements:** ${report.affectedRequirements.join(", ")}`);
  }
  console.log(lines.join("\n"));
}

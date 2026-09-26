import { Command } from "commander";
import chalk from "chalk";
import { VibeStore, getWorkingDiff, runGuard, computeDrift } from "vibe-dev-core";
import { DecisionRequest, Evidence } from "vibe-dev-decision-core";
import { RuleProvider } from "vibe-dev-provider-rules";
import { DecisionStore, evaluatePolicy, ProviderChain } from "vibe-dev-policy-engine";
import { getVibeConfig } from "./config";

export function registerGuard(program: Command) {
  program
    .command("guard")
    .description("Analyze uncommitted changes for scope, requirement impact and risk")
    .option("-f, --format <format>", "text | md", "text")
    .option("--no-ai", "Disable AI reasoning and force deterministic RulesProvider evaluation")
    .action(async (opts) => {
      const root = process.cwd();
      if (!VibeStore.exists(root)) {
        VibeStore.init(root, require("path").basename(root));
        console.log(chalk.blue(`[INFO] Auto-initialized VIBE for "${require("path").basename(root)}"`));
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
        console.log(chalk.green("[OK] No working tree changes to review."));
        return;
      }

      const report = runGuard(root, state, diff);
      const driftReport = computeDrift(state);

      // Build Evidence List for Phase 1 Decision Intelligence
      const evidenceList: Evidence[] = [];
      if (driftReport.undeclaredButDetected.length > 0) {
        evidenceList.push({
          type: "architecture-drift",
          source: "architecture.yaml",
          details: `Undeclared frameworks: ${driftReport.undeclaredButDetected.join(", ")}`,
          weight: 0.9,
        });
      }

      for (const check of report.checks) {
        if (check.status !== "ok") {
          evidenceList.push({
            type: check.name.includes("Secret") ? "secret-risk" : "dependency-change",
            source: "git-diff",
            details: check.detail,
            weight: check.risk,
          });
        }
      }

      const decisionReq: DecisionRequest = {
        id: `REQ-GUARD-${Date.now()}`,
        type: "choice",
        question: `Evaluate git diff change safety for ${diff.changedFiles.length} file(s)`,
        context: {
          project: state.project.name || "unknown",
          diffSummary: `${diff.changedFiles.length} file(s) changed`,
        },
        evidence: evidenceList,
        category: driftReport.undeclaredButDetected.length > 0 ? "architecture" : "general",
      };

      const aiDisabled = opts.ai === false || getVibeConfig(root).ai === "false";
      const apiKey = aiDisabled ? undefined : getVibeConfig(root).groq_api_key || process.env.GROQ_API_KEY;

      const providerChain = new ProviderChain(apiKey);
      const evalResult = await providerChain.evaluate(decisionReq);
      const decisionStore = new DecisionStore(root);
      const logRecord = decisionStore.logDecision(decisionReq, evalResult);

      if (opts.format === "md") {
        printMarkdown(diff.changedFiles.length, report, logRecord);
        if (logRecord.resolvedAction === "BLOCK") process.exitCode = 1;
        return;
      }

      console.log(chalk.bold("VIBE GUARD (Decision Intelligence V2)"));
      console.log(chalk.dim(`${diff.changedFiles.length} file(s) changed`));
      console.log("");
      for (const check of report.checks) {
        const icon = check.status === "ok" ? chalk.green("[OK]") : check.status === "warning" ? chalk.yellow("[WARN]") : chalk.red("[FAIL]");
        console.log(`${icon} ${check.name.padEnd(28)} risk ${check.risk.toFixed(2)}  ${chalk.dim(check.detail)}`);
      }
      console.log("");
      
      const actionColor =
        logRecord.resolvedAction === "ALLOW"
          ? chalk.green.bold
          : logRecord.resolvedAction === "WARN" || logRecord.resolvedAction === "REVIEW"
          ? chalk.yellow.bold
          : chalk.red.bold;

      console.log(`Evaluated Decision: ${logRecord.id} (Provider: ${evalResult.provider}, Confidence: ${logRecord.calculatedConfidence.toFixed(2)} [${logRecord.confidenceLevel}])`);
      console.log(`Action:             ${actionColor(logRecord.resolvedAction)}`);
      if (report.affectedRequirements.length) {
        console.log(chalk.dim(`Affected requirements: ${report.affectedRequirements.join(", ")}`));
      }
      if (logRecord.resolvedAction === "REVIEW" || logRecord.resolvedAction === "BLOCK") {
        console.log(chalk.dim(`\n  Tip: Run \`vibe decisions\` to inspect evidence, or \`vibe decision accept ${logRecord.id}\` to override.`));
      }

      if (logRecord.resolvedAction === "BLOCK") process.exitCode = 1;
    });
}

function printMarkdown(fileCount: number, report: ReturnType<typeof runGuard>, logRecord?: any) {
  const lines: string[] = [];
  lines.push(`### VIBE Guard (Decision Intelligence V2)`);
  lines.push(`${fileCount} file(s) changed.`);
  lines.push("");
  lines.push(`| Check | Risk | Detail |`);
  lines.push(`|---|---|---|`);
  for (const c of report.checks) {
    const icon = c.status === "ok" ? "OK" : c.status === "warning" ? "WARN" : "FAIL";
    lines.push(`| [${icon}] ${c.name} | ${c.risk.toFixed(2)} | ${c.detail} |`);
  }
  lines.push("");
  if (logRecord) {
    lines.push(`**Evaluated Decision:** ${logRecord.id} (Provider: ${logRecord.result.provider}, Confidence: ${logRecord.calculatedConfidence.toFixed(2)} [${logRecord.confidenceLevel}])`);
    lines.push(`**Resolved Action:** **${logRecord.resolvedAction}**`);
  } else {
    const label = report.overall === "safe" ? "SAFE" : report.overall === "review" ? "REVIEW REQUIRED" : "BLOCKED";
    lines.push(`**Decision:** **${label}**`);
  }
  if (report.affectedRequirements.length) {
    lines.push(`**Affected requirements:** ${report.affectedRequirements.join(", ")}`);
  }
  console.log(lines.join("\n"));
}

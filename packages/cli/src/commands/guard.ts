import { Command } from "commander";
import chalk from "chalk";
import {
  VibeStore,
  getWorkingDiff,
  runGuard,
  computeDrift,
  generateGuardSarif,
  redactSecrets,
} from "vibe-dev-core";
import { DecisionRequest, Evidence } from "vibe-dev-decision-core";
import { DecisionStore, ProviderChain } from "vibe-dev-policy-engine";
import { getVibeConfig } from "./config";

export function registerGuard(program: Command) {
  program
    .command("guard")
    .description("Analyze uncommitted changes for scope, requirement impact and risk")
    .option("-f, --format <format>", "text | json | md | sarif", "text")
    .option("--no-ai", "Disable AI reasoning and force deterministic RulesProvider evaluation")
    .option("--verbose", "Verbose diagnostic logging")
    .option("--quiet", "Quiet mode (output only decision action)")
    .action(async (opts) => {
      const root = process.cwd();
      if (!VibeStore.exists(root)) {
        VibeStore.init(root, require("path").basename(root));
        if (opts.format === "text" && !opts.quiet) {
          console.log(chalk.blue(`[INFO] Auto-initialized VIBE for "${require("path").basename(root)}"`));
        }
      }
      const store = new VibeStore(root);
      const state = store.get();
      const diff = await getWorkingDiff(root);

      if (!diff.isRepo) {
        if (opts.format === "json") {
          console.error(JSON.stringify({ error: "Not a git repository" }));
        } else {
          console.error(chalk.red("Not a git repository — `vibe guard` needs git to compute a diff."));
        }
        process.exitCode = 3;
        return;
      }

      if (diff.changedFiles.length === 0) {
        if (opts.format === "json") {
          console.log(JSON.stringify({ status: "clean", action: "ALLOW", changedFiles: 0 }));
        } else if (opts.format === "sarif") {
          const emptyReport = runGuard(root, state, diff);
          console.log(JSON.stringify(generateGuardSarif(emptyReport), null, 2));
        } else if (!opts.quiet) {
          console.log(chalk.green("[OK] No working tree changes to review. (Source: 0, Ignored: 0)"));
        }
        process.exitCode = 0;
        return;
      }

      const report = runGuard(root, state, diff);
      const driftReport = computeDrift(state);

      // Build Evidence List (secrets and sensitive paths redacted before AI evaluation)
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
            details: redactSecrets(check.detail),
            weight: check.risk,
          });
        }
      }

      const decisionReq: DecisionRequest = {
        id: `REQ-GUARD-${Date.now()}`,
        type: "choice",
        question: `Evaluate git diff change safety for ${diff.sourceFiles.length} source file(s)`,
        context: {
          project: state.project.name || "unknown",
          diffSummary: `${diff.sourceFiles.length} source file(s) changed, ${diff.ignoredFilesCount} ignored/generated`,
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

      // Enforce Action Invariant: if report.overall === "blocked" or risk >= 0.80, action MUST be BLOCK
      if (report.overall === "blocked" || report.checks.some((c) => c.status === "block" || c.risk >= 0.80)) {
        logRecord.resolvedAction = "BLOCK";
      } else if (report.overall === "review" && logRecord.resolvedAction === "ALLOW") {
        logRecord.resolvedAction = "REVIEW";
      }

      // Exit Code Mapping: 0 = ALLOW, 1 = REVIEW, 2 = BLOCK, 3 = error
      const exitCode = logRecord.resolvedAction === "BLOCK" ? 2 : logRecord.resolvedAction === "REVIEW" ? 1 : 0;

      // SARIF format
      if (opts.format === "sarif") {
        console.log(JSON.stringify(generateGuardSarif(report), null, 2));
        process.exitCode = exitCode;
        return;
      }

      // JSON format
      if (opts.format === "json") {
        console.log(
          JSON.stringify(
            {
              action: logRecord.resolvedAction,
              exitCode,
              overall: report.overall,
              metrics: report.metrics,
              checks: report.checks,
              affectedRequirements: report.affectedRequirements,
              decisionId: logRecord.id,
              provider: evalResult.provider,
              confidence: logRecord.calculatedConfidence,
            },
            null,
            2
          )
        );
        process.exitCode = exitCode;
        return;
      }

      // Markdown format
      if (opts.format === "md") {
        printMarkdown(report, logRecord);
        process.exitCode = exitCode;
        return;
      }

      // Quiet format
      if (opts.quiet) {
        console.log(logRecord.resolvedAction);
        process.exitCode = exitCode;
        return;
      }

      // Default Text format
      console.log(chalk.bold("VIBE GUARD (Decision Intelligence V2)"));
      console.log(
        chalk.dim(
          `Source files changed: ${report.metrics.sourceFilesChanged} | Ignored/generated: ${report.metrics.ignoredFilesCount} | Baseline: ${report.metrics.baseline}`
        )
      );
      console.log("");
      for (const check of report.checks) {
        const icon =
          check.status === "ok"
            ? chalk.green("[OK]")
            : check.status === "warning"
            ? chalk.yellow("[WARN]")
            : chalk.red("[FAIL]");
        console.log(
          `${icon} ${check.name.padEnd(28)} risk ${check.risk.toFixed(2)}  ${chalk.dim(check.detail)}`
        );
      }
      console.log("");

      const actionColor =
        logRecord.resolvedAction === "ALLOW"
          ? chalk.green.bold
          : logRecord.resolvedAction === "WARN" || logRecord.resolvedAction === "REVIEW"
          ? chalk.yellow.bold
          : chalk.red.bold;

      console.log(
        `Evaluated Decision: ${logRecord.id} (Provider: ${evalResult.provider}, Confidence: ${logRecord.calculatedConfidence.toFixed(2)} [${logRecord.confidenceLevel}])`
      );
      console.log(`Action:             ${actionColor(logRecord.resolvedAction)}`);
      if (report.affectedRequirements.length) {
        console.log(chalk.dim(`Affected requirements: ${report.affectedRequirements.join(", ")}`));
      }
      if (logRecord.resolvedAction === "REVIEW" || logRecord.resolvedAction === "BLOCK") {
        console.log(
          chalk.dim(
            `\n  Tip: Run \`vibe decisions\` to inspect evidence, or \`vibe override ${logRecord.id} -r "reason"\` to override.`
          )
        );
      }

      process.exitCode = exitCode;
    });
}

function printMarkdown(report: ReturnType<typeof runGuard>, logRecord?: any) {
  const lines: string[] = [];
  lines.push(`### VIBE Guard (Decision Intelligence V2)`);
  lines.push(`- **Source files changed:** ${report.metrics.sourceFilesChanged}`);
  lines.push(`- **Ignored / generated files:** ${report.metrics.ignoredFilesCount}`);
  lines.push(`- **Diff Baseline:** ${report.metrics.baseline}`);
  lines.push("");
  lines.push(`| Check | Risk | Detail |`);
  lines.push(`|---|---|---|`);
  for (const c of report.checks) {
    const icon = c.status === "ok" ? "OK" : c.status === "warning" ? "WARN" : "FAIL";
    lines.push(`| [${icon}] ${c.name} | ${c.risk.toFixed(2)} | ${c.detail} |`);
  }
  lines.push("");
  if (logRecord) {
    lines.push(
      `**Evaluated Decision:** ${logRecord.id} (Provider: ${logRecord.result.provider}, Confidence: ${logRecord.calculatedConfidence.toFixed(2)} [${logRecord.confidenceLevel}])`
    );
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

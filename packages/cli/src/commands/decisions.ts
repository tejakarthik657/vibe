import { Command } from "commander";
import chalk from "chalk";
import { DecisionStore } from "vibe-dev-policy-engine";
import { VibeStore, addDecision } from "vibe-dev-core";
import * as path from "path";

const ACTION_COLOR: Record<string, (s: string) => string> = {
  ALLOW: chalk.green.bold,
  WARN: chalk.yellow.bold,
  REVIEW: chalk.yellow.bold,
  BLOCK: chalk.red.bold,
  ESCALATE: chalk.bgRed.white.bold,
};

export function registerDecisionsAudit(program: Command) {
  program
    .command("decisions [id...]")
    .description("Inspect decision evaluation history and auditable evidence logs")
    .action((idParts: string[]) => {
      const root = process.cwd();
      const store = new DecisionStore(root);
      const queryId = Array.isArray(idParts) ? idParts.join(" ").trim() : "";

      if (queryId) {
        showSingleDecision(root, queryId);
        return;
      }

      const logs = store.getLogs();
      if (logs.length === 0) {
        console.log(chalk.dim("No decisions evaluated yet in decision history. Run `vibe guard` or `vibe doctor`."));
        return;
      }

      console.log(chalk.bold(`\nVIBE DECISION EVALUATION HISTORY (${logs.length} logged)`));
      console.log(chalk.dim("=============================================================\n"));

      for (const log of logs) {
        const actionColor = ACTION_COLOR[log.resolvedAction] || chalk.white;
        const overrideTag = log.override ? chalk.magenta(` [OVERRIDDEN -> ${log.override.userAction}]`) : "";
        console.log(
          `${chalk.cyan(log.id)} [${log.timestamp.slice(0, 19)}] provider:${chalk.yellow(log.result.provider)} confidence:${log.calculatedConfidence.toFixed(2)} (${log.confidenceLevel}) action:${actionColor(log.resolvedAction)}${overrideTag}`
        );
        console.log(chalk.dim(`  q: ${log.request.question}`));
        if (log.result.reasoning) {
          console.log(chalk.dim(`  reason: ${log.result.reasoning}`));
        }
      }
      console.log(chalk.dim("\n  Run `vibe decisions <id>` for detailed evidence breakdown.\n"));
    });

  program
    .command("override <id>")
    .description("Human override: Accept a REVIEW or BLOCK decision and auto-record an ADR")
    .option("-r, --reason <reason>", "Rationale for human override", "Developer accepted risk")
    .action((id: string, opts) => {
      const root = process.cwd();
      const decisionStore = new DecisionStore(root);
      const vibeStore = new VibeStore(root);
      const state = vibeStore.get();

      const record = decisionStore.getLogs().find((r) => r.id.toLowerCase() === id.toLowerCase());
      if (!record) {
        console.log(chalk.red(`No decision record matching "${id}" found.`));
        return;
      }

      // Record ADR in engineering graph
      const adrTitle = `Override: ${record.request.question}`;
      const adrContext = `Human override on ${record.id} (${record.resolvedAction}). Original provider: ${record.result.provider} (conf ${record.calculatedConfidence.toFixed(2)})`;
      const adrDecision = opts.reason || "Developer manually accepted architectural risk.";
      
      const adr = addDecision(state, adrTitle, adrContext, adrDecision, "", {
        source: "developer",
        confidence: 1,
      });
      vibeStore.set(state);
      vibeStore.save();

      // Record human override
      decisionStore.recordOverride(record.id, "ALLOW", adrDecision, "developer", adr.id);

      console.log(chalk.green(`✔ Recorded Human Override on ${record.id}`));
      console.log(chalk.green(`✔ Auto-created ${adr.id}: ${adr.title}`));
      console.log(chalk.dim(`  Rationale: ${adrDecision}`));
    });
}

function showSingleDecision(root: string, id: string) {
  const store = new DecisionStore(root);
  const record = store.getLogs().find((r) => r.id.toLowerCase() === id.toLowerCase());

  if (!record) {
    console.log(chalk.red(`No decision record matching "${id}" found.`));
    return;
  }

  const actionColor = ACTION_COLOR[record.resolvedAction] || chalk.white;
  console.log(chalk.bold(`\nDECISION EVALUATION DETAILS — ${record.id}`));
  console.log(chalk.dim("============================================================="));
  console.log(`Question:    ${chalk.bold(record.request.question)}`);
  console.log(`Category:    ${record.request.category || "general"}`);
  console.log(`Provider:    ${chalk.yellow(record.result.provider)}`);
  console.log(`Confidence:  ${record.calculatedConfidence.toFixed(2)} (${record.confidenceLevel})`);
  console.log(`Action:      ${actionColor(record.resolvedAction)}`);
  console.log(`Timestamp:   ${record.timestamp}`);
  if (record.result.reasoning) {
    console.log(`Reasoning:   ${record.result.reasoning}`);
  }

  console.log(chalk.bold("\nAttached Evidence:"));
  if (record.result.evidence && record.result.evidence.length > 0) {
    for (const ev of record.result.evidence) {
      console.log(`  - [${ev.type.toUpperCase()}] weight:${ev.weight.toFixed(2)} source:${ev.source}`);
      console.log(chalk.dim(`    ${ev.details}`));
    }
  } else {
    console.log(chalk.dim("  (No attached evidence records)"));
  }

  if (record.override) {
    console.log(chalk.bold.magenta("\nHuman Override Record:"));
    console.log(`  Override Action: ${record.override.userAction}`);
    console.log(`  Reason:          ${record.override.reason}`);
    console.log(`  By:              ${record.override.overrideBy}`);
    if (record.override.adrId) {
      console.log(`  Linked ADR:      ${record.override.adrId}`);
    }
  }
  console.log("");
}

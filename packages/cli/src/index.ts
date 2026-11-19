import { Command } from "commander";
import chalk from "chalk";
import { registerInit } from "./commands/init";
import { registerScan } from "./commands/scan";
import { registerStatus } from "./commands/status";
import { registerRequirement } from "./commands/requirement";
import { registerDecision } from "./commands/decision";
import { registerContext } from "./commands/context";
import { registerTrace } from "./commands/trace";
import { registerWhy } from "./commands/why";
import { registerDoctor } from "./commands/doctor";
import { registerGuard } from "./commands/guard";
import { registerConstraint } from "./commands/constraint";
import { registerTask } from "./commands/task";
import { registerArchitect, registerDrift } from "./commands/architect";
import { registerImpact } from "./commands/impact";
import { registerCheckpoint } from "./commands/checkpoint";
import { registerExplain } from "./commands/explain";
import { registerOnboard } from "./commands/onboard";
import { registerHooks } from "./commands/hooks";
import { registerBootstrap } from "./commands/bootstrap";
import { registerDecisionsAudit } from "./commands/decisions";
import { registerConfig } from "./commands/config";
import { registerTestProviders } from "./commands/test-providers";
import { registerMigrateStorage } from "./commands/migrate-storage";

const program = new Command();

program
  .name("vibe")
  .allowUnknownOption()
  .description("VIBE — the engineering intelligence layer for AI-assisted development.")
  .version("0.4.5")
  .option("-q, --quiet", "Suppress non-essential console logs")
  .option("-v, --verbose", "Enable verbose diagnostic logs")
  .option("--debug", "Enable debug information (files considered, ignored, evidence, provider)")
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.debug) {
      process.env.VIBE_DEBUG = "true";
      console.log(chalk.magenta("[DEBUG] VIBE Debug Mode active"));
    }
  });

// Foundation
registerInit(program);
registerScan(program);
registerStatus(program);
registerOnboard(program);
registerHooks(program);
registerBootstrap(program);
registerDecisionsAudit(program);
registerConfig(program);
registerTestProviders(program);
registerMigrateStorage(program);

// Architecture memory
registerRequirement(program);
registerDecision(program);
registerContext(program);
registerTrace(program);
registerWhy(program);
registerDoctor(program);
registerGuard(program);

// V1 — engineering foundation additions
registerConstraint(program);
registerTask(program);
registerArchitect(program);
registerDrift(program);
registerImpact(program);
registerCheckpoint(program);
registerExplain(program);

// Autocorrect / typo tolerance
const knownCommands = [
  "init", "scan", "adopt", "status", "requirement", "req", "decision", "adr",
  "context", "trace", "why", "doctor", "guard", "constraint", "con", "task",
  "architect", "drift", "impact", "checkpoint", "explain", "onboard", "welcome",
  "install-hooks", "hooks", "bootstrap", "decisions", "override", "config", "test-providers",
  "migrate-storage", "help"
];

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

program.on("command:*", (operands: string[]) => {
  const unknown = operands[0];
  let closest = "";
  let minDistance = 3; // only suggest if distance <= 2
  for (const cmd of knownCommands) {
    const d = levenshtein(unknown, cmd);
    if (d < minDistance) {
      minDistance = d;
      closest = cmd;
    }
  }
  if (closest) {
    console.error(chalk.red(`Unknown command: "${unknown}". Did you mean "vibe ${closest}"?`));
  } else {
    console.error(chalk.red(`Unknown command: "${unknown}". Run \`vibe --help\` for available commands.`));
  }
  process.exitCode = 1;
});

program.parse(process.argv);

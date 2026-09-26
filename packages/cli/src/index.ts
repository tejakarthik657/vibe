import { Command } from "commander";
import { registerInit } from "./commands/init";
import { registerScan } from "./commands/scan";
import { registerStatus } from "./commands/status";
import { registerRequirement } from "./commands/requirement";
import { registerDecision } from "./commands/decision";
import { registerContext } from "./commands/context";
import { registerTrace } from "./commands/trace";
import { registerDoctor } from "./commands/doctor";
import { registerGuard } from "./commands/guard";
import { registerWhy } from "./commands/why";
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

const program = new Command();

program
  .name("vibe")
  .allowUnknownOption()
  .description("VIBE — the engineering intelligence layer for AI-assisted development.")
  .version("0.1.1");

// Foundation
registerInit(program);
registerScan(program);
registerStatus(program);
registerOnboard(program);
registerHooks(program);
registerBootstrap(program);
registerDecisionsAudit(program);

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

// Pre-process natural language args if unknown top-level command is supplied
const knownCommands = [
  "init", "scan", "adopt", "status", "requirement", "req", "decision", "adr",
  "context", "trace", "why", "doctor", "guard", "constraint", "con", "task",
  "architect", "drift", "impact", "checkpoint", "explain", "onboard", "welcome",
  "install-hooks", "hooks", "bootstrap", "decisions", "help"
];

const rawArgs = process.argv.slice(2);
if (rawArgs.length > 0 && !rawArgs[0].startsWith("-") && !knownCommands.includes(rawArgs[0])) {
  const fullText = rawArgs.join(" ").toLowerCase();
  
  if (fullText.includes("onboard") || fullText.includes("welcome") || fullText.includes("start")) {
    process.argv = [process.argv[0], process.argv[1], "onboard"];
  } else if (fullText.includes("hook") || fullText.includes("git")) {
    process.argv = [process.argv[0], process.argv[1], "install-hooks"];
  } else if (fullText.includes("bootstrap") || fullText.includes("preset") || fullText.includes("template")) {
    process.argv = [process.argv[0], process.argv[1], "bootstrap", fullText];
  } else if (fullText.includes("task") || fullText.includes("todo")) {
    const title = rawArgs.filter(a => a.toLowerCase() !== "task" && a.toLowerCase() !== "add").join(" ");
    process.argv = [process.argv[0], process.argv[1], "task", "add", title || fullText];
  } else if (fullText.includes("req") || fullText.includes("requirement")) {
    const text = rawArgs.filter(a => !["req", "requirement", "add"].includes(a.toLowerCase())).join(" ");
    process.argv = [process.argv[0], process.argv[1], "req", "add", text || fullText];
  } else if (fullText.includes("decision") || fullText.includes("adr")) {
    const title = rawArgs.filter(a => !["decision", "adr", "add"].includes(a.toLowerCase())).join(" ");
    process.argv = [process.argv[0], process.argv[1], "adr", "add", title || fullText];
  } else if (fullText.includes("constraint") || fullText.includes("con")) {
    const text = rawArgs.filter(a => !["constraint", "con", "add"].includes(a.toLowerCase())).join(" ");
    process.argv = [process.argv[0], process.argv[1], "con", "add", text || fullText];
  } else if (fullText.includes("doctor") || fullText.includes("diagnose") || fullText.includes("health")) {
    process.argv = [process.argv[0], process.argv[1], "doctor"];
  } else if (fullText.includes("scan") || fullText.includes("analyze")) {
    process.argv = [process.argv[0], process.argv[1], "scan"];
  } else if (fullText.includes("guard") || fullText.includes("review")) {
    process.argv = [process.argv[0], process.argv[1], "guard"];
  } else if (fullText.includes("context")) {
    const task = rawArgs.filter(a => a.toLowerCase() !== "context").join(" ");
    process.argv = [process.argv[0], process.argv[1], "context", task || "general task"];
  } else if (fullText.includes("status") || fullText.includes("overview")) {
    process.argv = [process.argv[0], process.argv[1], "status"];
  } else if (fullText.includes("checkpoint") || fullText.includes("snapshot")) {
    process.argv = [process.argv[0], process.argv[1], "checkpoint"];
  }
}

program.parseAsync(process.argv);

import { Command } from "commander";
import chalk from "chalk";
import { VibeStore, addConstraint, listConstraints, Constraint } from "vibe-dev-core";

const SEVERITY_COLOR: Record<Constraint["severity"], (s: string) => string> = {
  critical: chalk.bgRed.white.bold,
  warning: chalk.yellow,
  info: chalk.dim,
};

export function registerConstraint(program: Command) {
  const cmd = program.command("constraint").alias("con").description("Manage engineering constraints (things that must never happen)");

  cmd
    .command("add [text...]")
    .allowUnknownOption()
    .description("Add a constraint")
    .option("-s, --severity <severity>", "info | warning | critical", "warning")
    .action((textParts: string[], opts) => {
      let parts = Array.isArray(textParts) ? [...textParts] : [String(textParts || "")];
      let severity = opts.severity || "warning";

      const sIdx = parts.findIndex(p => p === "--severity" || p === "-s");
      if (sIdx !== -1 && parts[sIdx + 1]) {
        severity = parts[sIdx + 1];
        parts.splice(sIdx, 2);
      }

      const text = parts.join(" ").trim();
      if (!text) {
        console.log(chalk.red("Please provide constraint text. E.g.: vibe con Do not commit API keys"));
        return;
      }
      const root = process.cwd();
      const store = new VibeStore(root);
      const state = store.get();
      const validSeverity = ["info", "warning", "critical"].includes(severity) ? severity as Constraint["severity"] : "warning";
      const constraint = addConstraint(state, text, validSeverity);
      store.set(state);
      store.save();
      console.log(chalk.green(`✔ Added ${constraint.id} [${constraint.severity}]: ${constraint.text}`));
    });

  cmd
    .command("list")
    .description("List all constraints")
    .action(() => {
      const root = process.cwd();
      const state = new VibeStore(root).get();
      for (const c of listConstraints(state)) {
        const colorFn = SEVERITY_COLOR[c.severity];
        console.log(`${c.id} ${colorFn(` ${c.severity.toUpperCase()} `)} ${c.text}`);
      }
      if (listConstraints(state).length === 0) console.log(chalk.dim("No constraints recorded yet."));
    });

  // Fallback default action for `vibe con Never expose private keys`
  cmd
    .arguments("[args...]")
    .action((args: string[]) => {
      if (!args || args.length === 0) {
        const root = process.cwd();
        const state = new VibeStore(root).get();
        for (const c of listConstraints(state)) {
          const colorFn = SEVERITY_COLOR[c.severity];
          console.log(`${c.id} ${colorFn(` ${c.severity.toUpperCase()} `)} ${c.text}`);
        }
        if (listConstraints(state).length === 0) console.log(chalk.dim("No constraints recorded yet."));
        return;
      }

      const knownSubcommands = ["add", "list"];
      if (knownSubcommands.includes(args[0])) return;

      const text = args.join(" ").trim();
      const root = process.cwd();
      const store = new VibeStore(root);
      const state = store.get();
      const constraint = addConstraint(state, text, "warning");
      store.set(state);
      store.save();
      console.log(chalk.green(`✔ Added ${constraint.id} [${constraint.severity}]: ${constraint.text}`));
    });
}

import { Command } from "commander";
import chalk from "chalk";
import { VibeStore, addDecision, listDecisions } from "@vibe/core";

export function registerDecision(program: Command) {
  const cmd = program.command("decision").alias("adr").description("Manage architecture decisions");

  cmd
    .command("add [title...]")
    .description("Record a new architecture decision")
    .option("-c, --context <context>", "Why this decision came up", "")
    .option("-d, --decision <decision>", "What was decided", "")
    .option("-q, --consequences <consequences>", "Trade-offs / consequences", "")
    .action((titleParts: string[], opts) => {
      const title = Array.isArray(titleParts) ? titleParts.join(" ").trim() : String(titleParts || "").trim();
      if (!title) {
        console.log(chalk.red("Please provide decision title. E.g.: vibe adr Use Postgres for user database"));
        return;
      }
      const root = process.cwd();
      const store = new VibeStore(root);
      const state = store.get();
      const contextText = opts.context || `Developer decision: ${title}`;
      const decisionText = opts.decision || title;
      const record = addDecision(state, title, contextText, decisionText, opts.consequences || "", {
        source: "developer",
        confidence: 1,
      });
      store.set(state);
      store.save();
      console.log(chalk.green(`✔ Recorded ${record.id}: ${record.title}`));
    });

  cmd
    .command("list")
    .description("List all decisions")
    .action(() => {
      const root = process.cwd();
      const state = new VibeStore(root).get();
      for (const d of listDecisions(state)) {
        console.log(`${chalk.magenta(d.id)} ${d.title}`);
        console.log(chalk.dim(`  context: ${d.context}`));
        console.log(chalk.dim(`  decision: ${d.decision}`));
        if (d.consequences) console.log(chalk.dim(`  consequences: ${d.consequences}`));
      }
    });

  // Fallback default action for `vibe adr Use PostgreSQL` without subcommand `add`
  cmd
    .arguments("[args...]")
    .action((args: string[]) => {
      if (!args || args.length === 0) {
        const root = process.cwd();
        const state = new VibeStore(root).get();
        for (const d of listDecisions(state)) {
          console.log(`${chalk.magenta(d.id)} ${d.title}`);
          console.log(chalk.dim(`  context: ${d.context}`));
          console.log(chalk.dim(`  decision: ${d.decision}`));
          if (d.consequences) console.log(chalk.dim(`  consequences: ${d.consequences}`));
        }
        return;
      }

      const knownSubcommands = ["add", "list"];
      if (knownSubcommands.includes(args[0])) return;

      const title = args.join(" ").trim();
      const root = process.cwd();
      const store = new VibeStore(root);
      const state = store.get();
      const record = addDecision(state, title, `Developer decision: ${title}`, title, "", {
        source: "developer",
        confidence: 1,
      });
      store.set(state);
      store.save();
      console.log(chalk.green(`✔ Recorded ${record.id}: ${record.title}`));
    });
}

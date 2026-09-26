import { Command } from "commander";
import chalk from "chalk";
import { VibeStore, addRequirement, linkRequirementToFile, listRequirements } from "vibe-dev-core";

export function registerRequirement(program: Command) {
  const cmd = program.command("requirement").alias("req").description("Manage requirements");

  cmd
    .command("add [text...]")
    .allowUnknownOption()
    .description("Add a new requirement")
    .option("-t, --tags <tags>", "Comma separated tags", "")
    .action((textParts: string[], opts) => {
      let parts = Array.isArray(textParts) ? [...textParts] : [String(textParts || "")];
      let tags = opts.tags ? opts.tags.split(",").map((t: string) => t.trim()) : [];
      
      const tagIdx = parts.findIndex(p => p === "--tags" || p === "-t");
      if (tagIdx !== -1 && parts[tagIdx + 1]) {
        tags = parts[tagIdx + 1].split(",").map((t: string) => t.trim());
        parts.splice(tagIdx, 2);
      }

      const text = parts.join(" ").trim();
      if (!text) {
        console.log(chalk.red("Please provide requirement text. E.g.: vibe req add OAuth authentication"));
        return;
      }
      const root = process.cwd();
      const store = new VibeStore(root);
      const state = store.get();
      const req = addRequirement(state, text, tags);
      store.set(state);
      store.save();
      console.log(chalk.green(`✔ Added ${req.id}: ${req.text}`));
      if (tags.length) console.log(chalk.dim(`  tags: ${tags.join(", ")}`));
    });

  cmd
    .command("link <reqId> <filePath>")
    .description("Link a requirement to a file (run `vibe scan` first)")
    .action((reqId: string, filePath: string) => {
      const root = process.cwd();
      const store = new VibeStore(root);
      const state = store.get();
      const ok = linkRequirementToFile(state, reqId, filePath);
      if (!ok) {
        console.log(chalk.red(`No requirement ${reqId} found.`));
        process.exitCode = 1;
        return;
      }
      store.set(state);
      store.save();
      console.log(chalk.green(`✔ Linked ${reqId} → ${filePath}`));
    });

  cmd
    .command("list")
    .description("List all requirements")
    .action(() => {
      const root = process.cwd();
      const state = new VibeStore(root).get();
      for (const r of listRequirements(state)) {
        console.log(`${chalk.cyan(r.id)} [${r.status}] ${r.text}`);
        if (r.linkedFiles.length) console.log(chalk.dim(`  files: ${r.linkedFiles.join(", ")}`));
      }
    });

  // Fallback default action for `vibe req add google auth` without subcommand `add`
  cmd
    .arguments("[args...]")
    .action((args: string[]) => {
      if (!args || args.length === 0) {
        const root = process.cwd();
        const state = new VibeStore(root).get();
        for (const r of listRequirements(state)) {
          console.log(`${chalk.cyan(r.id)} [${r.status}] ${r.text}`);
          if (r.linkedFiles.length) console.log(chalk.dim(`  files: ${r.linkedFiles.join(", ")}`));
        }
        return;
      }

      const knownSubcommands = ["add", "link", "list"];
      if (knownSubcommands.includes(args[0])) return;

      const text = args.join(" ").trim();
      const root = process.cwd();
      const store = new VibeStore(root);
      const state = store.get();
      const req = addRequirement(state, text, []);
      store.set(state);
      store.save();
      console.log(chalk.green(`✔ Added ${req.id}: ${req.text}`));
    });
}

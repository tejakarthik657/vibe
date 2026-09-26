import { Command } from "commander";
import chalk from "chalk";
import { VibeStore, setDeclaredArchitecture, computeDrift } from "@vibe/core";

export function registerArchitect(program: Command) {
  const cmd = program.command("architect").description("Declare and inspect intended architecture");

  cmd
    .command("set [frameworks...]")
    .description("Declare the intended architecture (source of truth for drift detection)")
    .option("-f, --frameworks <list>", "Comma separated framework/stack names, e.g. Next.js,NestJS")
    .option("--database <database>", "Primary database, e.g. PostgreSQL")
    .option("-n, --notes <notes>", "Free-text notes", "")
    .action((frameworkParts: string[], opts) => {
      const root = process.cwd();
      if (!VibeStore.exists(root)) {
        VibeStore.init(root, require("path").basename(root));
        console.log(chalk.blue(`ℹ Auto-initialized VIBE for "${require("path").basename(root)}"`));
      }
      const store = new VibeStore(root);
      const state = store.get();
      let frameworksStr = opts.frameworks || (Array.isArray(frameworkParts) ? frameworkParts.join(" ") : "");
      if (!frameworksStr) {
        console.log(chalk.red("Please specify framework names. E.g.: vibe architect set Next.js Express PostgreSQL"));
        return;
      }
      const frameworks = frameworksStr.split(/[\s,]+/).map((f: string) => f.trim()).filter(Boolean);
      const arch = setDeclaredArchitecture(state, frameworks, opts.database, opts.notes);
      store.set(state);
      store.save();
      console.log(chalk.green(`✔ Declared architecture: ${arch.frameworks.join(", ")}${arch.database ? ` + ${arch.database}` : ""}`));
    });

  cmd
    .command("show")
    .description("Show the declared architecture")
    .action(() => {
      const root = process.cwd();
      const state = new VibeStore(root).get();
      if (!state.architecture) {
        console.log(chalk.yellow("No architecture declared yet. Run `vibe architect set --frameworks ...`."));
        return;
      }
      console.log(chalk.bold("Declared frameworks:"), state.architecture.frameworks.join(", "));
      if (state.architecture.database) console.log(chalk.bold("Database:"), state.architecture.database);
      if (state.architecture.notes) console.log(chalk.bold("Notes:"), state.architecture.notes);
      console.log(chalk.dim(`Set at ${state.architecture.setAt}`));
    });
}

export function registerDrift(program: Command) {
  program
    .command("drift")
    .description("Compare declared architecture against what was actually detected in the last scan")
    .action(() => {
      const root = process.cwd();
      const state = new VibeStore(root).get();
      const report = computeDrift(state);

      if (!report.hasDeclaration) {
        console.log(chalk.yellow("No architecture declared. Run `vibe architect set` first, then `vibe scan`."));
        return;
      }
      console.log(chalk.bold("ARCHITECTURE DRIFT"));
      console.log("");
      if (report.matching.length) {
        console.log(chalk.green("✓ Matching:"), report.matching.join(", "));
      }
      if (report.undeclaredButDetected.length) {
        console.log(chalk.yellow("⚠ Detected but not declared:"), report.undeclaredButDetected.join(", "));
        console.log(chalk.dim("  This isn't necessarily wrong — it may be an intentional change not yet recorded."));
      }
      if (report.declaredButNotDetected.length) {
        console.log(chalk.yellow("⚠ Declared but not detected in code:"), report.declaredButNotDetected.join(", "));
      }
      if (!report.undeclaredButDetected.length && !report.declaredButNotDetected.length) {
        console.log(chalk.green("✔ No drift detected."));
      }
    });
}

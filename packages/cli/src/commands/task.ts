import { Command } from "commander";
import chalk from "chalk";
import { VibeStore, addTask, setTaskStatus, listTasks, Task } from "vibe-dev-core";

const STATUS_ICON: Record<Task["status"], string> = {
  todo: "○",
  in_progress: "◐",
  done: "●",
};

export function registerTask(program: Command) {
  const cmd = program.command("task").description("Manage bounded engineering tasks");

  cmd
    .command("add [title...]")
    .description("Create a task, optionally scoped to requirements")
    .option("-d, --description <description>", "Task description", "")
    .option("-r, --requirements <ids>", "Comma separated requirement IDs (e.g. REQ-001,REQ-002)", "")
    .action((titleParts: string[], opts) => {
      const title = Array.isArray(titleParts) ? titleParts.join(" ").trim() : String(titleParts || "").trim();
      if (!title) {
        console.log(chalk.red("Please provide a task title. E.g.: vibe task add add authentication"));
        return;
      }
      const root = process.cwd();
      const store = new VibeStore(root);
      const state = store.get();
      const reqIds = opts.requirements ? opts.requirements.split(",").map((s: string) => s.trim()) : [];
      const task = addTask(state, title, opts.description, reqIds);
      store.set(state);
      store.save();
      console.log(chalk.green(`✔ Created ${task.id}: ${task.title}`));
      if (reqIds.length) console.log(chalk.dim(`  scoped to: ${reqIds.join(", ")}`));
    });

  cmd
    .command("done <taskId>")
    .description("Mark a task as done")
    .action((taskId: string) => {
      const root = process.cwd();
      const store = new VibeStore(root);
      const state = store.get();
      const ok = setTaskStatus(state, taskId, "done");
      if (!ok) {
        console.log(chalk.red(`No task ${taskId} found.`));
        process.exitCode = 1;
        return;
      }
      store.set(state);
      store.save();
      console.log(chalk.green(`✔ ${taskId} marked done.`));
    });

  cmd
    .command("start <taskId>")
    .description("Mark a task as in progress")
    .action((taskId: string) => {
      const root = process.cwd();
      const store = new VibeStore(root);
      const state = store.get();
      const ok = setTaskStatus(state, taskId, "in_progress");
      if (!ok) {
        console.log(chalk.red(`No task ${taskId} found.`));
        process.exitCode = 1;
        return;
      }
      store.set(state);
      store.save();
      console.log(chalk.green(`✔ ${taskId} marked in progress.`));
    });

  cmd
    .command("list")
    .description("List all tasks")
    .action(() => {
      const root = process.cwd();
      const state = new VibeStore(root).get();
      for (const t of listTasks(state)) {
        console.log(`${STATUS_ICON[t.status]} ${chalk.cyan(t.id)} ${t.title}`);
        if (t.requirementIds.length) console.log(chalk.dim(`    scope: ${t.requirementIds.join(", ")}`));
      }
      if (listTasks(state).length === 0) console.log(chalk.dim("No tasks yet."));
    });

  // Fallback default action for `vibe task add authentication` without sub-command `add`
  cmd
    .arguments("[args...]")
    .action((args: string[]) => {
      if (!args || args.length === 0) {
        // Just list tasks if vibe task is called with no args
        const root = process.cwd();
        const state = new VibeStore(root).get();
        for (const t of listTasks(state)) {
          console.log(`${STATUS_ICON[t.status]} ${chalk.cyan(t.id)} ${t.title}`);
          if (t.requirementIds.length) console.log(chalk.dim(`    scope: ${t.requirementIds.join(", ")}`));
        }
        if (listTasks(state).length === 0) console.log(chalk.dim("No tasks yet."));
        return;
      }

      const knownSubcommands = ["add", "done", "start", "list"];
      if (knownSubcommands.includes(args[0])) return;

      const title = args.join(" ").trim();
      const root = process.cwd();
      const store = new VibeStore(root);
      const state = store.get();
      const task = addTask(state, title, "", []);
      store.set(state);
      store.save();
      console.log(chalk.green(`✔ Created ${task.id}: ${task.title}`));
    });
}

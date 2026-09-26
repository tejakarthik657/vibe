import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";

export function getVibeConfig(root: string): Record<string, string> {
  const cfgPath = path.join(root, ".vibe", "config.json");
  if (!fs.existsSync(cfgPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(cfgPath, "utf-8"));
  } catch {
    return {};
  }
}

export function registerConfig(program: Command) {
  const cmd = program.command("config").description("Manage local VIBE configuration & secure API keys");

  cmd
    .command("set <key> [value...]")
    .description("Set a configuration setting (e.g. vibe config set groq_api_key gsk_...)")
    .action((key: string, valParts: string[]) => {
      const root = process.cwd();
      const vibeDir = path.join(root, ".vibe");
      if (!fs.existsSync(vibeDir)) fs.mkdirSync(vibeDir, { recursive: true });

      const cfgPath = path.join(vibeDir, "config.json");
      const config = getVibeConfig(root);
      const val = Array.isArray(valParts) ? valParts.join(" ").trim() : String(valParts || "").trim();

      config[key.toLowerCase()] = val;
      fs.writeFileSync(cfgPath, JSON.stringify(config, null, 2), "utf-8");

      const maskedVal = val.length > 8 ? `${val.slice(0, 7)}...${val.slice(-4)}` : "*****";
      console.log(chalk.green(`✔ Saved config setting "${key}" = ${maskedVal}`));
      console.log(chalk.dim(`  Stored locally in .vibe/config.json (git-ignored)`));
    });

  cmd
    .command("show")
    .description("Display local VIBE configuration")
    .action(() => {
      const root = process.cwd();
      const config = getVibeConfig(root);
      console.log(chalk.bold("LOCAL VIBE CONFIGURATION"));
      console.log(chalk.dim("============================================================="));
      if (Object.keys(config).length === 0) {
        console.log(chalk.dim("No custom config set. Set with `vibe config set groq_api_key <key>`"));
        return;
      }
      for (const [k, v] of Object.entries(config)) {
        const masked = v.length > 8 ? `${v.slice(0, 7)}...${v.slice(-4)}` : "*****";
        console.log(`  ${chalk.cyan(k)}: ${masked}`);
      }
    });
}

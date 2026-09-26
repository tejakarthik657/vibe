import { Command } from "commander";
import chalk from "chalk";
import { DecisionRequest } from "vibe-dev-decision-core";
import { RuleProvider } from "vibe-dev-provider-rules";
import { LLMProvider } from "vibe-dev-provider-llm";
import { getVibeConfig } from "./config";

export function registerTestProviders(program: Command) {
  program
    .command("test-providers")
    .description("Compare decision accuracy, confidence, latency, and reasoning across providers (Rules vs Groq LLM)")
    .action(async () => {
      const root = process.cwd();
      const apiKey = getVibeConfig(root).groq_api_key || process.env.GROQ_API_KEY;

      const ruleProvider = new RuleProvider();
      const llmProvider = new LLMProvider({ apiKey });

      console.log(chalk.bold("VIBE V2 — DECISION PROVIDER BENCHMARK & COMPARISON MATRIX"));
      console.log(chalk.dim("=========================================================================="));
      if (!llmProvider.isConfigured()) {
        console.log(chalk.yellow("[WARN] Groq LLM Provider is not configured (missing groq_api_key in .vibe/config.json)."));
        console.log(chalk.dim("      Only baseline RulesProvider will be tested. Run `vibe config set groq_api_key <key>` to test AI."));
      }
      console.log("");

      const scenarios: { name: string; request: DecisionRequest }[] = [
        {
          name: "Scenario 001: Clean Repo (No risks)",
          request: {
            id: "BENCH-001",
            type: "choice",
            question: "Is this pull request safe to merge?",
            context: { project: "vibe", diffSummary: "0 files changed" },
            evidence: [],
            category: "general",
          },
        },
        {
          name: "Scenario 002: Undeclared Database Drift (MongoDB added)",
          request: {
            id: "BENCH-002",
            type: "choice",
            question: "Evaluate architectural drift when MongoDB is added without architecture declaration",
            context: { project: "vibe", diffSummary: "2 files changed: package.json, src/db.ts" },
            evidence: [
              {
                type: "architecture-drift",
                source: "architecture.yaml",
                details: "Undeclared framework detected in imports: mongodb, mongoose",
                weight: 0.9,
              },
              {
                type: "dependency-change",
                source: "package.json",
                details: "New dependency added: mongoose@^8.0.0",
                weight: 0.6,
              },
            ],
            category: "architecture",
          },
        },
        {
          name: "Scenario 003: High Secret Exposure Risk",
          request: {
            id: "BENCH-003",
            type: "choice",
            question: "Evaluate risk when hardcoded AWS API key is detected in source code",
            context: { project: "vibe", diffSummary: "1 file changed: src/aws.ts" },
            evidence: [
              {
                type: "secret-risk",
                source: "git-diff",
                details: "Possible hardcoded AWS Access Key ID detected: AKIAIOSFODNN7EXAMPLE",
                weight: 1.0,
              },
            ],
            category: "authentication",
          },
        },
      ];

      for (const sc of scenarios) {
        console.log(chalk.bold.underline(sc.name));

        // 1. Rules Provider Benchmark
        const startRules = Date.now();
        const resRules = await ruleProvider.evaluate(sc.request);
        const rulesTime = Date.now() - startRules;

        console.log(
          `  ${chalk.cyan("[rules-provider]")}   Decision: ${chalk.bold(resRules.decision)} | Conf: ${resRules.confidence.toFixed(
            2
          )} | Latency: ${rulesTime}ms`
        );
        console.log(`    ${chalk.dim(`Rationale: ${resRules.reasoning}`)}`);

        // 2. Groq LLM Provider Benchmark (if configured)
        if (llmProvider.isConfigured()) {
          const startLLM = Date.now();
          try {
            const resLLM = await llmProvider.evaluate(sc.request);
            const llmTime = Date.now() - startLLM;
            console.log(
              `  ${chalk.magenta("[groq-llm]")}         Decision: ${chalk.bold(resLLM.decision)} | Conf: ${resLLM.confidence.toFixed(
                2
              )} | Latency: ${llmTime}ms`
            );
            console.log(`    ${chalk.dim(`Rationale: ${resLLM.reasoning}`)}`);
          } catch (err: any) {
            console.log(`  ${chalk.red("[groq-llm]")}         FAILED: ${err.message}`);
          }
        }
        console.log("");
      }
    });
}

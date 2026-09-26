import { Command } from "commander";
import chalk from "chalk";
import { VibeStore, analyzeImpact } from "vibe-dev-core";
import { DecisionRequest } from "vibe-dev-decision-core";
import { ProviderChain } from "vibe-dev-policy-engine";
import { getVibeConfig } from "./config";

const RISK_COLOR: Record<string, (s: string) => string> = {
  low: chalk.green.bold,
  medium: chalk.yellow.bold,
  high: chalk.red.bold,
};

export function registerImpact(program: Command) {
  program
    .command("impact [filePath...]")
    .description("Analyze the full transitive blast radius of changing a file")
    .action((fileParts: string[]) => {
      const root = process.cwd();
      if (!VibeStore.exists(root)) {
        VibeStore.init(root, require("path").basename(root));
        console.log(chalk.blue(`ℹ Auto-initialized VIBE for "${require("path").basename(root)}"`));
      }
      const queryPath = Array.isArray(fileParts) ? fileParts.join(" ").trim() : String(fileParts || "").trim();
      if (!queryPath) {
        console.log(chalk.red("Please specify a file path. E.g.: vibe impact src/auth/service.ts"));
        return;
      }

      const state = new VibeStore(root).get();
      let targetPath = queryPath;
      const fileNode = state.nodes.find((n) => n.type === "File" && n.label?.toLowerCase().includes(queryPath.toLowerCase()));
      if (fileNode && fileNode.label) {
        targetPath = fileNode.label;
      }

      const result = analyzeImpact(state, targetPath);
      if (!result) {
        console.log(chalk.red(`No graph data matching "${queryPath}". Run \`vibe scan\` first.`));
        process.exitCode = 1;
        return;
      }

      console.log(chalk.bold(`IMPACT ANALYSIS (V2 Intelligence) — ${result.targetFile}`));
      console.log("");
      console.log(chalk.bold("Direct dependents:"), result.directDependents.length);
      for (const f of result.directDependents) console.log(`  - ${f}`);
      console.log("");
      console.log(chalk.bold("Transitive dependents (full blast radius):"), result.transitiveDependents.length);
      for (const f of result.transitiveDependents) console.log(`  - ${f}`);
      console.log("");
      console.log(chalk.bold("Requirements affected:"), result.affectedRequirements.length ? result.affectedRequirements.join(", ") : "(none tracked)");
      console.log(chalk.bold("Tests likely affected:"), result.affectedTests.length ? result.affectedTests.join(", ") : "(none found)");
      console.log("");
      console.log("Risk Level:", RISK_COLOR[result.riskLevel](result.riskLevel.toUpperCase()));

      // Groq AI Interpretation
      const config = getVibeConfig(root);
      const apiKey = config.groq_api_key || process.env.GROQ_API_KEY;
      if (apiKey) {
        const chain = new ProviderChain(apiKey);
        const decisionReq: DecisionRequest = {
          id: `REQ-IMPACT-${Date.now()}`,
          type: "choice",
          question: `Assess hidden architectural change risk for modifying ${result.targetFile}`,
          context: {
            project: state.project.name || "unknown",
            filePath: result.targetFile,
          },
          evidence: [
            {
              type: "requirement-impact",
              source: result.targetFile,
              details: `Direct dependents: ${result.directDependents.length}, Transitive blast radius: ${result.transitiveDependents.length}, Affected REQs: ${result.affectedRequirements.join(", ") || "none"}`,
              weight: result.riskLevel === "high" ? 0.9 : result.riskLevel === "medium" ? 0.5 : 0.2,
            },
          ],
          category: "architecture",
        };

        chain.evaluate(decisionReq).then((evalRes) => {
          console.log(chalk.bold.yellow("\nAI Reasoning & Risk Interpretation:"));
          console.log(`  Provider: ${evalRes.provider} (Confidence: ${evalRes.confidence.toFixed(2)})`);
          console.log(`  Rationale: ${evalRes.reasoning}`);
        }).catch(() => {/* fallback gracefully */});
      }
    });
}

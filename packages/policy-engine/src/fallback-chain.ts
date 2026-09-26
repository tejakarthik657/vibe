import { DecisionProvider, DecisionRequest, DecisionResult } from "vibe-dev-decision-core";
import { RuleProvider } from "vibe-dev-provider-rules";
import { LLMProvider } from "vibe-dev-provider-llm";

export class ProviderChain {
  private ruleProvider: RuleProvider;
  private llmProvider: LLMProvider;

  constructor(apiKey?: string) {
    this.ruleProvider = new RuleProvider();
    this.llmProvider = new LLMProvider({ apiKey });
  }

  public async evaluate(request: DecisionRequest): Promise<DecisionResult> {
    // 1. Check if LLM is configured and user wants semantic reasoning
    if (this.llmProvider.isConfigured()) {
      try {
        return await this.llmProvider.evaluate(request);
      } catch (err: any) {
        // Fallback to rules if LLM fails
        if (process.env.DEBUG || process.env.VIBE_DEBUG) {
          console.warn("[DEBUG] Groq LLM Provider failed, falling back to Rules:", err?.message || err);
        }
      }
    }

    // 2. Default fallback to deterministic RuleProvider
    return await this.ruleProvider.evaluate(request);
  }
}

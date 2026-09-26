import {
  DecisionCapability,
  DecisionProvider,
  DecisionRequest,
  DecisionResult,
} from "vibe-dev-decision-core";

export interface LLMProviderConfig {
  apiKey?: string;
  endpoint?: string;
  model?: string;
  providerType?: "groq" | "openai" | "ollama";
}

export class LLMProvider implements DecisionProvider {
  public name = "groq-llm";
  private apiKey: string;
  private endpoint: string;
  private model: string;

  constructor(config: LLMProviderConfig = {}) {
    this.apiKey = config.apiKey || process.env.GROQ_API_KEY || "";
    this.endpoint = config.endpoint || "https://api.groq.com/openai/v1/chat/completions";
    this.model = config.model || "openai/gpt-oss-120b";
    if (config.providerType) {
      this.name = `${config.providerType}-llm`;
    }
  }

  public capabilities(): DecisionCapability {
    return {
      supportedTypes: ["boolean", "choice", "score", "probability"],
      supportedCategories: ["architecture", "formatting", "authentication", "dependency", "general"],
      isDeterministic: false,
    };
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.startsWith("gsk_")) || Boolean(process.env.OPENAI_API_KEY);
  }

  public async evaluate(request: DecisionRequest): Promise<DecisionResult> {
    if (!this.isConfigured()) {
      throw new Error("LLMProvider is not configured with a valid API Key.");
    }

    const systemPrompt = `You are VIBE Decision Intelligence (v2), an engineering analyzer.
Your job is to evaluate engineering decision requests grounded STRICTLY in the provided structural facts and evidence.
DO NOT invent facts or hallucinate outside the evidence list.

Return your response in STRICT JSON format matching this schema:
{
  "decision": "ALLOW" | "REVIEW_REQUIRED" | "BLOCK",
  "confidence": number between 0.0 and 1.0,
  "reasoning": "Clear 1-2 sentence engineering rationale based strictly on evidence",
  "riskExplanation": "Short description of potential hidden architectural or security risks"
}`;

    const userPrompt = `Project: ${request.context.project}
Question: ${request.question}
Category: ${request.category || "general"}

Attached Structural Evidence:
${JSON.stringify(request.evidence, null, 2)}

Evaluate this decision and output strict JSON.`;

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API returned status ${response.status}: ${errorText}`);
      }

      const data: any = await response.json();
      let rawContent = data.choices?.[0]?.message?.content || "{}";
      rawContent = rawContent.replace(/```json\s*|\s*```/g, "").trim();
      const parsed = JSON.parse(rawContent);

      return {
        requestId: request.id,
        decision: parsed.decision || "REVIEW_REQUIRED",
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.85,
        reasoning: parsed.reasoning || parsed.riskExplanation || `Evaluated by Groq LLM (${this.model}).`,
        evidence: request.evidence,
        provider: this.name,
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      throw new Error(`Groq LLM evaluation failed: ${err.message || String(err)}`);
    }
  }
}

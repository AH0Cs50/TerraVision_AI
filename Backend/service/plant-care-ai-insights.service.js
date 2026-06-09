import { fillPrompt } from "./llm.service.js";

/**
 * @description Generates AI-powered insights and answers for plant care.
 * Uses the LLM to produce human-readable summaries based on current status
 * and action history.
 */
export class PlantCareAiInsights {
  constructor(llmService) {
    this.llmService = llmService;
  }

  /**
   * Generates a summary + recommendations from current status and care history.
   */
  async generateInsights(plantUUID, status, actionLogs) {
    try {
      const prompt = this.#buildInsightPrompt(status, actionLogs);
      const response = await this.llmService.generateResponse(prompt);
      return this.#parseInsights(response);
    } catch {
      return { summary: "", recommendations: [], generatedAt: new Date() };
    }
  }

  /**
   * Answers a free-text user question about the plant's care based on history.
   */
  async answerQuestion(plantUUID, question, actionLogs) {
    try {
      const prompt = this.#buildQuestionPrompt(question, actionLogs);
      const response = await this.llmService.generateResponse(prompt);
      return this.#parseInsights(response);
    } catch {
      return { summary: "", recommendations: [], generatedAt: new Date() };
    }
  }

  /**
   * @private
   * @description Builds a prompt for the LLM to generate care insights
   * from current status and recent action logs.
   * @param {Object} status - Current care status
   * @param {Array} actionLogs - Plant action history
   * @returns {{contents: Array}} Structured prompt
   */
  #buildInsightPrompt(status, actionLogs) {
    const s = status || {};
    const recentLogs = (actionLogs || []).slice(-10);
    const logSummary = recentLogs
      .map(
        (l) =>
          `[${new Date(l.createdAt).toISOString()}] ${l.actionType}: ${l.description}`,
      )
      .join("\n");

    const text = fillPrompt("GENERATE_INSIGHT", {
      water: s.water,
      nutrients: s.nutrients,
      health: s.health,
      light: s.light,
      logSummary: logSummary || "No recent actions recorded.",
    });

    return {
      contents: [
        {
          role: "user",
          parts: [{ text }],
        },
      ],
    };
  }

  /**
   * @private
   * @description Builds a prompt for answering a free-text user question
   * about the plant based on recent action history.
   * @param {string} question - User's question
   * @param {Array} actionLogs - Plant action history
   * @returns {{contents: Array}} Structured prompt
   */
  #buildQuestionPrompt(question, actionLogs) {
    const recentLogs = (actionLogs || []).slice(-10);
    const logSummary = recentLogs
      .map(
        (l) =>
          `[${new Date(l.createdAt).toISOString()}] ${l.actionType}: ${l.description}`,
      )
      .join("\n");

    const text = fillPrompt("ANSWER_QUESTION", {
      logSummary: logSummary || "No recent actions recorded.",
      question,
    });

    return {
      contents: [
        {
          role: "user",
          parts: [{ text }],
        },
      ],
    };
  }

  /**
   * @private
   * @description Extracts a JSON object from the LLM response with summary
   * and recommendations fields.
   * @param {Object|string} response - Raw LLM response
   * @returns {{summary: string, recommendations: Array, generatedAt: Date}}
   */
  #parseInsights(response) {
    try {
      let text =
        typeof response === "string"
          ? response
          : response?.text ||
            response?.candidates?.[0]?.content?.parts?.[0]?.text ||
            JSON.stringify(response);

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }

      const parsed = JSON.parse(text);
      return {
        summary: parsed.summary || "",
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : [],
        generatedAt: new Date(),
      };
    } catch {
      return {
        summary: "",
        recommendations: [],
        generatedAt: new Date(),
      };
    }
  }
}

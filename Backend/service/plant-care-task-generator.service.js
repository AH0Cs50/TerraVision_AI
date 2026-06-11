import { fillPrompt } from "./llm.service.js";
import {
  createPlantTaskModel,
  TASK_TYPES,
  TASK_PRIORITIES,
  WATER_STATUSES,
  NUTRIENT_STATUSES,
  HEALTH_STATUSES,
  LIGHT_STATUSES,
} from "../model/plant-care.model.js";

/**
 * @description Uses the LLM to generate care tasks based on the plant's
 * current status and engine scores. Constructs a prompt with status enums
 * and score values, then parses the model's JSON response into task objects.
 */
export class PlantCareTaskGenerator {
  constructor(llmService) {
    this.llmService = llmService;
  }

  /**
   * Calls the LLM with current status + engine scores to produce care tasks.
   * Returns an array of parsed task objects matching PlantTaskSchema.
   */
  async generateTasksFromStatus(status, engineScores) {
    try {
      const prompt = this.#buildPrompt(status, engineScores);
      const response = await this.llmService.generateResponse(prompt);
      return this.#parseTasks(response);
    } catch (error) {
      console.error("Task generation via LLM failed:", error?.message || "unknown");
      return [];
    }
  }

  /**
   * @private
   * @description Constructs an LLM prompt containing the plant's current
   * status categories, engine scores, and valid enum constraints.
   * @param {Object} status - Current water/nutrients/health/light statuses
   * @param {Object} engineScores - Raw numeric scores from the engine
   * @returns {{contents: Array}} Structured prompt for the LLM
   */
  #buildPrompt(status, engineScores) {
    const enumConstraints = `
- task type: one of ${JSON.stringify(TASK_TYPES)}
- priority: one of ${JSON.stringify(TASK_PRIORITIES)}
- status: must be "pending"
- generatedBy: must be "ai"
`;

    const text = fillPrompt("TASK_GENERATION", {
      enumConstraints: enumConstraints.trimEnd(),
      waterStatus: status.water,
      waterStatuses: JSON.stringify(WATER_STATUSES),
      nutrientStatus: status.nutrients,
      nutrientStatuses: JSON.stringify(NUTRIENT_STATUSES),
      healthStatus: status.health,
      healthStatuses: JSON.stringify(HEALTH_STATUSES),
      lightStatus: status.light,
      lightStatuses: JSON.stringify(LIGHT_STATUSES),
      waterScore: engineScores?.waterScore,
      fertilizerScore: engineScores?.fertilizerScore,
      pestRiskScore: engineScores?.pestRiskScore,
      lightScore: engineScores?.lightScore,
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
   * @description Extracts a JSON array from the LLM response, validates it,
   * and maps each item to a PlantTaskModel.
   * @param {Object|string} response - Raw LLM response
   * @returns {Array<Object>} Array of parsed task objects
   */
  #parseTasks(response) {
    try {
      let text =
        typeof response === "string"
          ? response
          : response?.text ||
            response?.candidates?.[0]?.content?.parts?.[0]?.text ||
            JSON.stringify(response);

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }

      const tasks = JSON.parse(text);
      if (!Array.isArray(tasks)) return [];

      return tasks.map((t) =>
        createPlantTaskModel({
          type: t.type,
          title: t.title,
          description: t.description,
          priority: t.priority || "medium",
          dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
          createdAt: new Date(),
        }),
      );
    } catch (error) {
      console.error("Failed to parse LLM task response:", error?.message || "unknown");
      return [];
    }
  }
}

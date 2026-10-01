import express from "express";
import { runResearchAgent } from "../services/research-agent.service.js";

export const agentRouter = express.Router();

/**
 * Run the biomedical research agent.
 *
 * URL:
 * POST /api/agent/research
 */
agentRouter.post("/research", async (req, res) => {
  // Step 1: Read the research query from the request body.
  const { query } = req.body ?? {};

  // Step 2: Ensure that the user provided a valid query.
  if (typeof query !== "string" || query.trim() === "") {
    const error = new Error("A non-empty research query is required");
    error.statusCode = 400;
    throw error;
  }

  // Step 3: Remove unnecessary whitespace.
  const currentQuery = query.trim();

  /*
   * Step 4: Send the query to the research-agent service.
   *
   * The service handles the complete agent workflow:
   *
   * - Sends the query and available tools to the LLM.
   * - Allows the LLM to select and call tools.
   * - Returns each tool result to the LLM.
   * - Continues the loop when additional tools are required.
   * - Generates the final research answer.
   */
  const agentResult = await runResearchAgent(currentQuery);

  /*
   * agentResult contains:
   *
   * {
   *   answer: "Final research summary...",
   *   toolsUsed: [
   *     {
   *       name: "search_biomedical_papers",
   *       input: {
   *         topic: "semaglutide obesity"
   *       }
   *     }
   *   ]
   * }
   */

  // Step 5: Return the final answer and selected tool details.
  res.status(200).json({
    success: true,
    data: {
      answer: agentResult.answer,
      toolsUsed: agentResult.toolsUsed,
    },
  });
});

import { ChatOllama } from "@langchain/ollama";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

// Configure the LLM used to rewrite follow-up questions.
const chatModel = new ChatOllama({
  model: "qwen3:4b",
  baseUrl: "http://localhost:11434",
  temperature: 0,
});

/**
 * Convert a context-dependent follow-up question into
 * an independently understandable search query.
 */
export async function generateStandaloneQuery(
  currentQuery,
  conversationHistory = [],
) {
  if (typeof currentQuery !== "string" || currentQuery.trim() === "") {
    throw new Error("A non-empty query is required");
  }

  const normalizedQuery = currentQuery.trim();

  const messages = [
    new SystemMessage(`
                        You rewrite follow-up questions into standalone search queries.

                        Use the conversation history only to understand references such as
                        "it", "they", "that", "this", "those", and omitted subjects.

                        Rules:
                        1. Preserve the user's original meaning.
                        2. Do not answer the question.
                        3. Do not add facts that are not present in the conversation.
                        4. Return only the rewritten standalone query.
                        5. Do not include explanations, labels, quotation marks, or formatting.
                    `),
  ];

  // Add previous messages using their original conversation roles.
  for (const message of conversationHistory) {
    if (message.role === "user") {
      messages.push(new HumanMessage(message.content));
    }

    if (message.role === "assistant") {
      messages.push(new AIMessage(message.content));
    }
  }

  // Add the current follow-up question that must be rewritten.
  messages.push(
    new HumanMessage(
      `Rewrite this follow-up question as a standalone search query:${normalizedQuery}`,
    ),
  );

  console.log("Messages in Get standalone query service :", messages);

  const response = await chatModel.invoke(messages);
  return response.content.trim();
}

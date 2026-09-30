import { ChatOllama } from "@langchain/ollama";
import { saveNoteTool } from "../tools/save-note.tool.js";

const llm = new ChatOllama({
  model: "qwen3:4b",
  baseUrl: "http://localhost:11434",
  temperature: 0,
});

export const llmWithTools = llm.bindTools([saveNoteTool]);
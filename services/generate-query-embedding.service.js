import { OllamaEmbeddings } from "@langchain/ollama";

//configure Ollama
const embeddingModel = new OllamaEmbeddings({
  model: "qwen3-embedding:4b",
  baseUrl: "http://localhost:11434",
});
export async function generateQueryEmbedding(query) {
  if (typeof query !== "string" || query.trim() === "") {
    const error = new Error("A non-empty search query is required");
    error.statusCode = 400;
    throw error;
  }

  const normalizedQuery = query.trim();

  const queryEmbedding = await embeddingModel.embedQuery(normalizedQuery);

  return queryEmbedding;
}

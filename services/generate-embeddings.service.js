import { OllamaEmbeddings } from "@langchain/ollama";

//configure Ollama
const embeddingModel = new OllamaEmbeddings({
  model: "qwen3-embedding:4b",
  baseUrl: "http://localhost:11434",
});

/*
    service funciton that receives list of chunks, 
    generate embedding for each embedding and then
    return list of objects with chunk+embedding
*/

export async function generateChunkEmbeddings(articleId, listOfChunks) {
  if (!articleId || !Array.isArray(listOfChunks) || listOfChunks.length === 0) {
    throw new Error("Article ID and a non-empty array of chunks are required.");
  }

  for (const chunk of listOfChunks) {
    if (typeof chunk !== "string") {
      throw new Error("Each chunk must be a string.");
    }

    if (chunk.trim() === "") {
      throw new Error("Chunks cannot be empty.");
    }
  }
  if (articleId && listOfChunks.length !== 0) {
    let listOfChunkAndEmbeddings = [];
    for (const [index, chunk] of listOfChunks.entries()) {
      const chunkText = chunk.trim();
      const embedding = await embeddingModel.embedQuery(chunkText);

      listOfChunkAndEmbeddings.push({
        articleId,
        chunkText,
        chunkIndex: index,
        embedding,
      });
    }

    return listOfChunkAndEmbeddings;
  } else {
    throw new Error("Invalid article chunks");
  }
}

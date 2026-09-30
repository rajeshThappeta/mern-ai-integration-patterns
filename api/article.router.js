import express from "express";
import { Types } from "mongoose";
import { splitArticleToChunks } from "../services/split-article.service.js";
import { ArticleModel } from "../models/article.model.js";
import { ChunkModel } from "../models/chunk.model.js";
import { generateChunkEmbeddings } from "../services/generate-embeddings.service.js";
import { generateQueryEmbedding } from "../services/generate-query-embedding.service.js";
import {
  generateChatAnswerWithTools,
  generateConversationalRagAnswer,
  generateRagAnswer,
} from "../services/llm.service.js";
import { upload } from "../middlewares/multer.middleware.js";
import { extractTextFromFile } from "../services/text-extraction.service.js";
import { ConversationModel } from "../models/conversation.model.js";
import { generateStandaloneQuery } from "../services/generate-standalone-query.service.js";
import { ChatOllama } from "@langchain/ollama";
export const articleRouter = express.Router();

// Create LLM instance (don't use bindTools here)
const llm = new ChatOllama({
  model: "qwen3:4b",
  baseUrl: "http://localhost:11434",
  temperature: 0,
});

//Injestion
articleRouter.post("/", async (req, res) => {
  //get article from req
  let { title, content } = req.body;
  //save aritcle in article collection
  let newArticle = await ArticleModel.create({ title, content });
  //get list of chunks of article
  let chunksList = await splitArticleToChunks(content);
  //get list of embeddings & chunks
  let chunksWithEMbeddings = await generateChunkEmbeddings(
    newArticle._id,
    chunksList,
  );
  //save in chunks collection
  let result = await ChunkModel.insertMany(chunksWithEMbeddings);
  //console.log("result ", result);
  //res
  res.status(201).json({
    success: true,
    message: "Article created",
    data: { articleId: newArticle._id, chunkCount: result.length },
  });
});

//Retrieval & Generation
articleRouter.post("/:articleId/search", async (req, res) => {
  //get articleId and query from req
  let articleId = req.params.articleId;
  //check article in db
  let isArticleFound = await ArticleModel.findById(articleId);
  if (!isArticleFound) {
    const error = new Error("Article not found");
    error.statusCode = 404;
    throw error;
  }
  if (!Types.ObjectId.isValid(articleId)) {
    const error = new Error("Invalid article ID");
    error.statusCode = 400;
    throw error;
  }
  let query = req.body.query;
  // embed query
  let queryEmbedding = await generateQueryEmbedding(query);
  // get matched chunks through vector search
  const articleObjectId = new Types.ObjectId(articleId);

  const semanticSearchResult = await ChunkModel.aggregate([
    {
      $vectorSearch: {
        index: "article_vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 100,
        limit: 5,
        filter: {
          articleId: articleObjectId,
        },
      },
    },
    {
      $project: {
        _id: 0,
        articleId: 1,
        chunkIndex: 1,
        chunkText: 1,
        score: {
          $meta: "vectorSearchScore",
        },
      },
    },
  ]);

  const answer = await generateRagAnswer(query, semanticSearchResult);

  res.status(200).json({
    success: true,
    answer,
    relevantChunks: semanticSearchResult,
  });
  // send query + chunks to llm and get answer
  //send ans and chukns in res
});

//File upload Injection
articleRouter.post(
  "/upload",
  // Read one uploaded file from the form-data field named "file".
  upload.single("file"),

  async (req, res) => {
    // Multer places text fields inside req.body.
    const title = req.body.title?.trim();

    // Multer places the uploaded file and its buffer inside req.file.
    const uploadedFile = req.file;

    if (!title) {
      const error = new Error("Article title is required");
      error.statusCode = 400;
      throw error;
    }

    if (!uploadedFile) {
      const error = new Error("Please upload a file");
      error.statusCode = 400;
      throw error;
    }

    // Extract and clean text from the uploaded file buffer.
    const content = await extractTextFromFile(
      uploadedFile.buffer,
      uploadedFile.mimetype,
    );

    // Store the original extracted article content.
    const newArticle = await ArticleModel.create({
      title,
      content,
    });

    // Split the extracted article into smaller searchable chunks.
    const chunksList = await splitArticleToChunks(content);

    if (chunksList.length === 0) {
      const error = new Error("Unable to create chunks from the uploaded file");
      error.statusCode = 422;
      throw error;
    }

    // Generate an embedding for every chunk and attach the article reference.
    const chunksWithEmbeddings = await generateChunkEmbeddings(
      newArticle._id,
      chunksList,
    );

    // Store all chunks and their embeddings in the chunks collection.
    const savedChunks = await ChunkModel.insertMany(chunksWithEmbeddings);

    res.status(201).json({
      success: true,
      message: "File uploaded and article processed successfully",
      data: {
        articleId: newArticle._id,
        chunkCount: savedChunks.length,
      },
    });
  },
);

// Chat
// articleRouter.post("/chat", async (req, res) => {
//   // Get the query and one identifier from the request body.
//   const { query, articleId, conversationId } = req.body;

//   // Accept either articleId for a new conversation or
//   // conversationId for a follow-up message, but not both.
//   if ((!articleId && !conversationId) || (articleId && conversationId)) {
//     const error = new Error(
//       "Provide either articleId or conversationId, but not both",
//     );
//     error.statusCode = 400;
//     throw error;
//   }

//   // Ensure that the user provided a valid query.
//   if (typeof query !== "string" || query.trim() === "") {
//     const error = new Error("A non-empty query is required");
//     error.statusCode = 400;
//     throw error;
//   }

//   // Remove unnecessary whitespace from the query.
//   const currentQuery = query.trim();

//   // These variables are populated based on whether the request
//   // starts a new conversation or continues an existing one.
//   let activeArticleId;
//   let activeConversationId;
//   let conversationHistory = [];
//   let standaloneQuery = currentQuery;

//   if (conversationId) {
//     // Ensure that conversationId is a valid MongoDB ObjectId.
//     if (!Types.ObjectId.isValid(conversationId)) {
//       const error = new Error("Invalid conversation ID");
//       error.statusCode = 400;
//       throw error;
//     }

//     // Find the existing conversation.
//     const conversation = await ConversationModel.findById(conversationId);

//     if (!conversation) {
//       const error = new Error("Conversation not found");
//       error.statusCode = 404;
//       throw error;
//     }

//     // Use the article associated with the existing conversation.
//     activeArticleId = conversation.articleId;
//     activeConversationId = conversation._id;

//     // Use only the latest messages to control the LLM context size.
//     conversationHistory = conversation.messages.slice(-10);

//     // Rewrite the follow-up question as an independent search query.
//     standaloneQuery = await generateStandaloneQuery(
//       currentQuery,
//       conversationHistory,
//     );

//     console.log("Standalone query :", standaloneQuery);
//   } else {
//     // Ensure that articleId is a valid MongoDB ObjectId.
//     if (!Types.ObjectId.isValid(articleId)) {
//       const error = new Error("Invalid article ID");
//       error.statusCode = 400;
//       throw error;
//     }

//     // Verify that the selected article exists.
//     const article = await ArticleModel.findById(articleId);

//     if (!article) {
//       const error = new Error("Article not found");
//       error.statusCode = 404;
//       throw error;
//     }

//     activeArticleId = article._id;

//     // Create an empty conversation for the first message.
//     const conversation = await ConversationModel.create({
//       articleId: activeArticleId,
//       messages: [],
//     });

//     activeConversationId = conversation._id;
//   }

//   // Generate an embedding for the standalone search query.
//   const queryEmbedding = await generateQueryEmbedding(standaloneQuery);

//   // Retrieve chunks only from the article associated
//   // with the current conversation.
//   const semanticSearchResult = await ChunkModel.aggregate([
//     {
//       $vectorSearch: {
//         index: "article_vector_index",
//         path: "embedding",
//         queryVector: queryEmbedding,
//         numCandidates: 100,
//         limit: 5,
//         filter: {
//           articleId: activeArticleId,
//         },
//       },
//     },
//     {
//       $project: {
//         _id: 0,
//         articleId: 1,
//         chunkIndex: 1,
//         chunkText: 1,
//         score: {
//           $meta: "vectorSearchScore",
//         },
//       },
//     },
//   ]);

//   // Send the current query, relevant chunks and conversation
//   // history to the Chat LLM service to generate an answer.
//   const answer = await generateConversationalRagAnswer(
//     currentQuery,
//     semanticSearchResult,
//     conversationHistory,
//   );

//   // Add the current user question and assistant answer
//   // to the same conversation.
//   await ConversationModel.findByIdAndUpdate(activeConversationId, {
//     $push: {
//       messages: {
//         $each: [
//           {
//             role: "user",
//             content: currentQuery,
//           },
//           {
//             role: "assistant",
//             content: answer,
//           },
//         ],
//       },
//     },
//   });

//   // Return the conversation ID so the client can use it
//   // when sending the next follow-up question.
//   res.status(200).json({
//     success: true,
//     data: {
//       conversationId: activeConversationId,
//       answer,
//       relevantChunks: semanticSearchResult,
//     },
//   });
// });

// Tool calling

// Import or define your configured ChatOllama instance as `llm`.
// Import the models and existing query/embedding services used by your app.

articleRouter.post("/chat", async (req, res) => {
  // Get the query and one identifier from the request body.
  const { query, articleId, conversationId } = req.body;

  // Accept either articleId for a new conversation or
  // conversationId for a follow-up message, but not both.
  if ((!articleId && !conversationId) || (articleId && conversationId)) {
    const error = new Error(
      "Provide either articleId or conversationId, but not both",
    );
    error.statusCode = 400;
    throw error;
  }

  // Ensure that the user provided a non-empty query.
  if (typeof query !== "string" || query.trim() === "") {
    const error = new Error("A non-empty query is required");
    error.statusCode = 400;
    throw error;
  }

  const currentQuery = query.trim();

  // These values are set while starting or continuing a conversation.
  let activeArticleId;
  let activeConversationId;
  let conversationHistory = [];
  let standaloneQuery = currentQuery;

  if (conversationId) {
    // Validate the conversation ID before looking it up.
    if (!Types.ObjectId.isValid(conversationId)) {
      const error = new Error("Invalid conversation ID");
      error.statusCode = 400;
      throw error;
    }

    // Find the existing conversation.
    const conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
      const error = new Error("Conversation not found");
      error.statusCode = 404;
      throw error;
    }

    // Continue using the article associated with this conversation.
    activeArticleId = conversation.articleId;
    activeConversationId = conversation._id;
    conversationHistory = conversation.messages.slice(-10);

    // Rewrite a follow-up question so vector search can understand it alone.
    standaloneQuery = await generateStandaloneQuery(
      currentQuery,
      conversationHistory,
    );
  } else {
    // Validate the article ID before looking it up.
    if (!Types.ObjectId.isValid(articleId)) {
      const error = new Error("Invalid article ID");
      error.statusCode = 400;
      throw error;
    }

    // Verify that the selected article exists.
    const article = await ArticleModel.findById(articleId);

    if (!article) {
      const error = new Error("Article not found");
      error.statusCode = 404;
      throw error;
    }

    activeArticleId = article._id;

    // Create an empty conversation for the first message.
    const conversation = await ConversationModel.create({
      articleId: activeArticleId,
      messages: [],
    });

    activeConversationId = conversation._id;
  }

  // Embed the standalone query for semantic retrieval.
  const queryEmbedding = await generateQueryEmbedding(standaloneQuery);

  // Retrieve relevant chunks only from this conversation's article.
  const semanticSearchResult = await ChunkModel.aggregate([
    {
      $vectorSearch: {
        index: "article_vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: 100,
        limit: 5,
        filter: {
          articleId: activeArticleId,
        },
      },
    },
    {
      $project: {
        _id: 0,
        articleId: 1,
        chunkIndex: 1,
        chunkText: 1,
        score: {
          $meta: "vectorSearchScore",
        },
      },
    },
  ]);

  // Generate a normal RAG answer or execute a tool when requested.
  const { answer, toolResult } = await generateChatAnswerWithTools(
    currentQuery,
    semanticSearchResult,
    conversationHistory,
  );

  // Save the current question and final assistant answer.
  await ConversationModel.findByIdAndUpdate(activeConversationId, {
    $push: {
      messages: {
        $each: [
          {
            role: "user",
            content: currentQuery,
          },
          {
            role: "assistant",
            content: answer,
          },
        ],
      },
    },
  });

  // Return the answer, retrieved chunks, and tool details if a tool ran.
  res.status(200).json({
    success: true,
    data: {
      conversationId: activeConversationId,
      answer,
      toolResult,
      relevantChunks: semanticSearchResult,
    },
  });
});

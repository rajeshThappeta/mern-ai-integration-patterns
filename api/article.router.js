import express from "express";
import {Types} from 'mongoose'
import { splitArticleToChunks } from "../services/split-article.service.js";
import { ArticleModel } from "../models/article.model.js";
import { ChunkModel } from "../models/chunk.model.js";
import { generateChunkEmbeddings } from "../services/generate-embeddings.service.js";
import { generateQueryEmbedding } from "../services/generate-query-embedding.service.js";
import { generateRagAnswer } from "../services/llm.service.js";
export const articleRouter = express.Router();

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

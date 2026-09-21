import express from "express";
import { splitArticleToChunks } from "../services/split-article.service.js";
import { ArticleModel } from "../models/article.model.js";
import { ChunkModel } from "../models/chunk.model.js";
import { generateChunkEmbeddings } from "../services/generate-embeddings.service.js";
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
  res
    .status(201)
    .json({
      success: true,
      message: "Article created",
      data: { articleId: newArticle._id, chunkCount: result.length },
    });
});
//Retrieval & Generation
articleRouter.post("/:articleId/search", async (req, res) => {});

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

/*
 This function receives a lengthy article and split it 
 into chunks with specified chunk size and chunk overlap.

 The RecursiveCharacterTextSplitter use "Paragraph → line → word → character" seperator priority
*/

export async function splitArticleToChunks(article) {
  // get splitter obejct
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 120,
  });
  // split article
  const chunksList = await splitter.splitText(article);

  return chunksList;
}

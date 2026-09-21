# Steps to implement RAG
A. Article Ingestion Pipeline
            1. The user submits an article of approximately 500 words on a specific subject.
            2. The route validates the input and saves the article in the articles collection to generate an articleId.
            3. The article text and articleId are sent to the Chunking Service.
            4. The Chunking Service splits the article into smaller, slightly overlapping chunks.
            5. The list of chunks is sent to the Embedding Service.
            6. The Embedding Service generates an embedding for each chunk and returns objects containing:
            {
            articleId,
            chunkIndex,
            chunkText,
            embedding
            }
            7. These chunk documents are saved in the chunks collection with a reference to the original article.
            8. The API confirms that the article has been successfully indexed and is ready for RAG-based search.


B. Retrieval and Generation Pipeline
            1. The user sends a question along with the articleId.
            2. The Embedding Service generates an embedding for the user’s question.
            3. Atlas Vector Search performs semantic search only within chunks belonging to that particular article.
            4. The most relevant chunks are retrieved with their similarity scores.
            5. The retrieved chunks are combined to create the context.
            6. The following information is sent to the LLM:
                    Question: User’s question
                    Context: Relevant article chunks
                    Instruction: Answer only using the supplied context
            7. The LLM generates a context-aware answer.
            8. The API returns the generated answer to the user.




# Without chunk overlap
        Chunk 1: AI agents can independently plan tasks and communicate with

        Chunk 2: external tools such as databases, APIs and web browsers.

# With chunk overlap
        Chunk 1: AI agents can independently plan tasks and communicate with external tools.

        Chunk 2:communicate with external tools such as databases, APIs and web browsers.
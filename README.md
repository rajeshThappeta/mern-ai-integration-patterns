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




# Steps to create Ingestion pipeline with file upload

                1. Client request: Postman sends the file and title using multipart/form-data.
                2. Multer middleware: Multer intercepts the request and parses its file and text fields.
                3. Memory storage: The uploaded file is temporarily held as a memory buffer without saving it to disk.
                4. File validation: Validate the file’s presence, MIME type and permitted size.
                5. Route handler: Multer makes the file available through req.file and the title through req.body.
                6. Text extraction: Send the file buffer and MIME type to the appropriate text-extraction service.
                7. Text cleaning: Remove unnecessary whitespace, empty lines and extraction artifacts.
                8. Article storage: Save the title, cleaned content and basic file metadata in the articles collection.
                9. Existing RAG ingestion: Pass the saved article content through your existing chunking, embedding and chunk-storage process.
                10. Response: Return the created article ID, file information and number of generated chunks.



# Without chunk overlap
        Chunk 1: AI agents can independently plan tasks and communicate with

        Chunk 2: external tools such as databases, APIs and web browsers.

# With chunk overlap
        Chunk 1: AI agents can independently plan tasks and communicate with external tools.

        Chunk 2:communicate with external tools such as databases, APIs and web browsers.


# RAG Quesries
        JavaScript – Eloquent JavaScript

1. What are the differences between `let`, `const`, and `var` in JavaScript?
2. How do higher-order functions work in JavaScript?
3. What are closures, and when are they useful?
4. How does asynchronous programming work using promises and `async/await`?
5. How can JavaScript interact with the Document Object Model (DOM)?

Python – Think Python

1. What is the difference between a function parameter and an argument in Python?
2. How are lists, tuples, and dictionaries different from each other?
3. How does recursion work in Python?
4. What are classes and objects, and how are they created in Python?
5. How does exception handling work using `try` and `except`?




# Conversation RAG (Chat)

        Normal RAG:
                Query → Embedding → Relevant Chunks → LLM → Answer

        Conversational RAG:
                Current Query + Chat History
                        ↓
                Standalone Query
                        ↓
                Embedding → Relevant Chunks
                        ↓
                History + Chunks + Current Query
                        ↓
                        LLM
                        ↓
                Context-aware Answer
                        ↓
                Save Question and Answer
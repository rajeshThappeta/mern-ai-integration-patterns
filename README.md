# Steps to implement RAG

A. Article Ingestion Pipeline 1. The user submits an article of approximately 500 words on a specific subject. 2. The route validates the input and saves the article in the articles collection to generate an articleId. 3. The article text and articleId are sent to the Chunking Service. 4. The Chunking Service splits the article into smaller, slightly overlapping chunks. 5. The list of chunks is sent to the Embedding Service. 6. The Embedding Service generates an embedding for each chunk and returns objects containing:
{
articleId,
chunkIndex,
chunkText,
embedding
} 7. These chunk documents are saved in the chunks collection with a reference to the original article. 8. The API confirms that the article has been successfully indexed and is ready for RAG-based search.

B. Retrieval and Generation Pipeline 1. The user sends a question along with the articleId. 2. The Embedding Service generates an embedding for the user’s question. 3. Atlas Vector Search performs semantic search only within chunks belonging to that particular article. 4. The most relevant chunks are retrieved with their similarity scores. 5. The retrieved chunks are combined to create the context. 6. The following information is sent to the LLM:
Question: User’s question
Context: Relevant article chunks
Instruction: Answer only using the supplied context 7. The LLM generates a context-aware answer. 8. The API returns the generated answer to the user.

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

## Steps: - During the first query of chat, the client do not have "conversationId", so that it sends req

        as
        {
        "articleId":"",
        "query":""
        }

        - Now, the backend detects the conversationId missing, so it creates new conversation and return
                {
                "conversationId":"",
                "answer":""
                }

        - From here onwards, the client sends the conversationId and sends it with subsequent messages
                {
                "conversationId":"",
                "query":""
                }


        ## Final flow:
                conversationId missing
                ↓
                Create a new conversation

                conversationId available
                        ↓
                Continue the existing conversation

        ## Complete algorithm for Chat:
                - Get query, articleId and conversationId from the request body.

                - Validate the query.

                - Ensure that either articleId or conversationId is provided.

                - If conversationId is provided:
                        - Find the existing conversation.
                        - Get its articleId and recent chat history.
                        - Convert the follow-up query into a standalone search query.

                - If articleId is provided:
                        - Verify that the article exists.
                        - Create a new conversation.
                        - Use the original query as the standalone search query.

                - Generate an embedding for the standalone search query.

                - Perform vector search filtered by articleId.

                - Retrieve the relevant chunks.

                - Send the current query, relevant chunks and available
                  conversation history to the LLM.

                - Generate the answer.

                - Save both the current user query and assistant answer
                  in the conversation document.

                - Return conversationId, answer and relevant chunks.


        ## Conversation document structure
                {
                        "_id": "CONVERSATION_ID",
                        "articleId": "ARTICLE_ID",
                        "messages": [
                                        {
                                        "role": "user",
                                        "content": "What are JavaScript closures?"
                                        },
                                        {
                                        "role": "assistant",
                                        "content": "A closure allows a function to access variables from its outer scope."
                                        },
                                        {
                                        "role": "user",
                                        "content": "Where are they useful?"
                                        },
                                        {
                                        "role": "assistant",
                                        "content": "Closures are useful for data privacy, callbacks and maintaining state."
                                        }
                                     ]
                }

        ## The need & behaviour of generateStandaloneQuery service
                Suppose the conversation is:

                        User: What are JavaScript closures?
                        Assistant: A closure allows a function to retain access to its outer scope.
                        User: Where are they useful?

                The follow-up query:

                        Where are they useful?

                        does not mention closures. If you directly generate its embedding, vector search may retrieve unrelated chunks because the word “they” has no clear meaning by itself.

                        The service uses recent conversation history to rewrite it as:

                        "Where are JavaScript closures useful?"

                        This rewritten query contains enough meaning to perform accurate vector search.


        Current user query
                +               --------> generateStandaloneQuery ----> Standalone query
        Recent conversation history

# Tool calling feature

- Complete Implementation roadmap
  Step 1: Create Note schema and model
  Step 2: Create the save_note tool
  Step 3: Bind the tool to ChatOllama
  Step 4: Invoke the model with a user request
  Step 5: Inspect the model’s tool_calls
  Step 6: Execute the requested tool
  Step 7: Return the tool result to the model
  Step 8: Generate the final confirmation
  Step 9: Connect the flow to an Express route

- Expected final flow for a tool (save note tool)
        User: Save “Closures retain access to outer scope” as a note
                                ↓
        LLM receives save_note tool definition
                                ↓
        LLM returns a structured tool request
                                ↓
        Express executes save_note
                                ↓
        Note is stored in MongoDB
                                ↓
        Tool result is returned to the LLM
                                ↓
        LLM: “Your note has been saved successfully.”

- Steps to create
        * Create a note model(articleId,content)
        * Create tool 
                - syntax
                        tool(toolFunction,toolConfiguration)

                > tool(async(input)=>{
                        business logic
                        },
                        {
                          name:"",
                          description:"",
                          schema:""
                        })
                        
                        - The input receives the args generated by LLM according to tool schema
                        - "name" is the unique identifier of the tool. The LLM returns this name when it decides to call the tool.
                        - "description" is the one which LLM uses when choosing a tool.
                        - "schema" defines the inputs the tool function expects.

                        

# Search academic tool API URL
        `https://api.crossref.org/works?query=${encodeURIComponent(topic)}&rows=3`

# Lookup tool API URL
         `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(topic)}&srlimit=3&format=json`,

# Translate tool API URL
        https://api.sarvam.ai/translate




 new SystemMessage(`
                        You are a helpful assistant for an e-learning application.

                        Answer questions about the selected article using the supplied article context.
                        Use tools only when the user clearly asks for an action that needs one:
                        - Search academic papers when the user asks for scholarly papers or research sources.
                        - Look up a topic when the user asks for an external topic lookup.
                        - Translate text when the user explicitly asks for a translation.
                        For ordinary questions, answer without calling a tool.
                        Do not claim a tool was used unless you receive its result.
                        `),




# Agent tools API URLs
        Europe PMC — Search research papers:
               https://europepmc.org/api/get/articleApi?query=semaglutide%20obesity%20AND%20HAS_ABSTRACT%3AY&resultType=core&format=json&pageSize=5
        
        ClinicalTrials.gov — Search clinical trials:
                https://clinicaltrials.gov/api/v2/studies?query.cond=Obesity&query.intr=Semaglutide&pageSize=5&format=json
        
        openFDA — Get drug-label safety information:
                https://api.fda.gov/drug/label.json?search=openfda.generic_name:%22semaglutide%22&limit=1
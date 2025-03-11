require("dotenv").config(); // Load .env variables
const fs = require("fs");
const path = require("path");
const ollama = require("ollama");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { FAISS } = require("langchain/vectorstores/faiss");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");

// Check if API key is loaded
if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY in .env file!");
  process.exit(1); // Stop execution if missing API key
}

// Load financial document
const filePath = path.resolve(__dirname, "../data/financial_tips.txt");
const financialText = fs.readFileSync(filePath, "utf8");

// Split text into smaller chunks for search
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});

(async () => {
  try {
    const chunks = await splitter.splitText(financialText);
    const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }); // Pass API key here
    var vectorStore = await FAISS.fromTexts(chunks, embeddings);
  } catch (error) {
    console.error("Error setting up vector embeddings:", error);
  }
})();

exports.askChatbot = async (req, res) => {
  try {
    const { question } = req.body;
    if (!vectorStore) return res.status(500).json({ error: "Vector store not initialized" });

    const results = await vectorStore.similaritySearch(question, 1);

    if (results.length > 0) {
      const context = results[0].pageContent;
      const response = await ollama.chat({
        model: "mistral",
        messages: [
          {
            role: "system",
            content:
              "Answer the question strictly based on the given financial document. If the document does not contain the answer, say 'I can only provide financial advice based on the given document.'",
          },
          {
            role: "user",
            content: `Based on this document, answer: ${question}\n\nContext: ${context}`,
          },
        ],
      });

      return res.json({ answer: response.message.content });
    } else {
      return res.json({
        answer: "I can only provide financial advice based on the given document.",
      });
    }
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

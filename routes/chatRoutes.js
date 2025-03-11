const express = require("express");
const axios = require("axios");

const router = express.Router();

// Chatbot route
router.post("/", async (req, res) => {
  const { userMessage } = req.body;

  if (!userMessage.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    // Call the Python Flask service for RAG
    const response = await axios.post("http://127.0.0.1:5000/get_answer", {
      query: userMessage,
    });

    res.json({ response: response.data.response.trim() });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Failed to get response from AI" });
  }
});

module.exports = router;

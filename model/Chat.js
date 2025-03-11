const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    userMessage: { type: String, required: true },
    botResponse: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { collection: "chats" } // Optional: specify collection name
);

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;

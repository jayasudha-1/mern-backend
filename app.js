require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRouter = require("./routes/userRouter");
const categoryRouter = require("./routes/categoryRouter");
const transactionRouter = require("./routes/transactionRouter");
const errorHandler = require("./middlewares/errorHandlerMiddleware");

const app = express();
const chatRoutes = require("./routes/chatRoutes");

//! Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("DB Connected"))
  .catch((e) => console.error("DB Connection Error:", e));

//! CORS configuration
const corsOptions = {
  origin: ["http://localhost:5173"], // Allow requests from frontend
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"], // Allowed methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  credentials: true, // Allow credentials (cookies, etc.)
};
app.use(cors(corsOptions));

//! Middlewares
app.use(express.json()); // Parse incoming JSON data

//! Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/transactions", transactionRouter);
app.use("/chat", chatRoutes);
//! Error handler
app.use(errorHandler);

//! Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

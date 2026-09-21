import express from "express";
import { connect } from "mongoose";
import { config } from "dotenv";
import { articleRouter } from "./api/article.router.js";
config();
const app = express();
// body parser middleware
app.use(express.json());
// article router integration
app.use("/api/articles",articleRouter)

async function connectDB() {
  try {
    await connect(process.env.DB_URL);
    console.log("Connected to DB");
    app.listen(process.env.PORT, () =>
      console.log(`Server listening on port ${process.env.PORT}`),
    );
  } catch (err) {
    console.log("Error in DB connection :", err);
  }
}

// Connect to DB and then start HTTP server
connectDB()

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
})

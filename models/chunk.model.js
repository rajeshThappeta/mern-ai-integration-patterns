import { Schema, model, Types } from "mongoose";

const chunkSchema = new Schema(
  {
    articleId: {
      type: Types.ObjectId,
      ref: "Article",
      required: [true, "Article ID is required"],
      index: true,
    },

    chunkText: {
      type: String,
      required: [true, "Chunk text is required"],
      trim: true,
    },

    chunkIndex: {
      type: Number,
      required: [true, "Chunk index is required"],
      min: [0, "Chunk index cannot be negative"],
    },

    embedding: {
      type: [Number],
      required: [true, "Chunk embedding is required"],
      validate: {
        validator: (embedding) =>
          Array.isArray(embedding) && embedding.length === 2560,
        message: "Embedding must contain exactly 2560 dimensions",
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
  },
);

chunkSchema.index({ articleId: 1, chunkIndex: 1 }, { unique: true });

export const ChunkModel = model("Chunk", chunkSchema);

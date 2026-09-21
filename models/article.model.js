import { Schema, model } from "mongoose";

const articleSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Article title is required"],
      trim: true,
    },

    content: {
      type: String,
      required: [true, "Article content is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
  },
);

export const ArticleModel = model("Article", articleSchema);

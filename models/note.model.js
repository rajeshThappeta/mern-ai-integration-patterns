import { Schema, model, Types } from "mongoose";

const noteSchema = new Schema(
  {
    articleId: {
      type: Types.ObjectId,
      ref: "article",
      required: [true, "Article ID is required"],
    },

    content: {
      type: String,
      required: [true, "Note content is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
  },
);

export const NoteModel = model("note", noteSchema);
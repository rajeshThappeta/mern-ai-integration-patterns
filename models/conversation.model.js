import { Schema, model, Types } from "mongoose";

/**
 * Represents one message inside a conversation.
 */
const messageSchema = new Schema(
  {
    role: {
      type: String,
      enum: {
        values: ["user", "assistant"],
        message: "Message role must be user or assistant",
      },
      required: [true, "Message role is required"],
    },

    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/**
 * Represents one conversation related to a specific article.
 */
const conversationSchema = new Schema(
  {
    articleId: {
      type: Types.ObjectId,
      ref: "article",
      required: [true, "Article ID is required"],
      index: true,
    },

    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: "throw",
  },
);

export const ConversationModel = model("conversation", conversationSchema);

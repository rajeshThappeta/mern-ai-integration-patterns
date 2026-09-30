import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { config } from "dotenv";
config();

export const translateTextTool = tool(
  async ({ text }) => {
    const response = await fetch("https://api.sarvam.ai/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": process.env.SARVAM_API_KEY,
      },
      body: JSON.stringify({
        input: text,
        source_language_code: "en-IN",
        target_language_code: "te-IN",
        model: "mayura:v1",
      }),
    });

    const data = await response.json();

    return data.translated_text;
  },
  {
    name: "translate_text",
    description: "Translate text into another language.",
    schema: z.object({
      text: z.string().describe("Text to translate"),
      sourceLanguage: z.string().describe("Source language code, e.g. en-IN"),
      targetLanguage: z.string().describe("Target language code, e.g. te-IN"),
    }),
  },
);

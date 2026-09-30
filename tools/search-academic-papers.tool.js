import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const searchAcademicPapersTool = tool(
  async ({ topic }) => {
    const response = await fetch(
      `https://api.crossref.org/works?query=${encodeURIComponent(topic)}&rows=3`,
    );

    if (!response.ok) {
      throw new Error("Could not search Crossref for academic papers");
    }

    const data = await response.json();
    const papers = data.message?.items ?? [];

    if (papers.length === 0) {
      return `No academic papers were found for "${topic}".`;
    }

    // Return each paper's title and available URL.
    return papers
      .map((paper, index) => {
        const title = paper.title?.[0] ?? "Title unavailable";
        const url = paper.URL ?? "URL unavailable";

        return `${index + 1}. ${title}\n${url}`;
      })
      .join("\n\n");
  },
  {
    name: "search_academic_papers",
    description:
      "Search for academic papers related to a topic. Use when the user asks for research papers or scholarly sources.",
    schema: z.object({
      topic: z.string().min(2).describe("The research topic to search for"),
    }),
  },
);

import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const lookupTopicTool = tool(
  async ({ topic }) => {
    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(topic)}&srlimit=3&format=json`,
    );

    if (!response.ok) {
      throw new Error("Could not search Wikipedia");
    }

    const data = await response.json();
    const pages = data.query?.search ?? [];

    if (pages.length === 0) {
      return `No Wikipedia pages were found for "${topic}".`;
    }

    return pages
      .map((page, index) => {
        const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(
          page.title.replace(/ /g, "_"),
        )}`;

        return `${index + 1}. ${page.title}\n${pageUrl}`;
      })
      .join("\n\n");
  },
  {
    name: "lookup_external_topic",
    description:
      "Search Wikipedia for a topic and return matching page titles and links.",
    schema: z.object({
      topic: z.string().min(2).describe("The topic to look up"),
    }),
  },
);

import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const searchBiomedicalPapersTool = tool(
  async ({ topic }) => {
    console.log("[Tool started] search-biomedical_paper");
    console.log("[Arguments]", { topic });
    // Search for papers that contain an abstract.
    const url = `https://europepmc.org/api/get/articleApi?query=${encodeURIComponent(`${topic} AND HAS_ABSTRACT:Y`)}&resultType=core&format=json&pageSize=5`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Could not search biomedical papers");
    }

    const data = await response.json();
    const results = data.resultList?.result ?? [];

    // Return only the properties needed by the agent.
    const papers = results.map((paper) => ({
      title: paper.title,
      abstract: paper.abstractText,
      authors: paper.authorString,
      publicationYear: paper.pubYear,
      doi: paper.doi ?? null,

      // Prefer the DOI link; otherwise, link to the Europe PMC record.
      sourceUrl: paper.doi
        ? `https://doi.org/${paper.doi}`
        : `https://europepmc.org/article/${paper.source}/${paper.id}`,
    }));

    console.log("[Tool result]", { papers });
    console.log("[Tool completed] search-biomedical_paper");

    return JSON.stringify({ papers });
  },
  {
    name: "search_biomedical_papers",
    description:
      "Search biomedical research papers by topic. Returns titles, abstracts and publication details. Use this first when the user asks for biomedical research evidence.",
    schema: z.object({
      topic: z.string().min(2).describe("The biomedical topic to research"),
    }),
  },
);

import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const getDrugSafetyInformationTool = tool(
  async ({ drugName }) => {
    console.log("[Tool started] druf_safety_infomation");
    console.log("[Arguments]", { drugName });
    // Find the latest matching FDA drug label.
    const url = `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(`openfda.generic_name:"${drugName}"`)}&limit=1`;

    const response = await fetch(url);

    // openFDA returns 404 when it cannot find a matching label.
    if (response.status === 404) {
      return JSON.stringify({
        drug: null,
        message: `No FDA label was found for "${drugName}".`,
      });
    }

    if (!response.ok) {
      throw new Error("Could not retrieve drug safety information");
    }

    const data = await response.json();
    const label = data.results[0];

    // Return only the label sections required by the agent.
    const drug = {
      labelId: label.id,
      effectiveDate: label.effective_time,

      brandNames: label.openfda?.brand_name ?? [],
      genericNames: label.openfda?.generic_name ?? [],
      manufacturerNames: label.openfda?.manufacturer_name ?? [],

      // Identify which formulation this label represents.
      dosageForms: label.openfda?.dosage_form ?? [],
      routes: label.openfda?.route ?? [],

      indicationsAndUsage:
        label.indications_and_usage?.[0] ?? "Information not available",

      boxedWarning: label.boxed_warning?.[0] ?? "Information not available",

      warningsAndCautions:
        label.warnings_and_cautions?.[0] ??
        label.warnings?.[0] ??
        "Information not available",

      adverseReactions:
        label.adverse_reactions?.[0] ?? "Information not available",

      // Directly retrieve this specific openFDA label.
      sourceUrl: `https://api.fda.gov/drug/label.json?search=id:${encodeURIComponent(
        label.id,
      )}`,
    };

    console.log("[Tool result]", { drug });
    console.log("[Tool completed] druf_safety_infomation");

    return JSON.stringify({ drug });
  },
  {
    name: "get_drug_safety_information",
    description:
      "Retrieve official FDA label information, warnings and adverse reactions for a drug. Use after identifying a specific drug.",
    schema: z.object({
      drugName: z
        .string()
        .min(2)
        .describe("The generic drug name, such as semaglutide"),
    }),
  },
);

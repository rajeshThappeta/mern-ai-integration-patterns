import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const searchClinicalTrialsTool = tool(
  async ({ condition, intervention }) => {
    console.log("[Tool started] search_clinical_trials");
    console.log("[Arguments]", { condition, intervention });

    // Search trials using the condition and intervention.
    const url = `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodeURIComponent(condition)}&query.intr=${encodeURIComponent(intervention)}&pageSize=5&format=json`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Could not search clinical trials");
    }

    const data = await response.json();

    // Extract the studies array from the API response.
    const studies = data.studies ?? [];

    // Return only the useful information from each trial.
    const trials = studies.map((study) => {
      const protocol = study.protocolSection;
      const trialId = protocol.identificationModule?.nctId;

      console.log("[Tool result]", { trials });
      console.log("[Tool completed] search_clinical_trials");

      return {
        trialId,
        title: protocol.identificationModule?.briefTitle,
        status: protocol.statusModule?.overallStatus,
        phases: protocol.designModule?.phases ?? [],

        enrollment: {
          count: protocol.designModule?.enrollmentInfo?.count,
          type: protocol.designModule?.enrollmentInfo?.type,
        },

        conditions: protocol.conditionsModule?.conditions ?? [],

        interventions:
          protocol.armsInterventionsModule?.interventions?.map(
            (trialIntervention) => ({
              type: trialIntervention.type,
              name: trialIntervention.name,
              description: trialIntervention.description,
            }),
          ) ?? [],

        // These describe what the trial measures, not its achieved results.
        primaryOutcomes:
          protocol.outcomesModule?.primaryOutcomes?.map((outcome) => ({
            measure: outcome.measure,
            description: outcome.description,
            timeFrame: outcome.timeFrame,
          })) ?? [],

        // Shows whether results have been posted on ClinicalTrials.gov.
        hasResults: study.hasResults ?? false,

        sourceUrl: `https://clinicaltrials.gov/study/${trialId}`,
      };
    });

    return JSON.stringify({ trials });
  },
  {
    name: "search_clinical_trials",
    description:
      "Search clinical trials for a medical condition and intervention. Use after identifying a condition and treatment from the user's request or research papers.",
    schema: z.object({
      condition: z
        .string()
        .min(2)
        .describe("The medical condition, such as obesity"),
      intervention: z
        .string()
        .min(2)
        .describe("The drug or treatment, such as semaglutide"),
    }),
  },
);

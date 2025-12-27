import { tool } from "ai";
import { z } from "zod";

const API_TOKEN = "51108da7e7707155797e857f6469c0c9d6ec3d4bd13f0d4cc2a3e2b3552b21301a300a94156b65162488d684b065ec2d";

export const getAirportDetails = tool({
    description: "Get detailed airport information including runways and frequencies using an ICAO code.",
    inputSchema: z.object({
        icao: z.string().describe("The ICAO code of the airport (e.g., 'KJFK', 'LEMD')"),
    }),
    needsApproval: true,
    execute: async (input) => {
        try {
            const response = await fetch(
                `https://airportdb.io/api/v1/airport/${input.icao}?apiToken=${API_TOKEN}`
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ AirportDB Error (${response.status}) [${input.icao}]:`, errorText);
                return { error: `API ${response.status}`, details: errorText };
            }

            const data = await response.json();
            return data;
        } catch (err) {
            console.error("Error fetching airport details:", err);
            return { error: "An unexpected error occurred while fetching airport details." };
        }
    },
});

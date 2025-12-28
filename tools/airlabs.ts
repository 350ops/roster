import { AIRPORT_COORDINATES } from '@/constants/airports';

const API_KEY = "9d46035e-4172-497f-83b2-cc038b95d585";
const BASE_URL = "https://airlabs.co/api/v9/airports";

// Simple in-memory cache to avoid repeated requests in same session
const SESSION_CACHE: Record<string, { latitude: number; longitude: number }> = {};

export async function getAirportCoordinates(iataCode: string): Promise<{ latitude: number; longitude: number } | null> {
    const code = iataCode.toUpperCase();

    // 1. Check static constant first
    if (AIRPORT_COORDINATES[code]) {
        return AIRPORT_COORDINATES[code];
    }

    // 2. Check session cache
    if (SESSION_CACHE[code]) {
        return SESSION_CACHE[code];
    }

    // 3. Fetch from API
    try {
        console.log(`✈️ Fetching coordinates for ${code} from AirLabs...`);
        const response = await fetch(`${BASE_URL}?iata_code=${code}&api_key=${API_KEY}`);
        const data = await response.json();

        if (data.response && data.response.length > 0) {
            const airport = data.response[0];
            const coords = {
                latitude: airport.lat,
                longitude: airport.lng
            };

            // Cache it
            SESSION_CACHE[code] = coords;
            return coords;
        } else {
            console.warn(`⚠️ No data found for airport: ${code}`);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error fetching airport ${code}:`, error);
        return null;
    }
}

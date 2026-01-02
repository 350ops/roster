const CLIENT_ID = process.env.EXPO_PUBLIC_AMADEUS_CLIENT_ID;
const CLIENT_SECRET = process.env.EXPO_PUBLIC_AMADEUS_CLIENT_SECRET;

// API base URL - use test environment if EXPO_PUBLIC_AMADEUS_ENV is set to 'test', otherwise use production
const API_BASE_URL = process.env.EXPO_PUBLIC_AMADEUS_ENV === 'test' 
    ? 'https://test.api.amadeus.com'
    : 'https://api.amadeus.com';

let accessToken = '';
let tokenExpiration = 0;

/**
 * Validates that Amadeus API credentials are configured
 * @returns {boolean} True if credentials are valid, false otherwise
 */
const validateCredentials = (): boolean => {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.error(
            'Amadeus API credentials are not configured. Please set EXPO_PUBLIC_AMADEUS_CLIENT_ID and EXPO_PUBLIC_AMADEUS_CLIENT_SECRET environment variables.'
        );
        return false;
    }
    return true;
};

const getAccessToken = async () => {
    // Validate credentials before making request
    if (!validateCredentials()) {
        return null;
    }

    const now = Date.now();
    if (accessToken && now < tokenExpiration) {
        return accessToken;
    }

    try {
        // Use URLSearchParams for proper encoding of credentials
        const params = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: CLIENT_ID!,
            client_secret: CLIENT_SECRET!,
        });

        const response = await fetch(`${API_BASE_URL}/v1/security/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        const data = await response.json();
        
        if (data.access_token) {
            accessToken = data.access_token;
            tokenExpiration = now + data.expires_in * 1000;
            return accessToken;
        } else {
            // Check for specific error types
            if (data.error === 'invalid_client') {
                console.error(
                    'Invalid Amadeus API credentials. Please verify your CLIENT_ID and CLIENT_SECRET.',
                    { error: data.error, error_description: data.error_description }
                );
            } else {
                console.error('Failed to retrieve access token:', {
                    error: data.error,
                    error_description: data.error_description,
                    title: data.title,
                });
            }
            return null;
        }
    } catch (error) {
        // Handle network errors
        if (error instanceof Error) {
            console.error('Network error fetching access token:', error.message);
        } else {
            console.error('Error fetching access token:', error);
        }
        return null;
    }
};

export const searchAirports = async (keyword: string) => {
    if (!keyword) return [];

    const token = await getAccessToken();
    if (!token) return [];

    try {
        const response = await fetch(
            `${API_BASE_URL}/v1/reference-data/locations?subType=AIRPORT&keyword=${keyword}&page[limit]=5`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error searching airports:', error);
        return [];
    }
};

export const searchFlightOffers = async (
    origin: string,
    destination: string,
    departureDate: string,
    adults: number = 1,
    nonStop: boolean = false,
    travelClass: string = 'ECONOMY'
) => {
    const token = await getAccessToken();
    if (!token) return { data: [], dictionaries: {} };

    try {
        const params = new URLSearchParams({
            originLocationCode: origin,
            destinationLocationCode: destination,
            departureDate: departureDate,
            adults: adults.toString(),
            nonStop: nonStop.toString(),
            travelClass: travelClass,
            max: '10',
        });

        const response = await fetch(
            `${API_BASE_URL}/v2/shopping/flight-offers?${params.toString()}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await response.json();
        console.log('Flight offers response:', data);
        return {
            data: data.data || [],
            dictionaries: data.dictionaries || {}
        };
    } catch (error) {
        console.error('Error searching flight offers:', error);
        return { data: [], dictionaries: {} };
    }
};

export const getSeatmap = async (flightOffer: any) => {
    const token = await getAccessToken();
    if (!token) return null;

    try {
        const response = await fetch(
            `${API_BASE_URL}/v1/shopping/seatmaps`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: [flightOffer]
                }),
            }
        );

        const data = await response.json();
        console.log('Seatmap response:', data);
        return {
            data: data.data || [],
            dictionaries: data.dictionaries || {}
        };
    } catch (error) {
        console.error('Error fetching seatmap:', error);
        return null;
    }
};
export const getOperatingFlight = async (
    carrierCode: string,
    flightNumber: string,
    departureDate: string
) => {
    const token = await getAccessToken();
    if (!token) return null;

    try {
        const response = await fetch(
            `${API_BASE_URL}/v2/schedule/flights?carrierCode=${carrierCode}&flightNumber=${flightNumber}&scheduledDepartureDate=${departureDate}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = await response.json();
        if (data.data && data.data.length > 0) {
            const segment = data.data[0].segments?.[0];
            if (segment?.partnership?.operatingFlight) {
                return segment.partnership.operatingFlight;
            }
        }
        return null;
    } catch (error) {
        console.error('Error fetching operating flight:', error);
        return null;
    }
};

// Configure runtime to use Node.js instead of Edge
export const runtime = 'nodejs';

// @ts-ignore - pdf-parse is CommonJS
// Note: pdf-parse requires Node.js runtime, not Edge runtime
let pdf: any;
try {
    // We use a dynamic require to prevent Metro from trying to bundle this for native
    // The 'if' check with a string constant helps hide it from some static analyzers
    if (typeof window === 'undefined') {
        const pdfModuleName = 'pdf-parse';
        // v1.1.1 usually exports the function directly
        const pdfModule = require(pdfModuleName);
        pdf = pdfModule.default || pdfModule;
    }
} catch (error) {
    console.error('Failed to load pdf-parse:', error);
}

// Flight type
interface Flight {
    date: string;
    origin: string;
    destination: string;
    block_hours: string;
    flight?: string;
}

// Regexes ported from Python
const DATE_REGEX = /\d{2}-[A-Za-z]{3}-\d{4}/;
const FLIGHT_LINE_REGEX = /(?<flight>QR\d+)\/(?<origin>[A-Z]{3})-(?<destination>[A-Z]{3})\s+[A-Z0-9-]+\s+(?<block>\d{2}:\d{2})/;

// Roster-style regexes
const DATE_HEADER_REGEX = /^\d{2}[A-Z][a-z]{2}$/;
const FLIGHT_NUM_REGEX = /^\d{3,4}$/;
const AIRPORT_REGEX = /^[A-Z]{3}$/;
const TIME_REGEX = /^\d{2}:\d{2}(\(\+1\))?$/;

const MONTH_MAP: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
};

// Parse "Flying Statistics Report" format
function extractFlightsFromStatisticsReport(text: string): Flight[] {
    const flights: Flight[] = [];
    let currentDate: string | null = null;

    for (const line of text.split('\n')) {
        const trimmed = line.trim();

        // Detect date line
        const dateMatch = trimmed.match(DATE_REGEX);
        if (dateMatch) {
            const parsed = new Date(dateMatch[0]);
            if (!isNaN(parsed.getTime())) {
                currentDate = parsed.toISOString().split('T')[0];
            }
            continue;
        }

        // Detect flight line
        const flightMatch = FLIGHT_LINE_REGEX.exec(trimmed);
        if (flightMatch && flightMatch.groups && currentDate) {
            const blockTime = flightMatch.groups.block;
            if (blockTime === '00:00') continue;

            flights.push({
                date: currentDate,
                origin: flightMatch.groups.origin,
                destination: flightMatch.groups.destination,
                block_hours: blockTime,
                flight: flightMatch.groups.flight,
            });
        }
    }

    return flights;
}

// Parse roster grid format (simplified heuristic)
function extractFlightsFromRoster(text: string): Flight[] {
    const flights: Flight[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const year = new Date().getFullYear();

    // Look for tokens that match patterns
    const tokens: string[] = [];
    for (const line of lines) {
        tokens.push(...line.split(/\s+/));
    }

    // Find date headers like "01Mar"
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (DATE_HEADER_REGEX.test(token)) {
            const day = parseInt(token.slice(0, 2), 10);
            const monthStr = token.slice(2);
            const month = MONTH_MAP[monthStr];
            if (month === undefined) continue;

            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];

            // Look ahead for flight pattern: airport, flight#, time, time, airport
            for (let j = i + 1; j < Math.min(i + 20, tokens.length); j++) {
                if (FLIGHT_NUM_REGEX.test(tokens[j])) {
                    const flightNum = tokens[j];

                    // Collect nearby airports and times
                    const context = tokens.slice(Math.max(0, j - 3), Math.min(tokens.length, j + 6));
                    const airports = context.filter(t => AIRPORT_REGEX.test(t));
                    const times = context.filter(t => TIME_REGEX.test(t));

                    if (airports.length >= 2 && times.length >= 2) {
                        const origin = airports[0];
                        const dest = airports[1];
                        const dep = times[0].replace('(+1)', '');
                        const arr = times[1].replace('(+1)', '');

                        // Calculate block time
                        const [depH, depM] = dep.split(':').map(Number);
                        let [arrH, arrM] = arr.split(':').map(Number);
                        if (times[1].includes('(+1)')) arrH += 24;

                        const depMinutes = depH * 60 + depM;
                        const arrMinutes = arrH * 60 + arrM;
                        const blockMinutes = arrMinutes - depMinutes;

                        if (blockMinutes > 0) {
                            const hours = Math.floor(blockMinutes / 60);
                            const mins = blockMinutes % 60;

                            flights.push({
                                date: dateStr,
                                origin,
                                destination: dest,
                                block_hours: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`,
                                flight: flightNum,
                            });
                        }
                    }
                }
            }
        }
    }

    // Deduplicate
    const seen = new Set<string>();
    return flights.filter(f => {
        const key = `${f.date}-${f.origin}-${f.destination}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// Parse EASA FCL .050 Logbook format
// Format: Date (DD/MM/YY) | Dep | Time | Arr | Time | Model | Reg | ...
function extractFlightsFromEASALogbook(text: string): Flight[] {
    const flights: Flight[] = [];
    const EASA_DATE_REGEX = /^\d{2}\/\d{2}\/\d{2}$/;

    // Split into lines
    const lines = text.split('\n');

    for (const line of lines) {
        const parts = line.trim().split(/\s+/);

        // Need at least: Date, Dep, Time, Arr, Time, Model, Reg (7 parts)
        if (parts.length < 7) continue;

        // Check if line starts with Date DD/MM/YY
        if (!EASA_DATE_REGEX.test(parts[0])) continue;

        try {
            const dateStr = parts[0]; // 31/01/14
            const origin = parts[1];  // MLE
            const depTime = parts[2]; // 19:00
            const dest = parts[3];    // XIY
            const arrTime = parts[4]; // 21:00
            const model = parts[5];   // A320
            const reg = parts[6];     // 8Q-IAN

            // Validate times and places look right
            if (!/^\d{2}:\d{2}$/.test(depTime) || !/^\d{2}:\d{2}$/.test(arrTime)) continue;
            if (!/^[A-Z0-9]{3,4}$/.test(origin) || !/^[A-Z0-9]{3,4}$/.test(dest)) continue;

            // Parse Date: 31/01/14 -> 2014-01-31
            const [d, m, y] = dateStr.split('/');
            const fullYear = parseInt(y, 10) + 2000; // Assume 20xx
            const isoDate = `${fullYear}-${m}-${d}`;

            // Calculate Block Time
            const [depH, depM] = depTime.split(':').map(Number);
            const [arrH, arrM] = arrTime.split(':').map(Number);

            let depMinutes = depH * 60 + depM;
            let arrMinutes = arrH * 60 + arrM;

            // Handle date crossover (Arrival next day)
            if (arrMinutes < depMinutes) {
                arrMinutes += 24 * 60;
            }

            const diffMinutes = arrMinutes - depMinutes;
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;
            const blockHours = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

            flights.push({
                date: isoDate,
                origin,
                destination: dest,
                block_hours: blockHours,
                flight: reg // Use Registration as flight number since none is provided
            });

        } catch (e) {
            console.log('Error parsing EASA line:', line, e);
        }
    }

    return flights;
}

// Parse "Duty Hrs Statistics Report" format
// Example: 22-May-202418:11 \n 713/DOH-IAHA7-AND18:11
function extractFlightsFromDutyStats(text: string): Flight[] {
    const flights: Flight[] = [];
    const DUTY_DATE_REGEX = /^(\d{2}-[A-Za-z]{3}-\d{4})/;
    // Matches 713/DOH-IAH or 620/DOH-LHE
    const FLIGHT_PATTERN = /(?<flight>\d{3,4})\/(?<origin>[A-Z]{3})-(?<destination>[A-Z]{3})/g;

    let currentDate: string | null = null;

    const lines = text.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();

        // 1. Check for Date at start of line
        const dateMatch = trimmed.match(DUTY_DATE_REGEX);
        if (dateMatch) {
            try {
                const dateRaw = dateMatch[1];
                const parsed = new Date(dateRaw);
                if (!isNaN(parsed.getTime())) {
                    currentDate = parsed.toISOString().split('T')[0];
                }
            } catch (e) {
                // Ignore invalid dates
            }
        }

        // 2. Scan for flights in this line
        // Note: A single line can have multiple flights, e.g. "620/DOH-LHE,621/LHE-DOH..."
        if (currentDate) {
            const matches = trimmed.matchAll(FLIGHT_PATTERN);
            for (const match of matches) {
                if (match.groups) {
                    flights.push({
                        date: currentDate,
                        origin: match.groups.origin,
                        destination: match.groups.destination,
                        flight: match.groups.flight,
                        block_hours: "00:00" // Placeholder, as strict block time isn't clear in this report
                    });
                }
            }
        }
    }

    return flights;
}

export async function POST(request: Request): Promise<Response> {
    try {
        // Check if pdf-parse is available
        if (!pdf) {
            return Response.json({
                error: 'PDF parsing not available. Please use the Flask server or configure Node.js runtime.'
            }, { status: 500 });
        }

        // Get form data (cast to any to work around Node.js vs Web FormData type conflict)
        const formData = await request.formData() as any;
        const file = formData.get('file');

        if (!file || !(file instanceof Blob)) {
            return Response.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Read file as buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse PDF
        const pdfData = await pdf(buffer);
        const text = pdfData.text;

        // Try statistics report format first (original)
        let flights = extractFlightsFromStatisticsReport(text);

        // If no flights found, try roster format
        if (flights.length === 0) {
            flights = extractFlightsFromRoster(text);
        }

        // If still no flights, try EASA logbook format
        if (flights.length === 0) {
            flights = extractFlightsFromEASALogbook(text);
        }

        // If still no flights, try Duty Stats format
        if (flights.length === 0) {
            flights = extractFlightsFromDutyStats(text);
        }

        return Response.json({
            count: flights.length,
            flights,
        });
    } catch (error: any) {
        console.error('PDF processing error:', error);
        return Response.json({ error: error.message || 'Failed to process PDF' }, { status: 500 });
    }
}

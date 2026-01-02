/**
 * Mapping of seat characteristic codes to their descriptions.
 * Based on SeatMapDisplay_v1_Version_1.9_swagger_specification.json
 */
export const seatCharacteristics: Record<string, string> = {
    "1": "Restricted seat - General",
    "9": "Center seat (not window, not aisle)",
    "A": "Aisle seat",
    "RS": "Right side of aircraft",
    "DE": "Deportee",
    "C": "Crew seat",
    "CH": "Chargeable seats",
    "E": "Exit row seat",
    "LS": "Left side of aircraft",
    "K": "Bulkhead seat",
    "L": "Leg space seat",
    "1A_AQC_PREMIUM_SEAT": "Premium seat",
    "O": "Preferential seat",
    "1A": "Seat not allowed for infant",
    "1B": "Seat not allowed for medical",
    "1D": "Restricted recline seat",
    "U": "Seat suitable for unaccompanied minors",
    "V": "Seat to be left vacant or offered last",
    "W": "Window seat",
    "IE": "Seat not suitable for child",
    "FC": "Front of cabin class/compartment"
};

/**
 * Returns the description for a given seat characteristic code.
 * If the code is not found, returns the code itself.
 * @param code The seat characteristic code (e.g., "1A", "W")
 * @returns The description or the code if not found
 */
export const getSeatCharacteristicDescription = (code: string): string | null => {
    return seatCharacteristics[code] || null;
};

import pdfplumber
import pandas as pd
import re
from datetime import datetime
import roster  # Import the roster parser

import os

# Get path relative to the script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PDF_PATH = os.path.join(SCRIPT_DIR, "Roster Report.pdf")
OUTPUT_CSV = os.path.join(SCRIPT_DIR, "flights.csv")

# Matches lines like:
# QR199/DOH-BUD A7-AHW 05:11
FLIGHT_LINE_REGEX = re.compile(
    r"""
    (?P<flight>QR\d+)/
    (?P<origin>[A-Z]{3})-(?P<destination>[A-Z]{3})
    \s+[A-Z0-9-]+
    \s+(?P<block>\d{2}:\d{2})
    """,
    re.VERBOSE
)

# Matches date lines like:
# 29-Jul-2025
DATE_REGEX = re.compile(r"\d{2}-[A-Za-z]{3}-\d{4}")

def extract_flights(pdf_path):
    rows = []
    current_date = None

    # Method 1: Try Original Parsing (Linear text scan)
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if not text:
                    continue

                for line in text.splitlines():
                    line = line.strip()

                    # Detect date line
                    date_match = DATE_REGEX.match(line)
                    if date_match:
                        current_date = datetime.strptime(date_match.group(0), "%d-%b-%Y").date()
                        continue

                    # Detect flight line
                    match = FLIGHT_LINE_REGEX.search(line)
                    if match and current_date:
                        block_time = match.group("block")

                        # Exclude zero block entries explicitly if present
                        if block_time == "00:00":
                            continue

                        rows.append({
                            "date": current_date.isoformat(),
                            "origin": match.group("origin"),
                            "destination": match.group("destination"),
                            "block_hours": block_time,
                            "flight": match.group("flight")
                        })
    except Exception as e:
        print(f"Standard parser encountered error (ignoring): {e}")

    # Method 2: If no rows found logic, try Roster Grid Parser
    if not rows:
        print("Standard parser found 0 flights. Attempting Roster Grid parser...")
        try:
            rows = roster.extract_flights_from_grid(pdf_path)
        except Exception as e:
            print(f"Roster parser failed: {e}")

    return rows

def main():
    print(f"Extracting flights from: {PDF_PATH}")
    flights = extract_flights(PDF_PATH)

    if not flights:
        print("No flights extracted.")
        return

    # Create DataFrame with all available keys
    df = pd.DataFrame(flights)
    
    # Ensure expected columns exist (if not populated)
    expected_cols = ["date", "origin", "destination", "block_hours", "flight"]
    for col in expected_cols:
        if col not in df.columns:
            df[col] = ""

    # Reorder columns for consistency
    df = df[expected_cols]

    df.to_csv(OUTPUT_CSV, index=False)
    print(f"CSV written: {OUTPUT_CSV} ({len(df)} flights)")

if __name__ == "__main__":
    main()
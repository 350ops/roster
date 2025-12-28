import pdfplumber
import pandas as pd
import re
from datetime import datetime, timedelta
import os
import sys

# Get path relative to the script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_CSV = os.path.join(SCRIPT_DIR, "roster_flights.csv")
YEAR = 2025 # TODO: Make this dynamic if needed, or derived from file

# --- Grid Report Regexes ---
DATE_RE = re.compile(r"^\d{2}[A-Z][a-z]{2}$")
IATA_RE = re.compile(r"^[A-Z]{3}$")
FLIGHT_RE = re.compile(r"^(?:QR)?\d{2,4}$")
TIME_RE = re.compile(r"^(?P<h>\d{1,2}):(?P<m>\d{2})(?:\(\+(?P<d>\d)\))?$")

# --- Stats Report Regexes ---
STATS_DATE_RE = re.compile(r"^(\d{2}-[A-Za-z]{3}-\d{4})") # 01-Apr-2024
STATS_FLIGHT_RE = re.compile(r"^(?:QR)?(\d{3,4})/([A-Z]{3})-([A-Z]{3})\s+\S+\s+(\d{2}:\d{2})") # Matches both: "127/DOH-MXP A7-ALW 07:42" AND "QR199/DOH-BUD A7-AHW 05:11 ..."

# --- Helpers ---
MONTHS = {
    "Jan":1,"Feb":2,"Mar":3,"Apr":4,"May":5,"Jun":6,
    "Jul":7,"Aug":8,"Sep":9,"Oct":10,"Nov":11,"Dec":12
}

def parse_time(tok):
    m = TIME_RE.match(tok)
    if not m:
        return None
    return (
        int(m.group("h")),
        int(m.group("m")),
        int(m.group("d") or 0)
    )

def cluster_lines(words, tol=3):
    words = sorted(words, key=lambda w: w["top"])
    lines = []
    for w in words:
        for line in lines:
            if abs(w["top"] - line[0]["top"]) <= tol:
                line.append(w)
                break
        else:
            lines.append([w])
    for line in lines:
        line.sort(key=lambda w: w["x0"])
    return lines

def extract_from_column(words, date):
    flights = []
    lines = cluster_lines(words)
    tokens = [[w["text"] for w in line] for line in lines]

    for i, line in enumerate(tokens):
        flight_tokens = [t for t in line if FLIGHT_RE.match(t)]
        if not flight_tokens:
            continue

        flight = flight_tokens[0].replace("QR","")

        # Scan downwards for Airports and Times
        # Stop if we hit another flight or go too far (e.g. 10 lines)
        iatas = []
        times = []
        
        # Start looking from the current line (in case on same line) 
        # but if flight is alone, it will proceed to next lines
        for j in range(i, min(len(tokens), i+15)):
            # If we hit a NEW flight (at a later line), stop assuming this block belongs to previous flight
            if j > i:
                 next_flight_tokens = [t for t in tokens[j] if FLIGHT_RE.match(t)]
                 if next_flight_tokens:
                     break
            
            # Collect items from this line
            line_iatas = [t for t in tokens[j] if IATA_RE.match(t)]
            line_times = [t for t in tokens[j] if TIME_RE.match(t)]
            
            # Append distinct ones (avoiding duplicates if they appear weirdly)
            for t in line_iatas:
                if t not in iatas: iatas.append(t)
            for t in line_times:
                if t not in times: times.append(t)
            
            # If we have enough data, we can stop early? 
            # Ideally yes, but maybe there's noise. 
            # But usually 2 IATAs and 2 Times is what we need.
            if len(iatas) >= 2 and len(times) >= 2:
                break

        if len(iatas) < 2 or len(times) < 2:
            continue

        dep = parse_time(times[0])
        arr = parse_time(times[1])
        if not dep or not arr:
            continue

        dep_dt = datetime.combine(date, datetime.min.time()) \
            .replace(hour=dep[0], minute=dep[1])
        arr_dt = datetime.combine(
            date + timedelta(days=arr[2]),
            datetime.min.time()
        ).replace(hour=arr[0], minute=arr[1])

        # Handle date crossover if implicit (+1 not present but time dropped)
        # e.g. 23:00 -> 02:00
        if arr_dt < dep_dt:
             arr_dt += timedelta(days=1)

        block = arr_dt - dep_dt
        hhmm = f"{block.seconds//3600:02d}:{(block.seconds//60)%60:02d}"

        flights.append({
            "date": date.isoformat(),
            "flight": flight,
            "origin": iatas[0],
            "destination": iatas[1],
            "block_hours": hhmm
        })

    return flights

# --- Extractors ---

def extract_flights_from_grid(pdf_path):
    print(f"Extracting from Grid Report: {pdf_path}")
    rows = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            words = page.extract_words()
            headers = [w for w in words if DATE_RE.match(w["text"])]

            if not headers:
                continue

            headers.sort(key=lambda w: w["x0"])
            for idx, h in enumerate(headers):
                start_x = h["x0"] - 2
                end_x = headers[idx+1]["x0"] if idx+1 < len(headers) else page.width

                day = int(h["text"][:2])
                month = MONTHS[h["text"][2:]]
                date = datetime(YEAR, month, day).date()

                col_words = [
                    w for w in words
                    if start_x <= (w["x0"]+w["x1"])/2 < end_x
                    and w["top"] > h["bottom"]
                ]

                rows.extend(extract_from_column(col_words, date))
    return rows

def extract_flights_from_stats(pdf_path):
    print(f"Extracting from Stats Report: {pdf_path}")
    flights = []
    current_date_str = None
    
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue
                
            for line in text.split('\n'):
                line = line.strip()
                
                # Check for Date Line
                # Example: 30-Apr-2024 07:42
                date_match = STATS_DATE_RE.match(line)
                if date_match:
                    current_date_str = date_match.group(1)
                    continue
                    
                # Check for Flight Line
                # Example: 127/DOH-MXP A7-ALW 07:42
                flight_match = STATS_FLIGHT_RE.match(line)
                if flight_match and current_date_str:
                    flight_num = flight_match.group(1)
                    origin = flight_match.group(2)
                    dest = flight_match.group(3)
                    duration = flight_match.group(4)
                    
                    # Parse date
                    try:
                        date_obj = datetime.strptime(current_date_str, "%d-%b-%Y").date()
                        flights.append({
                            "date": date_obj.isoformat(),
                            "flight": flight_num,
                            "origin": origin,
                            "destination": dest,
                            "block_hours": duration
                        })
                    except ValueError as e:
                        print(f"Error parsing date {current_date_str}: {e}")

    return flights

# --- Main ---

def process_file(pdf_path):
    # Try Stats first
    flights = extract_flights_from_stats(pdf_path)
    if not flights:
        # Fallback to Grid
        flights = extract_flights_from_grid(pdf_path)
    return flights

def main():
    toconvert_dir = os.path.join(SCRIPT_DIR, "toconvert")
    all_flights = []
    
    # 1. Look for PDFs in `toconvert`
    if os.path.exists(toconvert_dir):
        pdf_files = [
            os.path.join(toconvert_dir, f) 
            for f in os.listdir(toconvert_dir) 
            if f.lower().endswith(".pdf")
        ]
        
        if pdf_files:
            print(f"Found {len(pdf_files)} PDF(s) in 'toconvert' folder.")
            for pdf_path in pdf_files:
                print(f"Processing: {os.path.basename(pdf_path)}...")
                flights = process_file(pdf_path)
                print(f"  -> Found {len(flights)} flights.")
                all_flights.extend(flights)
        else:
            print("No PDF files found in 'toconvert'. checking root...")
    
    # 2. Fallback: Check root for specific files if nothing from toconvert
    # (Only if we haven't found anything yet, or maybe we want to support both?)
    # User said: "get the file to convert from @[toconvert] and to process any pdf there"
    # So if toconvert has files, we probably shouldn't look at root Roster Report.pdf unless empty?
    # Let's keep it additive or fallback? 
    # Logic: If nothing found in `toconvert`, check root legacy files.
    if not all_flights:
        stats_path = os.path.join(SCRIPT_DIR, "Duty Hrs Statistics Report.pdf")
        roster_path = os.path.join(SCRIPT_DIR, "Roster Report.pdf")
        
        target_pdf = None
        if os.path.exists(stats_path):
            target_pdf = stats_path
        elif os.path.exists(roster_path):
            target_pdf = roster_path
            
        if target_pdf:
            print(f"No files in 'toconvert', falling back to root file: {os.path.basename(target_pdf)}")
            all_flights = process_file(target_pdf)

    # Save
    if not all_flights:
        print("No flights found in any processed files.")
        # Empty CSV
        pd.DataFrame(columns=["date", "flight", "origin", "destination", "block_hours"]).to_csv(OUTPUT_CSV, index=False)
        return

    df = pd.DataFrame(all_flights)
    df.drop_duplicates(subset=["date","flight","origin","destination"], inplace=True)
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"Total extracted: {len(df)} unique flights → {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
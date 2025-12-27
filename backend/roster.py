
import pdfplumber
import pandas as pd
import re
from datetime import datetime, timedelta

import os

# Get path relative to the script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PDF_PATH = os.path.join(SCRIPT_DIR, "Roster Report.pdf")
OUTPUT_CSV = os.path.join(SCRIPT_DIR, "roster_flights.csv")
YEAR = 2025

# Regexes
DATE_HEADER_REGEX = re.compile(r"^\d{2}[A-Z][a-z]{2}$") # 01Mar
FLIGHT_REGEX = re.compile(r"^\d{3,4}$") # 880
AIRPORT_REGEX = re.compile(r"^[A-Z]{3}$") # DOH
TIME_REGEX = re.compile(r"^\d{2}:\d{2}(\(\+1\))?$") # 02:19 or 02:19(+1)

MONTH_MAP = {
    "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
    "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12
}

def parse_time(t_str):
    plus_day = "(+1)" in t_str
    clean_t = t_str.replace("(+1)", "")
    try:
        dt = datetime.strptime(clean_t, "%H:%M")
        return dt, plus_day
    except ValueError:
        return None, False

def extract_flights_from_grid(pdf_path):
    all_flights = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            words = page.extract_words()
            
            # 1. Identify Date Columns
            # Find words that look like dates and are roughly on the same Y-level
            date_words = sorted(
                [w for w in words if DATE_HEADER_REGEX.match(w['text'])],
                key=lambda w: (w['top'], w['x0'])
            )
            
            # Group them by Y-level (lines)
            if not date_words:
                continue
                
            # Assume the row with the most dates is the header
            # Simple clustering by 'top'
            rows = {}
            for w in date_words:
                y = int(w['top'] / 5) * 5 # cluster by 5px tolerance
                if y not in rows: rows[y] = []
                rows[y].append(w)
            
            # Pick the row with most items (probably 30-31 for a month)
            best_y = max(rows.keys(), key=lambda k: len(rows[k]))
            header_dates = sorted(rows[best_y], key=lambda w: w['x0'])
            
            # Determine column boundaries
            # Each day's column starts at its x0 and ends at the next date's x0
            cols = []
            for i in range(len(header_dates)):
                w = header_dates[i]
                start_x = w['x0'] - 2 # slight buffer
                if i < len(header_dates) - 1:
                    end_x = header_dates[i+1]['x0']
                else:
                    end_x = page.width # Last column goes to edge
                
                # Parse date
                d_str = w['text'] # 01Mar
                day = int(d_str[:2])
                month_str = d_str[2:]
                month = MONTH_MAP.get(month_str, 3)
                date_obj = datetime(YEAR, month, day).date()
                
                cols.append({
                    'date': date_obj,
                    'x0': start_x,
                    'x1': end_x,
                    'words': []
                })
            
            # 2. Assign words to columns
            # We skip the header words themselves
            header_bottom = header_dates[0]['bottom']
            
            for w in words:
                if w['top'] <= header_bottom:
                    continue # Skip header and above
                
                # Find which column this word belongs to
                cw = (w['x0'] + w['x1']) / 2 # center of word
                for col in cols:
                    if col['x0'] <= cw < col['x1']:
                        col['words'].append(w)
                        break
            
            # 3. Parse each column vertically
            for col in cols:
                # Sort words by top (Y)
                col_words = sorted(col['words'], key=lambda w: w['top'])
                tokens = [w['text'] for w in col_words]
                
                # Heuristic: Look for blocks of [Airport, Flight, Time, Time ... ]
                # This depends heavily on exact vertical layout.
                # Let's try simpler: Collect all Airports, Flights, Times in order.
                
                # Based on the debug output earlier:
                # Line 7: DOH CKG ... (Airport pairs?)
                # Line 8: 880 ... (Flight)
                # Line 12: Times
                
                # Vertical Sequence in a column might be:
                # DOH (Origin)
                # 880 (Flight)
                # 02:19 (Dep)
                # 14:18 (Arr)
                # CKG (Dest) 
                # ... OR similar.
                
                # Let's iterate and try to grab chunks check if they form a flight
                # State machine approach
                
                # Expected Pattern variants?
                # Variant A: Origin, Dest, Flight, Dep, Arr
                # Variant B: Origin, Flight, Dest, Dep, Arr
                
                # Let's just look for: Flight (3-4 digits), followed eventually by two Times.
                
                for i, token in enumerate(tokens):
                    if FLIGHT_REGEX.match(token):
                        # Potential start of flight block
                        flight_num = token
                        
                        # Look ahead for times
                        times = []
                        airports = []
                        
                        # Search nearby tokens (before and after)
                        # Actually, typically structure is:
                        # Origin (above)
                        # Flight
                        # Dep
                        # Arr
                        # Dest (below??)
                        
                        # Let's try: Find FLIGHT. 
                        # Capture PREVIOUS airport as Origin?
                        # Capture NEXT airport as Dest?
                        # Capture NEXT 2 times as Dep/Arr?
                        
                        # Use a small window search
                        context = tokens[max(0, i-2) : min(len(tokens), i+6)]
                        
                        c_times = [t for t in context if TIME_REGEX.match(t)]
                        c_airports = [t for t in context if AIRPORT_REGEX.match(t)]
                        
                        if len(c_times) >= 2 and len(c_airports) >= 2:
                            # Heuristic match
                            # flight is token
                            # origin = first airport
                            # dest = second airport (or last?)
                            # dep = first time
                            # arr = second time
                            
                            origin = c_airports[0]
                            dest = c_airports[1]
                            dep_str = c_times[0]
                            arr_str = c_times[1]
                            
                            dep_dt, _ = parse_time(dep_str)
                            arr_dt, plus = parse_time(arr_str)
                            
                            if dep_dt and arr_dt:
                                # Calculate block
                                full_dep = datetime.combine(col['date'], dep_dt.time())
                                full_arr = datetime.combine(col['date'] + timedelta(days=1 if plus else 0), arr_dt.time())
                                
                                duration = full_arr - full_dep
                                minutes = int(duration.total_seconds() // 60)
                                hours_s = f"{minutes//60:02d}:{minutes%60:02d}"
                                
                                all_flights.append({
                                    "date": col['date'].isoformat(),
                                    "origin": origin,
                                    "destination": dest,
                                    "block_hours": hours_s,
                                    "flight": flight_num
                                })

    return all_flights

def main():
    try:
        flights = extract_flights_from_grid(PDF_PATH)
    except Exception as e:
        print(f"Error extracting flights: {e}")
        flights = []
        
    if not flights:
        print("No flights found. The layout might differ from expected grid.")
        # Create empty CSV to satisfy subsequent steps
        pd.DataFrame(columns=["date", "origin", "destination", "block_hours", "flight"]).to_csv(OUTPUT_CSV, index=False)
        return

    df = pd.DataFrame(flights)
    # Deduplicate in case overlapping windows caught same flight
    df.drop_duplicates(subset=['date', 'flight'], inplace=True)
    
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"Extracted {len(df)} flights → {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
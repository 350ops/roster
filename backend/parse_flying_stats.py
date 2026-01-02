#!/usr/bin/env python3
"""
Parse Qatar Airways "FLYING HOUR STATISTICS" style PDF into structured rows.

Input:  PDF with repeating sections like:
  AUG 2025 99:04 00:00 00:00
  12-Aug-2025 07:14 00:00 00:00
  QR522/DOH-GOX A7-AHH 03:52 0/0 00:00 00:00
  QR523/GOX-DOH A7-AHH 03:22 0/0 00:00 00:00

Outputs:
  - flights.json  (list of flight-leg records)
  - flights.csv   (same rows)
  - months.csv    (month totals from the month header lines)
"""

from __future__ import annotations
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PDF_PATH = os.path.join(SCRIPT_DIR, "Flying Statistics Report.pdf")
OUTPUT_CSV = os.path.join(SCRIPT_DIR, "flightstats.csv")



import argparse
import csv
import json
import re
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable, Optional, Tuple, List, Dict

import pdfplumber


MONTH_HDR_RE = re.compile(
    r"^(?P<mon>JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(?P<year>\d{4})\s+"
    r"(?P<block>\d{1,3}:\d{2})\s+(?P<deadhead>\d{1,3}:\d{2})\s+(?P<freighter>\d{1,3}:\d{2})\s*$"
)

DATE_HDR_RE = re.compile(
    r"^(?P<date>\d{2}-[A-Za-z]{3}-\d{4})\s+(?P<block>\d{1,3}:\d{2})\s+(?P<deadhead>\d{1,3}:\d{2})\s+(?P<freighter>\d{1,3}:\d{2})\s*$"
)

# Flight-leg line examples:
# QR199/DOH-BUD A7-AHW 05:11 0/0 00:00 00:00
# QR169/DOH-ARN A7-BCD 00:00 0/0 06:47 00:00
FLIGHT_RE = re.compile(
    r"^(?P<flt>[A-Z0-9]{2,3}\d{1,4})/(?P<orig>[A-Z]{3})-(?P<dest>[A-Z]{3})\s+"
    r"(?P<acreg>[A-Z0-9-]{4,8})\s+"
    r"(?P<block>\d{1,3}:\d{2})\s+"
    r"(?P<tol>\d+/\d+)\s+"
    r"(?P<deadhead>\d{1,3}:\d{2})\s+"
    r"(?P<freighter>\d{1,3}:\d{2})\s*$"
)

# Lines we want to ignore
IGNORE_PREFIXES = (
    "Page:",
    "A/C REG",
    "BLOCK HRS",
    "TAKE-OFF",
    "LANDING",
    "DEADHEAD HRS",
    "FREIGHTER HRS",
    "TOTAL:",
    "Abbreviations",
    "ACTIVITY",
    "Input Parameters",
    "Choose Flying Statistics",
    "Start Date",
    "End Date",
    "Crew Type",
    "Aircraft Type",
    "Staff No.",
    "Staff Name",
    "Split Hours",
    "Group By",
    "Rank",
)

@dataclass
class FlightLeg:
    date: str               # YYYY-MM-DD
    month: str              # e.g. "AUG 2025"
    flight_no: str          # e.g. "QR522"
    origin: str             # e.g. "DOH"
    destination: str        # e.g. "GOX"
    ac_reg: str             # e.g. "A7-AHH"
    block_hrs: str          # HH:MM
    takeoff_landing: str    # "0/0" in your report
    deadhead_hrs: str       # HH:MM
    freighter_hrs: str      # HH:MM

def normalize_lines(raw_text: str) -> List[str]:
    lines = []
    for ln in raw_text.splitlines():
        ln = ln.strip()
        if not ln:
            continue
        if any(ln.startswith(p) for p in IGNORE_PREFIXES):
            continue
        # collapse multiple spaces
        ln = re.sub(r"\s+", " ", ln)
        lines.append(ln)
    return lines

def parse_pdf_lines(pdf_path: Path) -> List[str]:
    all_lines: List[str] = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            all_lines.extend(normalize_lines(text))
    return all_lines

def parse_report(lines: Iterable[str]) -> Tuple[List[FlightLeg], List[Dict[str, str]]]:
    """
    Returns:
      flights: list of flight legs
      month_totals: list of dicts with month totals from month header lines
    """
    current_month: Optional[str] = None
    current_date_iso: Optional[str] = None

    flights: List[FlightLeg] = []
    month_totals: List[Dict[str, str]] = []

    for ln in lines:
        # Month header
        m = MONTH_HDR_RE.match(ln)
        if m:
            current_month = f"{m.group('mon')} {m.group('year')}"
            month_totals.append({
                "month": current_month,
                "block_hrs": m.group("block"),
                "deadhead_hrs": m.group("deadhead"),
                "freighter_hrs": m.group("freighter"),
            })
            # Do not reset date here; the next DATE_HDR will set it.
            continue

        # Date header
        d = DATE_HDR_RE.match(ln)
        if d:
            dt = datetime.strptime(d.group("date"), "%d-%b-%Y")
            current_date_iso = dt.strftime("%Y-%m-%d")
            continue

        # Flight leg line
        f = FLIGHT_RE.match(ln)
        if f:
            if current_month is None or current_date_iso is None:
                # If the PDF text extraction ever reorders lines, we fail gracefully by skipping
                # rather than crashing.
                continue
            flights.append(FlightLeg(
                date=current_date_iso,
                month=current_month,
                flight_no=f.group("flt"),
                origin=f.group("orig"),
                destination=f.group("dest"),
                ac_reg=f.group("acreg"),
                block_hrs=f.group("block"),
                takeoff_landing=f.group("tol"),
                deadhead_hrs=f.group("deadhead"),
                freighter_hrs=f.group("freighter"),
            ))
            continue

        # Anything else: ignore quietly (some PDFs have spacing/artifact lines)
        # print(f"UNMATCHED: {ln}")

    return flights, month_totals

def write_json(path: Path, obj) -> None:
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False), encoding="utf-8")

def write_csv(path: Path, rows: List[dict], fieldnames: List[str]) -> None:
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow(r)

def extract_flights(pdf_path: str) -> List[Dict[str, str]]:
    """
    Extract flights from Flying Statistics Report PDF.
    Returns list of dicts compatible with the standard parser format:
    [{"date": "YYYY-MM-DD", "origin": "ABC", "destination": "XYZ", "block_hours": "HH:MM", "flight": "QR123"}]
    """
    try:
        lines = parse_pdf_lines(Path(pdf_path))
        flights, _ = parse_report(lines)
        
        # Convert to standard format
        result = []
        for flight in flights:
            result.append({
                "date": flight.date,
                "origin": flight.origin,
                "destination": flight.destination,
                "block_hours": flight.block_hrs,
                "flight": flight.flight_no
            })
        return result
    except Exception as e:
        print(f"Flying stats parser error: {e}")
        return []

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf", type=Path, help="Path to Flying Statistics PDF")
    ap.add_argument("--outdir", type=Path, default=Path("."), help="Output directory")
    args = ap.parse_args()

    lines = parse_pdf_lines(args.pdf)
    flights, month_totals = parse_report(lines)

    outdir: Path = args.outdir
    outdir.mkdir(parents=True, exist_ok=True)

    flights_dicts = [asdict(x) for x in flights]

    write_json(outdir / "flightstats.json", flights_dicts)
    write_csv(
        outdir / "flightstats.csv",
        flights_dicts,
        fieldnames=list(FlightLeg.__dataclass_fields__.keys())
    )

    write_csv(
        outdir / "months.csv",
        month_totals,
        fieldnames=["month", "block_hrs", "deadhead_hrs", "freighter_hrs"]
    )

    print(f"Parsed {len(flights)} flight legs")
    print(f"Wrote: {outdir/'flightstats.json'}")
    print(f"Wrote: {outdir/'flightstats.csv'}")
    print(f"Wrote: {outdir/'months.csv'}")

if __name__ == "__main__":
    main()
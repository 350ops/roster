"""
Flask server for parsing Qatar Airways roster PDFs.

Implements a three-tier fallback parsing system:
1. Standard Report Parser (pdf_flights_to_csv.py) - linear text format with times
2. Roster Grid Parser (roster.py) - calendar grid layout
3. Flying Statistics Parser (parse_flying_stats.py) - multi-month stats report

Each parser is tried in sequence until flights are extracted.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import pdf_flights_to_csv
import roster
import parse_flying_stats
import uuid

# Get path relative to the script location
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(SCRIPT_DIR, "toconvert")

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
CORS(app)


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file:
        # Generate unique filename to prevent collisions
        original_ext = os.path.splitext(file.filename)[1]
        if not original_ext:
            original_ext = ".pdf"
        unique_filename = f"{uuid.uuid4()}{original_ext}"
        path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        try:
            file.save(path)
            print(f"File saved to: {path}")
            
            # Try First Extractor (Standard Report)
            flights = pdf_flights_to_csv.extract_flights(path)
            
            # If empty, try Second Extractor (Roster Grid)
            if not flights:
                print("Standard parser found no flights, trying Roster Grid parser...")
                flights = roster.extract_flights_from_grid(path)
            
            # If still empty, try Third Extractor (Flying Statistics Report)
            if not flights:
                print("Roster Grid parser found no flights, trying Flying Statistics parser...")
                flights = parse_flying_stats.extract_flights(path)
            
            return jsonify({
                'count': len(flights),
                'flights': flights
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
             # Clean up to prevent disk fill-up on Railway
            if os.path.exists(path):
                try:
                    os.remove(path)
                    print(f"Cleaned up file: {path}")
                except Exception as cleanup_error:
                    print(f"Error cleaning up file {path}: {cleanup_error}")
if __name__ == '__main__':
    # Get port from environment variable (for production) or use 5002 for local dev
    port = int(os.environ.get('PORT', 5002))
    # Run on 0.0.0.0 to make it accessible from external connections
    app.run(host='0.0.0.0', port=port, debug=False)

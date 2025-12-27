
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pdf_flights_to_csv
import pdfplumber
import tempfile

import roster

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
        # Save to a temporary file
        fd, path = tempfile.mkstemp(suffix=".pdf")
        try:
            with os.fdopen(fd, 'wb') as tmp:
                file.save(tmp)
            
            # Try First Extractor (Standard Report)
            flights = pdf_flights_to_csv.extract_flights(path)
            
            # If empty, try Second Extractor (Roster Grid)
            if not flights:
                print("Standard parser found no flights, trying Roster Grid parser...")
                flights = roster.extract_flights_from_grid(path)
            
            return jsonify({
                'count': len(flights),
                'flights': flights
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        finally:
            # Clean up
            if os.path.exists(path):
                os.remove(path)

if __name__ == '__main__':
    # Get port from environment variable (for production) or use 5002 for local dev
    port = int(os.environ.get('PORT', 5002))
    # Run on 0.0.0.0 to make it accessible from external connections
    app.run(host='0.0.0.0', port=port, debug=False)

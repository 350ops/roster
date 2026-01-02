# Railway Deployment Troubleshooting

## Common Issues and Fixes

### 1. Check Railway Logs
In your Railway dashboard:
- Go to your service → "Deployments" tab
- Click on the failed deployment
- Check the "Build Logs" and "Deploy Logs"
- Look for error messages

### 2. Common Error: "Module not found"
If you see errors like:
- `ModuleNotFoundError: No module named 'pdf_flights_to_csv'`
- `ModuleNotFoundError: No module named 'roster'`

**Fix:** Make sure all Python files are in the root directory or adjust imports.

### 3. Common Error: "Port already in use" or "Cannot bind to port"
**Fix:** Railway automatically sets the `PORT` environment variable. The server should use `$PORT`.

### 4. Common Error: "gunicorn: command not found"
**Fix:** Make sure `gunicorn==21.2.0` is in `requirements.txt` (it is ✅)

### 5. Check Railway Service Settings
In Railway dashboard:
1. Go to your service
2. Click "Settings"
3. Check:
   - **Root Directory**: Should be `/` (root) or leave empty
   - **Start Command**: Should be `gunicorn server:app --bind 0.0.0.0:$PORT`
   - **Build Command**: Leave empty (Railway auto-detects)

### 6. Python Version
Railway should auto-detect Python 3.11 from `runtime.txt`, but you can also:
- Set environment variable: `PYTHON_VERSION=3.11`

### 7. Missing Dependencies
If specific packages fail to install, check:
- All dependencies are in `requirements.txt`
- No conflicting versions
- System dependencies (like for pdfplumber) are available

## Quick Fixes to Try

1. **Redeploy**: In Railway, click "Redeploy" on the latest deployment
2. **Check Build Logs**: Look for specific error messages
3. **Verify Files**: Make sure `server.py`, `pdf_flights_to_csv.py`, and `roster.py` are all committed to git
4. **Test Locally**: Run `gunicorn server:app --bind 0.0.0.0:5002` locally to test

## Railway Service Configuration

Make sure in Railway:
- **Service Type**: Web Service (not Background Worker)
- **Health Check Path**: Leave empty or set to `/upload` (if you add a health endpoint)
- **Port**: Railway sets this automatically via `$PORT` env var

## PDF Parsing Logic

The backend uses a **three-tier fallback system** to parse different types of roster PDFs:

### Parser 1: Standard Report Parser (`pdf_flights_to_csv.py`)
- **Format**: Linear text with date headers followed by flight lines
- **Example**:
  ```
  29-Jul-2025
  QR199/DOH-BUD A7-AHW 05:11
  ```
- **Fields extracted**: date, origin, destination, block_hours, flight
- **Use case**: Standard roster reports with times

### Parser 2: Roster Grid Parser (`roster.py`)
- **Format**: Calendar-style grid layout
- **Fields extracted**: date, origin, destination, flight
- **Use case**: Monthly roster grid PDFs
- **Note**: May not have block hours

### Parser 3: Flying Statistics Report Parser (`parse_flying_stats.py`)
- **Format**: Multi-month flying statistics report
- **Example**:
  ```
  AUG 2025 99:04 00:00 00:00
  12-Aug-2025 07:14 00:00 00:00
  QR522/DOH-GOX A7-AHH 03:52 0/0 00:00 00:00
  ```
- **Fields extracted**: date, origin, destination, block_hours, flight
- **Additional data**: aircraft registration, deadhead hours, freighter hours
- **Use case**: Flying hour statistics reports spanning multiple months without specific departure/arrival times

### Fallback Logic
The server tries parsers in order:
1. Standard Report Parser
2. If no flights → Roster Grid Parser  
3. If still no flights → Flying Statistics Parser

This ensures maximum compatibility with different PDF formats from Qatar Airways.


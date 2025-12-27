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


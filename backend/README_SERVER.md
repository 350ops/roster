# Flight Scanner API Server

This is the Flask server that processes PDF flight reports. It needs to be deployed to a cloud platform for production use.

## 🚀 Quick Deploy to Railway (Recommended - 5 minutes)

1. **Sign up:** Go to [railway.app](https://railway.app) and sign up with GitHub

2. **Create Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway auto-detects Python and deploys!

3. **Get URL:**
   - Railway gives you a URL like: `https://your-app.up.railway.app`
   - Copy this URL

4. **Update App:**
   - In `flight-scanner-app/app.json`, set:
   ```json
   "extra": {
     "apiUrl": "https://your-app.up.railway.app"
   }
   ```

5. **Done!** Your server is now live and accessible from anywhere.

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
python server.py

# Server runs on http://localhost:5002
```

## Testing the Server

```bash
# Test the upload endpoint
curl -X POST http://localhost:5002/upload \
  -F "file=@your-flight-report.pdf"
```

## Production Notes

- The server automatically uses the `PORT` environment variable in production
- CORS is enabled to allow requests from your mobile app
- All dependencies are listed in `requirements.txt`

## Troubleshooting

**Server won't start?**
- Check Python version (3.11+ recommended)
- Install dependencies: `pip install -r requirements.txt`

**Can't connect from app?**
- Verify CORS is enabled (already in code)
- Check server logs for errors
- Ensure server URL is correct in `app.json`


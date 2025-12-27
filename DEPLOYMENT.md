# Deployment Guide

## 🚀 Quick Start: Deploy to Railway (Easiest)

### Step 1: Deploy Flask Server to Railway

1. **Sign up at [railway.app](https://railway.app)** (free tier available)

2. **Create a new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository
   - Railway will auto-detect Python and use `requirements.txt`

3. **Configure the service:**
   - Railway will automatically detect `server.py`
   - The `PORT` environment variable is set automatically
   - No additional configuration needed!

4. **Get your server URL:**
   - Railway provides a URL like: `https://your-app-name.up.railway.app`
   - Copy this URL

### Step 2: Update Your App Configuration

Update `app.json` with your deployed server URL:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-app-name.up.railway.app"
    }
  }
}
```

### Step 3: Build and Test

```bash
# Test with a preview build
eas build --profile preview --platform ios
# or
eas build --profile preview --platform android
```

---

## Alternative Deployment Options

### Option 2: Render (Free Tier)

1. Go to [render.com](https://render.com)
2. Create new **Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python server.py`
   - **Environment:** Python 3
5. Deploy and get your URL: `https://your-app.onrender.com`

### Option 3: Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# In your flights directory
fly launch
fly deploy
```

### Option 4: Heroku

```bash
# Install Heroku CLI
heroku login
heroku create your-app-name
git push heroku main
```

---

## 🔧 Configuration Methods

### Method 1: app.json (Recommended)

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-deployed-server.com"
    }
  }
}
```

### Method 2: EAS Secrets (For Sensitive URLs)

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://your-server.com
```

Then rebuild your app.

### Method 3: Environment Variable

Set `EXPO_PUBLIC_API_URL` in your build environment.

---

## 📝 Important Notes

1. **Development vs Production:**
   - Development: Uses `localhost:5002` (your local Flask server)
   - Production: Uses the deployed server URL from `app.json`

2. **The Expo API route (`app/api/upload+api.ts`) doesn't work in production** because:
   - `pdf-parse` requires DOM APIs not available in Edge runtime
   - It only works with the Expo dev server

3. **Always test production builds** before submitting to app stores:
   ```bash
   eas build --profile preview
   ```

4. **Free tier limits:**
   - Railway: 500 hours/month free
   - Render: Free tier with sleep after inactivity
   - Fly.io: Generous free tier

---

## 🐛 Troubleshooting

### Server not responding?
- Check server logs in Railway/Render dashboard
- Verify CORS is enabled (already in `server.py`)
- Test the endpoint: `curl https://your-server.com/upload`

### App can't connect?
- Verify `apiUrl` is set correctly in `app.json`
- Rebuild the app after changing config
- Check network permissions in app

### PDF parsing errors?
- Ensure all dependencies are in `requirements.txt`
- Check server logs for specific error messages



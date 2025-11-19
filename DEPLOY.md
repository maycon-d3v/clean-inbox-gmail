# Gmail Cleanup App - Deployment Guide (Render.com)

## Prerequisites
- GitHub account
- Render.com account (free tier available)
- Google Cloud Console access (for OAuth credentials)

## Part 1: Deploy Backend (.NET API) on Render.com

### Step 1: Prepare Repository
1. Push your code to GitHub if not already there
2. Ensure the `Dockerfile` is in `backend/GmailCleanup.API/` directory

### Step 2: Create Web Service on Render
1. Go to https://render.com/
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `gmail-cleanup-api` (or your choice)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your branch)
   - **Root Directory**: `backend/GmailCleanup.API`
   - **Environment**: `Docker`
   - **Plan**: Free (or paid if needed)

### Step 3: Configure Environment Variables
In Render dashboard, add these environment variables:

```
Google__ClientId=YOUR_GOOGLE_CLIENT_ID
Google__ClientSecret=YOUR_GOOGLE_CLIENT_SECRET
Google__RedirectUri=https://YOUR-BACKEND-URL.onrender.com/api/auth/callback
AllowedOrigins__0=https://YOUR-FRONTEND-URL.onrender.com
ASPNETCORE_ENVIRONMENT=Production
```

**Important**: Replace placeholders with actual values!

### Step 4: Update Google OAuth Credentials
1. Go to https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID
3. Add to "Authorized redirect URIs":
   ```
   https://YOUR-BACKEND-URL.onrender.com/api/auth/callback
   ```
4. Add to "Authorized JavaScript origins":
   ```
   https://YOUR-FRONTEND-URL.onrender.com
   ```

### Step 5: Deploy Backend
1. Click "Create Web Service"
2. Wait for build to complete (5-10 minutes)
3. Copy the backend URL (e.g., `https://gmail-cleanup-api.onrender.com`)

---

## Part 2: Deploy Frontend (React) on Render.com

### Option A: Static Site on Render

#### Step 1: Create Static Site
1. In Render dashboard, click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `gmail-cleanup-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend/gmail-cleanup-app`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

#### Step 2: Add Environment Variable
In Render dashboard, add:
```
VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com/api
```

#### Step 3: Deploy
1. Click "Create Static Site"
2. Wait for build (3-5 minutes)
3. Your app will be live!

---

### Option B: Deploy Frontend on Netlify (Alternative)

#### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

#### Step 2: Build Frontend
```bash
cd frontend/gmail-cleanup-app
npm install
npm run build
```

#### Step 3: Deploy to Netlify
```bash
netlify deploy --prod
```

Follow the prompts:
- Choose "Create & configure a new site"
- Publish directory: `dist`

#### Step 4: Add Environment Variables
In Netlify dashboard:
1. Go to Site settings → Environment variables
2. Add:
   ```
   VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com/api
   ```

#### Step 5: Redeploy
Click "Trigger deploy" in Netlify dashboard to rebuild with new env vars.

---

## Part 3: Update Configuration Files

### Update Backend appsettings.Production.json
Edit `backend/GmailCleanup.API/appsettings.Production.json`:

```json
{
  "AllowedOrigins": [
    "https://your-actual-frontend-url.onrender.com"
  ],
  "Google": {
    "ClientId": "YOUR_ACTUAL_CLIENT_ID",
    "ClientSecret": "YOUR_ACTUAL_CLIENT_SECRET",
    "RedirectUri": "https://your-actual-backend-url.onrender.com/api/auth/callback"
  }
}
```

### Update Frontend .env.production
Edit `frontend/gmail-cleanup-app/.env.production`:

```
VITE_API_URL=https://your-actual-backend-url.onrender.com/api
```

---

## Part 4: Testing

1. Open your frontend URL in browser
2. Click "Login with Google"
3. Authorize the application
4. Verify you can see Gmail statistics
5. Test preview and cleanup functionality

---

## Troubleshooting

### CORS Errors
- Verify `AllowedOrigins` in backend matches frontend URL exactly
- Check Render environment variables are set correctly
- Redeploy backend after changing CORS settings

### OAuth Redirect Mismatch
- Ensure Google Cloud Console redirect URIs match backend URL exactly
- Include `/api/auth/callback` path
- Use `https://` protocol

### Backend Not Starting
- Check Render logs for errors
- Verify `PORT` environment variable is not set (Render sets it automatically)
- Ensure Dockerfile is in correct directory

### Frontend Not Loading
- Check browser console for API URL errors
- Verify `VITE_API_URL` environment variable is set
- Clear browser cache and rebuild

---

## Free Tier Limitations (Render.com)

- Backend may sleep after 15 minutes of inactivity (first request takes ~30s to wake)
- 750 hours/month free compute time
- Automatic HTTPS certificates
- Custom domains supported (on paid plans)

---

## Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Google OAuth credentials updated
- [ ] CORS configured correctly
- [ ] Environment variables set in both services
- [ ] Test login flow works
- [ ] Test Gmail statistics retrieval
- [ ] Test preview functionality
- [ ] Test cleanup/delete functionality
- [ ] Monitor Render logs for errors

---

## Support

If you encounter issues:
1. Check Render logs (dashboard → your service → Logs)
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Ensure Google OAuth credentials are configured properly

# Deployment Guide - Vercel Setup

## Critical: Environment Variables Required

You **MUST** set the following environment variable in your Vercel project for the app to work:

### `VITE_API_URL`
The complete URL to your backend API server (must be publicly accessible).

**Example:**
```
VITE_API_URL=https://your-backend-api.vercel.app
```

or if your backend is on a custom domain:
```
VITE_API_URL=https://api.yourdomain.com
```

## Step-by-Step Vercel Setup

### 1. Set Environment Variables on Vercel

1. Go to [vercel.com](https://vercel.com) and log in
2. Select your project → **Settings**
3. Click **Environment Variables** (left sidebar)
4. Add a new environment variable:
   - **Name:** `VITE_API_URL`
   - **Value:** Your backend API URL (e.g., `https://your-backend.vercel.app`)
   - **Environments:** Select all (Production, Preview, Development)
5. Click **Save**
6. Go to **Deployments** and click **Redeploy** on the latest deployment
   - Click "Redeploy" button
   - Make sure "Use existing Environment Variables" is checked

### 2. Verify Build Configuration

Vercel should automatically detect:
- ✅ Node.js project
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `dist`

### 3. Monitor Deployment

1. Go to **Deployments** tab
2. Check the latest deployment status
3. If it fails, click **Details** → **Logs** to see build errors
4. Common issues:
   - Missing `VITE_API_URL` environment variable
   - Backend URL is incorrect or not accessible
   - TypeScript compilation errors (shouldn't happen - we fixed this)

## Local Development

For local development, a `.env.local` file has been created:
```
VITE_API_URL=http://localhost:5000
```

Update this to match your local backend server URL if it's different.

### Run locally:
```bash
npm install  # Install dependencies
npm run dev  # Start development server
```

## How It Works

1. **vite-env.d.ts** - Provides TypeScript type definitions for `import.meta.env`
2. **api/config.ts** - Centralized API configuration with fallback handling
3. **All components** - Use `makeApiUrl()` to construct API URLs
4. **Vercel environment variable** - `VITE_API_URL` is injected during build

## Troubleshooting

### Still getting 405 errors?
1. ✅ Verify `VITE_API_URL` is set in Vercel's Environment Variables
2. ✅ Verify your backend API is running and accessible
3. ✅ Test the backend URL directly in a browser (you should see API response or 401, not 405)
4. ✅ Check CORS is enabled on your backend
5. ✅ After setting env vars, **REDEPLOY** the app - new env vars don't apply to old deployments

### Build is failing?
1. Check **Deployments** → **Details** → **Logs** for specific errors
2. If it says TypeScript errors, we've fixed them - ensure latest code is pushed
3. Run `npm run build` locally to test before pushing

### App loads but API calls fail?
1. Open browser Developer Tools (F12)
2. Check **Network** tab for failed requests
3. Check **Console** tab for error messages
4. Verify the URL being called matches your backend

## Manual Deployment (Alternative)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy from project root
vercel

# When prompted:
# - Link to existing project? Yes
# - Set environment variables when prompted
# - Choose production or preview

# To deploy to production after setting env vars
vercel --prod
```

## Production Checklist

- [ ] Backend API is deployed and accessible
- [ ] `VITE_API_URL` environment variable set in Vercel
- [ ] CORS is properly configured on backend
- [ ] Redeployed after setting environment variables
- [ ] Tested login/register endpoints
- [ ] Checked browser console for errors
- [ ] API calls work in Network tab

## Need Help?

If deployment still fails:
1. Run `npm run build` locally to ensure local build works
2. Check Vercel deployment logs for specific errors
3. Verify backend API URL is correct and publicly accessible
4. Make sure all environment variables are set before redeploying


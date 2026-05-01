# Deployment Guide - Vercel Setup

## Environment Variables Required

You need to set the following environment variable in your Vercel project:

### `VITE_API_URL`
The complete URL to your backend API server.

**Example:**
```
VITE_API_URL=https://your-backend-api.vercel.app
```

or if your backend is on a custom domain:
```
VITE_API_URL=https://api.yourdomain.com
```

## How to Set Environment Variables on Vercel

1. Go to your Vercel project dashboard
2. Click on **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name:** `VITE_API_URL`
   - **Value:** Your backend API URL (see examples above)
   - **Environments:** Select the appropriate environment(s) (Production, Preview, Development)
4. Click **Save**
5. Redeploy your project for the changes to take effect

## Local Development

For local development, a `.env.local` file has been created with a default value:
```
VITE_API_URL=http://localhost:5000
```

Update this to match your local backend server URL if it's different.

## How It Works

- The frontend now uses a centralized API configuration (`api/config.ts`)
- All API calls use the `makeApiUrl()` function to construct URLs
- The `VITE_API_URL` environment variable determines where API requests are sent
- If the environment variable is not set, it falls back to the current domain

## Troubleshooting

### Still getting 405 errors?
1. Make sure `VITE_API_URL` is properly set in Vercel's Environment Variables
2. Verify your backend API is running and accessible at the URL specified
3. Check that CORS is properly configured on your backend
4. Redeploy your frontend after updating environment variables

### Build is still failing?
1. Check the build logs in Vercel
2. Make sure all dependencies are installed (run `npm install` locally)
3. Verify `tsconfig.json` and `vite.config.ts` are valid

## Example Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy (from project root)
vercel

# With environment variables
vercel env add VITE_API_URL
# Then enter your backend URL when prompted

# Redeploy
vercel --prod
```

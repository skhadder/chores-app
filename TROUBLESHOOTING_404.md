# Fixing 404 NOT_FOUND Error on Vercel

## Problem Analysis

The 404 NOT_FOUND error occurs because:
1. **Firebase was initializing with dummy values** when environment variables were missing
2. This allowed the build to complete, but at runtime Firebase tried to connect with invalid credentials
3. Firebase Firestore returns 404 when it can't find the project or when credentials are invalid

## Changes Made

### 1. Fixed Firebase Initialization (`lib/firebase.ts`)
- **Before**: Used dummy/fallback values when env vars were missing (allowed build to pass but caused 404 at runtime)
- **After**: Throws clear error at runtime if environment variables are missing
- Added better validation and error messages
- No more silent failures with dummy credentials

### 2. Enhanced Test Page (`app/test/page.tsx`)
- Shows detailed status of all environment variables
- Tests actual Firestore connection
- Provides troubleshooting tips based on what's missing
- Visit `/test` on your deployed site to diagnose issues

### 3. Updated Deployment Guide (`DEPLOYMENT.md`)
- Added comprehensive troubleshooting section for 404 errors
- Step-by-step verification checklist

## What You Need to Check

### Step 1: Verify Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **Production** project (not demo)
3. Go to **Settings** → **Environment Variables**
4. Verify ALL 8 variables are present:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` ⚠️ **Most important**
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_HOUSE_ID`
   - `NEXT_PUBLIC_ENVIRONMENT`

### Step 2: Check Environment Scope

**Critical**: For Production deployments, variables MUST be set for **"Production"** environment:

- ✅ **Correct**: Variable set for "Production" → Production deployment works
- ❌ **Wrong**: Variable set only for "Preview" → Production deployment fails with 404

To fix:
1. For each variable, check the "Environment" column
2. If it says "Preview" or "Development" only, click the variable
3. Make sure **"Production"** is checked
4. Save and redeploy

### Step 3: Verify Firebase Project ID

The `NEXT_PUBLIC_FIREBASE_PROJECT_ID` must match your actual Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Check the **Project ID** (not the project name)
5. Compare with the value in Vercel - they must match exactly

### Step 4: Redeploy

After making any changes:
1. Go to **Deployments** tab in Vercel
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

### Step 5: Test the Fix

1. Visit your deployed site: `https://your-project.vercel.app/test`
2. The test page will show:
   - Which environment variables are set/missing
   - Whether Firebase connection works
   - Specific error messages if something is wrong

## Expected Behavior After Fix

- ✅ Build completes successfully
- ✅ Site loads without 404 errors
- ✅ `/test` page shows all variables as "✅ Set"
- ✅ Firebase connection test passes
- ✅ `/director` page can access Firestore data

## If Still Getting 404

1. **Check the test page** (`/test`) - it will show exactly what's wrong
2. **Check browser console** - look for Firebase initialization errors
3. **Check Vercel function logs** - go to Deployments → Click deployment → View Function Logs
4. **Verify Firebase project exists** - make sure the project ID in Vercel matches Firebase Console
5. **Check Firestore is enabled** - in Firebase Console, make sure Firestore Database is created

## Common Mistakes

1. ❌ Setting variables for "Preview" but deploying to "Production"
2. ❌ Typos in variable names (missing `NEXT_PUBLIC_` prefix)
3. ❌ Wrong Firebase project ID
4. ❌ Not redeploying after adding variables
5. ❌ Extra spaces or quotes in variable values

## Need More Help?

If you're still seeing 404 errors after following these steps:
1. Visit `/test` on your deployed site and screenshot the results
2. Check Vercel deployment logs for any errors
3. Verify your Firebase project settings match what's in Vercel

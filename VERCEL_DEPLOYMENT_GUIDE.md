# Step-by-Step Vercel Deployment Guide

This guide will walk you through deploying your chores-app to Vercel with `HOUSE_ID = "ahouse_alpha_phi_test"`.

## Prerequisites

Before you begin, make sure you have:
- ✅ A GitHub account
- ✅ Your chores-app code pushed to a GitHub repository
- ✅ A Vercel account (sign up at [vercel.com](https://vercel.com) if needed)
- ✅ Your Firebase project credentials ready

---

## Step 1: Prepare Your GitHub Repository

1. **Open your terminal** in the chores-app directory
2. **Check if you have a Git repository initialized:**
   ```bash
   git status
   ```
   
3. **If not initialized, initialize Git and push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
   
4. **Create a new repository on GitHub:**
   - Go to [github.com](https://github.com)
   - Click the "+" icon → "New repository"
   - Name it `chores-app` (or your preferred name)
   - **Don't** initialize with README, .gitignore, or license (since you already have code)
   - Click "Create repository"

5. **Connect your local repository to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/chores-app.git
   git branch -M main
   git push -u origin main
   ```
   (Replace `YOUR_USERNAME` with your actual GitHub username)

---

## Step 2: Get Your Firebase Credentials

1. **Go to Firebase Console:**
   - Visit [console.firebase.google.com](https://console.firebase.google.com)
   - Select your Firebase project

2. **Get your Firebase config:**
   - Click the gear icon ⚙️ → "Project settings"
   - Scroll down to "Your apps" section
   - If you don't have a web app, click "Add app" → Web icon (</>) → Register app
   - Copy the following values from the config object:
     - `apiKey`
     - `authDomain`
     - `projectId`
     - `storageBucket`
     - `messagingSenderId`
     - `appId`

3. **Save these values** - you'll need them in Step 4

---

## Step 3: Create Vercel Project

1. **Sign in to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account (recommended for easy integration)

2. **Create a new project:**
   - Click **"Add New..."** button (top right)
   - Select **"Project"**

3. **Import your repository:**
   - You'll see a list of your GitHub repositories
   - Find and click on **"chores-app"** (or your repository name)
   - If you don't see it, click "Adjust GitHub App Permissions" and grant access

4. **Configure project settings:**
   - **Project Name:** `chores-app` (or your preferred name)
   - **Framework Preset:** Should auto-detect as "Next.js" ✅
   - **Root Directory:** Leave as `./` (default)
   - **Build Command:** Should be `next build` (auto-detected)
   - **Output Directory:** Leave empty (Next.js handles this)
   - **Install Command:** Should be `npm install` (auto-detected)

5. **Click "Deploy"** (we'll add environment variables next)

   ⚠️ **Note:** The first deployment will likely fail because Firebase environment variables aren't set yet. That's okay! We'll fix this in the next step.

---

## Step 4: Configure Environment Variables

> 💡 **Tip**: If you have a `.env.local` file with your Firebase credentials, you can use the Vercel CLI to automatically sync them instead of manually entering each variable. See [AUTOMATE_ENV_VARS.md](./AUTOMATE_ENV_VARS.md) for details. Otherwise, continue with the manual steps below.

### Option A: Manual Setup (Dashboard)

1. **Go to your project settings:**
   - After the deployment starts (or fails), click on your project name
   - Go to **"Settings"** tab (top navigation)
   - Click **"Environment Variables"** in the left sidebar

2. **Add Firebase environment variables:**
   
   For each variable below, click **"Add"** and enter:
   
   | Variable Name | Value | Environment |
   |--------------|-------|-------------|
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase apiKey | Production, Preview, Development |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Your Firebase authDomain | Production, Preview, Development |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your Firebase projectId | Production, Preview, Development |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Your Firebase storageBucket | Production, Preview, Development |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your Firebase messagingSenderId | Production, Preview, Development |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | Your Firebase appId | Production, Preview, Development |

   **Important:** 
   - Check all three environment checkboxes: **Production**, **Preview**, and **Development**
   - This ensures the variables work for all deployment types

3. **Add HOUSE_ID environment variable:**
   
   Click **"Add"** and enter:
   - **Variable Name:** `NEXT_PUBLIC_HOUSE_ID`
   - **Value:** `ahouse_alpha_phi_test`
   - **Environment:** Check **Production**, **Preview**, and **Development**

4. **Add ENVIRONMENT variable (optional but recommended):**
   
   Click **"Add"** and enter:
   - **Variable Name:** `NEXT_PUBLIC_ENVIRONMENT`
   - **Value:** `production` (or `demo` if this is a demo/test deployment)
   - **Environment:** Check **Production**, **Preview**, and **Development**

5. **Verify all variables are added:**
   - You should see 8 environment variables total
   - All should have checkmarks for the environments you selected

### Option B: Automatic Setup (Vercel CLI) - Recommended

If you have a `.env.local` file, this is much faster:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login and link your project:**
   ```bash
   vercel login
   vercel link
   ```

3. **Push environment variables:**
   ```bash
   vercel env push .env.local
   ```
   
   Select **Production**, **Preview**, and **Development** when prompted.

4. **Verify variables:**
   ```bash
   vercel env ls
   ```

See [AUTOMATE_ENV_VARS.md](./AUTOMATE_ENV_VARS.md) for detailed CLI instructions.

---

## Step 5: Redeploy Your Application

1. **Trigger a new deployment:**
   - Go to the **"Deployments"** tab
   - Find your latest deployment
   - Click the **"..."** (three dots) menu → **"Redeploy"**
   - Or simply push a new commit to your GitHub repository (Vercel will auto-deploy)

2. **Watch the deployment:**
   - You'll see the build logs in real-time
   - Wait for the build to complete (usually 1-3 minutes)

3. **Check for success:**
   - Look for a green checkmark ✅ and "Ready" status
   - If there are errors, check the build logs for details

---

## Step 6: Verify Your Deployment

1. **Visit your deployed site:**
   - Click on the deployment
   - Click **"Visit"** button (or use the URL shown)
   - Your app should load at a URL like: `https://chores-app.vercel.app`

2. **Test the HOUSE_ID:**
   - The app should be using `house_alpha_phi_test` as the HOUSE_ID
   - Navigate through your app to verify it's connecting to the correct Firebase data

3. **Check environment variables (if you have a test page):**
   - If your app has a `/test` page, visit it to verify all environment variables are loaded correctly

---

## Step 7: Set Up Automatic Deployments (Optional)

Vercel automatically deploys when you push to your main branch, but you can configure this:

1. **Go to Settings → Git**
2. **Configure deployment settings:**
   - **Production Branch:** `main` (or `master`)
   - **Preview Deployments:** Enabled (creates preview URLs for pull requests)
   - **Automatic deployments:** Enabled

---

## Troubleshooting

### Problem: Build fails with "Missing Firebase environment variables"
**Solution:** 
- Go to Settings → Environment Variables
- Verify all 6 Firebase variables are added
- Make sure they're enabled for the correct environment (Production/Preview/Development)
- Redeploy after adding variables

### Problem: App shows 404 or Firebase errors
**Solution:**
- Check that `NEXT_PUBLIC_HOUSE_ID` is set to `ahouse_alpha_phi_test`
- Verify all Firebase credentials are correct (no typos, no extra spaces)
- Make sure variables start with `NEXT_PUBLIC_` (required for client-side access)
- Redeploy after making changes

### Problem: Wrong HOUSE_ID is being used
**Solution:**
- Verify `NEXT_PUBLIC_HOUSE_ID=ahouse_alpha_phi_test` in Environment Variables
- Check that it's enabled for Production environment
- Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Redeploy the application

### Problem: Can't see my GitHub repository in Vercel
**Solution:**
- Go to Vercel Dashboard → Settings → Git
- Click "Adjust GitHub App Permissions"
- Grant access to your repositories
- Refresh the import page

---

## Quick Reference: Environment Variables Summary

Your Vercel project should have these environment variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=<your_api_key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your_auth_domain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your_project_id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your_storage_bucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your_sender_id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your_app_id>
NEXT_PUBLIC_HOUSE_ID=ahouse_alpha_phi_test
NEXT_PUBLIC_ENVIRONMENT=production
```

All variables should be enabled for: **Production**, **Preview**, and **Development** environments.

---

## Next Steps

- ✅ Your app is now live on Vercel!
- 🔄 Future pushes to your main branch will automatically deploy
- 🌐 You can set up a custom domain in Settings → Domains
- 📊 Monitor deployments and analytics in the Vercel dashboard

---

## Need Help?

- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Check your project's build logs for detailed error messages

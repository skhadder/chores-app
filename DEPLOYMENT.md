# Deployment Guide: Two Vercel Projects

This guide explains how to deploy two separate Vercel projects from the same repository, each using different Firebase data.

## Overview

- **Demo Project**: Uses `house_alpha_phi_test` data (for portfolio/testing)
- **Production Project**: Uses `house_alpha_phi` data (for house director)

Both projects use the same codebase but different environment variables.

## Environment Variables Setup

### Required Variables (Both Projects)

Copy these from your `.env.local` file:

```
NEXT_PUBLIC_FIREBASE_API_KEY=<your_firebase_api_key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-project.firebaseapp.com>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-project.appspot.com>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your_sender_id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your_app_id>
```

### Demo Project Variables

Add to **Demo Project** → Settings → Environment Variables:

```
NEXT_PUBLIC_HOUSE_ID=house_alpha_phi_test
NEXT_PUBLIC_ENVIRONMENT=demo
```

**Environment Selection**: Choose **"Preview"** for these variables.

### Production Project Variables

Add to **Production Project** → Settings → Environment Variables:

```
NEXT_PUBLIC_HOUSE_ID=house_alpha_phi
NEXT_PUBLIC_ENVIRONMENT=production
```

**Environment Selection**: Choose **"Production"** for these variables.

## Step-by-Step Deployment

### 1. Create Demo Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Project name: `chores-app-demo`
5. Framework: Next.js (auto-detected)
6. Click **"Deploy"** (we'll add env vars after)

### 2. Configure Demo Environment Variables

1. Go to Demo project → **Settings** → **Environment Variables**
2. Add all Firebase variables (select **"Preview"** environment)
3. Add `NEXT_PUBLIC_HOUSE_ID=house_alpha_phi_test` (Preview)
4. Add `NEXT_PUBLIC_ENVIRONMENT=demo` (Preview)
5. **Redeploy** the project

### 3. Create Production Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import the **same Git repository**
4. Project name: `chores-app-production`
5. Framework: Next.js
6. Click **"Deploy"**

### 4. Configure Production Environment Variables

1. Go to Production project → **Settings** → **Environment Variables**
2. Add all Firebase variables (select **"Production"** environment)
3. Add `NEXT_PUBLIC_HOUSE_ID=house_alpha_phi` (Production)
4. Add `NEXT_PUBLIC_ENVIRONMENT=production` (Production)
5. **Redeploy** the project

## Verification Checklist

- [ ] Demo project shows "🧪 Demo Environment" banner
- [ ] Production project does NOT show demo banner
- [ ] Demo project uses `house_alpha_phi_test` data
- [ ] Production project uses `house_alpha_phi` data
- [ ] Both projects can generate weeks independently
- [ ] Data in one project doesn't appear in the other

## Troubleshooting

**Problem**: Both projects show same data
- **Solution**: Verify `NEXT_PUBLIC_HOUSE_ID` values are different and set for correct environments

**Problem**: Demo banner not showing
- **Solution**: Ensure `NEXT_PUBLIC_ENVIRONMENT=demo` is set for Preview environment

**Problem**: Build fails
- **Solution**: Check all Firebase environment variables are set correctly

## Firebase Security Rules

Consider adding Firestore security rules to prevent accidental cross-contamination:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /houses/{houseId} {
      allow read, write: if true; // Adjust based on your security needs
    }
  }
}
```

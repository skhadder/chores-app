# Alpha Phi Chore Management App

A Next.js application for managing weekly chore assignments for Alpha Phi San Jose Beta Psi Chapter.

## Features

- **Director Page**: Generate and view weekly chore assignments with PDF/CSV export
- **Admin Page**: Seed and manage chores, rooms, and members
- **Fair Assignment Algorithm**: Ensures equitable distribution of chores across all members
- **Data Separation**: Demo and production environments use separate Firebase data

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore enabled
- Git repository

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd chores-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your Firebase configuration values.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Deployment: Two Vercel Projects Setup

This project is designed to deploy **two separate Vercel projects** from the same repository:

1. **Demo Deployment** - For portfolio/testing (uses `house_alpha_phi_test` data)
2. **Production Deployment** - For house director (uses `house_alpha_phi` data)

### Step 1: Create First Vercel Project (Demo)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Configure project:
   - **Project Name**: `chores-app-demo` (or your choice)
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

### Step 2: Add Environment Variables for Demo

In your **Demo project** → **Settings** → **Environment Variables**, add:

```
NEXT_PUBLIC_FIREBASE_API_KEY=<your_firebase_api_key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-project.firebaseapp.com>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-project.appspot.com>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your_sender_id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your_app_id>
NEXT_PUBLIC_HOUSE_ID=house_alpha_phi_test
NEXT_PUBLIC_ENVIRONMENT=demo
```

**Important**: Select **"Preview"** environment for all variables (or "All" if you want them in all environments).

### Step 3: Create Second Vercel Project (Production)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import the **same Git repository**
4. Configure project:
   - **Project Name**: `chores-app-production` (or your choice)
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 4: Add Environment Variables for Production

In your **Production project** → **Settings** → **Environment Variables**, add:

```
NEXT_PUBLIC_FIREBASE_API_KEY=<same_firebase_api_key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<same_auth_domain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<same_project_id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<same_storage_bucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<same_sender_id>
NEXT_PUBLIC_FIREBASE_APP_ID=<same_app_id>
NEXT_PUBLIC_HOUSE_ID=house_alpha_phi
NEXT_PUBLIC_ENVIRONMENT=production
```

**Important**: Select **"Production"** environment for all variables.

### Step 5: Deploy Both Projects

1. **Demo Project**: Deploy from any branch (or main branch)
2. **Production Project**: Deploy from main branch (or your production branch)

Both projects will:
- Use the same codebase
- Connect to the same Firebase project
- Use **different** `HOUSE_ID` values, keeping data completely separate

## Firebase Data Structure

Your Firebase Firestore will have two separate data trees:

```
houses/
  ├── house_alpha_phi_test/     ← Demo data (safe for testing)
  │   ├── chores/
  │   ├── rooms/
  │   ├── members/
  │   ├── assignments/
  │   └── weeks/
  │
  └── house_alpha_phi/          ← Production data (protected)
      ├── chores/
      ├── rooms/
      ├── members/
      ├── assignments/
      └── weeks/
```

## Environment Variables Reference

| Variable | Demo Value | Production Value | Description |
|----------|------------|------------------|-------------|
| `NEXT_PUBLIC_HOUSE_ID` | `house_alpha_phi_test` | `house_alpha_phi` | Determines which Firebase data to use |
| `NEXT_PUBLIC_ENVIRONMENT` | `demo` | `production` | Environment label (shown in UI) |
| `NEXT_PUBLIC_FIREBASE_*` | Same for both | Same for both | Firebase configuration (same project) |

## Project Structure

```
chores-app/
├── app/
│   ├── director/          # Director page (main UI)
│   ├── admin/             # Admin page (data seeding)
│   └── page.tsx           # Home page (redirects to /director)
├── lib/
│   ├── config.ts          # Environment-based configuration
│   └── firebase.ts        # Firebase initialization
└── components/
    └── alpha-phi-logo.tsx # Logo component
```

## Key Features

- ✅ **Data Separation**: Demo and production use completely separate Firebase data
- ✅ **Environment Indicators**: Demo site shows a banner indicating test environment
- ✅ **Same Codebase**: Both deployments use identical code, only env vars differ
- ✅ **Safe for Git**: No secrets in code, all config via environment variables

## Troubleshooting

### Build Fails with "NOT_FOUND"
- Ensure all `NEXT_PUBLIC_FIREBASE_*` variables are set in Vercel
- Check that `NEXT_PUBLIC_HOUSE_ID` is set correctly
- Verify Firebase project ID matches your actual project

### Demo and Production Show Same Data
- Double-check `NEXT_PUBLIC_HOUSE_ID` values are different
- Verify environment variables are set for the correct environment (Preview vs Production)
- Clear browser cache and hard refresh

### Environment Indicator Not Showing
- Ensure `NEXT_PUBLIC_ENVIRONMENT=demo` is set in demo project
- Check that the variable is set for "Preview" environment, not just "Production"

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)

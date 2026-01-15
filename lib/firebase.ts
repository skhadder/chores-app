import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// Helper to check if we're in a build environment
const isBuildTime = typeof window === "undefined" && process.env.NEXT_PHASE === "phase-production-build";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate required environment variables
const requiredVars = [
  { key: "apiKey", env: "NEXT_PUBLIC_FIREBASE_API_KEY" },
  { key: "authDomain", env: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" },
  { key: "projectId", env: "NEXT_PUBLIC_FIREBASE_PROJECT_ID" },
  { key: "storageBucket", env: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" },
  { key: "messagingSenderId", env: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" },
  { key: "appId", env: "NEXT_PUBLIC_FIREBASE_APP_ID" },
] as const;

const missingVars = requiredVars.filter(({ key }) => !firebaseConfig[key as keyof typeof firebaseConfig]);

// At build time, only warn (to allow static generation)
// At runtime, throw error to prevent invalid Firebase connections
if (missingVars.length > 0) {
  const missingEnvVars = missingVars.map(({ env }) => env).join(", ");
  const errorMessage = `Missing Firebase environment variables: ${missingEnvVars}\n` +
    `Please set these variables in Vercel project settings → Environment Variables → Production.`;
  
  if (isBuildTime) {
    // During build, only warn to allow static generation
    console.warn(`[BUILD] ${errorMessage}`);
  } else {
    // At runtime, throw error to prevent 404s from invalid Firebase config
    throw new Error(`[RUNTIME] ${errorMessage}\n` +
      `Current values: projectId=${firebaseConfig.projectId || "undefined"}, ` +
      `apiKey=${firebaseConfig.apiKey ? "***" + firebaseConfig.apiKey.slice(-4) : "undefined"}`);
  }
}

// Initialize Firebase app - ONLY with real values, never dummy values
let app: FirebaseApp;
try {
  if (getApps().length > 0) {
    app = getApp();
  } else {
    // Validate all required fields are present before initializing
    if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
      throw new Error(
        `Cannot initialize Firebase: Missing required config. ` +
        `projectId: ${firebaseConfig.projectId || "undefined"}, ` +
        `apiKey: ${firebaseConfig.apiKey ? "set" : "undefined"}`
      );
    }
    app = initializeApp(firebaseConfig);
  }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("Firebase initialization error:", errorMessage);
  console.error("Firebase config check:", {
    hasProjectId: !!firebaseConfig.projectId,
    hasApiKey: !!firebaseConfig.apiKey,
    hasAuthDomain: !!firebaseConfig.authDomain,
    hasStorageBucket: !!firebaseConfig.storageBucket,
    hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
    hasAppId: !!firebaseConfig.appId,
  });
  
  // Re-throw the error instead of using dummy values
  // This will cause the app to fail fast with a clear error message
  throw new Error(
    `Firebase initialization failed: ${errorMessage}\n` +
    `Please verify all NEXT_PUBLIC_FIREBASE_* environment variables are set correctly in Vercel.`
  );
}

export const db: Firestore = getFirestore(app);
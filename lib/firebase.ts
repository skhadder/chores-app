import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate required environment variables (only warn, don't throw during build)
const requiredVars = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"] as const;
const missingVars = requiredVars.filter((key) => !firebaseConfig[key]);

if (missingVars.length > 0) {
  const errorMessage = `Missing Firebase environment variables: ${missingVars.join(", ")}\n` +
    `Please set NEXT_PUBLIC_FIREBASE_* variables in Vercel project settings.`;
  
  // Always log warning, but never throw during build/SSR
  // This allows the build to complete even if env vars are missing
  console.warn(errorMessage);
}

// Initialize Firebase app with error handling
let app: FirebaseApp;
try {
  // Check if we have minimum required config (at least projectId)
  if (!firebaseConfig.projectId) {
    // During build, create a dummy config to prevent crashes
    // This allows static generation to complete
    app = getApps().length 
      ? getApp() 
      : initializeApp({
          apiKey: firebaseConfig.apiKey || "demo-key",
          authDomain: firebaseConfig.authDomain || "demo.firebaseapp.com",
          projectId: firebaseConfig.projectId || "demo-project",
          storageBucket: firebaseConfig.storageBucket || "demo-project.appspot.com",
          messagingSenderId: firebaseConfig.messagingSenderId || "123456789",
          appId: firebaseConfig.appId || "1:123456789:web:abcdef",
        });
  } else {
    // Normal initialization with actual config
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Fallback: create minimal app to prevent build crashes
  app = initializeApp({
    apiKey: firebaseConfig.apiKey || "demo-key",
    authDomain: firebaseConfig.authDomain || "demo.firebaseapp.com",
    projectId: firebaseConfig.projectId || "demo-project",
    storageBucket: firebaseConfig.storageBucket || "demo-project.appspot.com",
    messagingSenderId: firebaseConfig.messagingSenderId || "123456789",
    appId: firebaseConfig.appId || "1:123456789:web:abcdef",
  });
}

export const db: Firestore = getFirestore(app);
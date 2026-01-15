"use client";

import { HOUSE_ID, ENVIRONMENT } from "@/lib/config";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useState, useEffect } from "react";

export default function TestPage() {
  const [firebaseTest, setFirebaseTest] = useState<{ status: string; error?: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const testFirebaseConnection = async () => {
    setTesting(true);
    setFirebaseTest(null);
    try {
      // Try to access a Firestore collection to verify connection
      const testCollection = collection(db, "houses", HOUSE_ID, "chores");
      await getDocs(testCollection);
      setFirebaseTest({ status: "✅ Successfully connected to Firestore" });
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      setFirebaseTest({ 
        status: "❌ Firestore connection failed", 
        error: errorMessage 
      });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    // Auto-test on mount
    testFirebaseConnection();
  }, []);

  const envVars = [
    { name: "NEXT_PUBLIC_FIREBASE_API_KEY", value: process.env.NEXT_PUBLIC_FIREBASE_API_KEY },
    { name: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", value: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN },
    { name: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", value: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID },
    { name: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", value: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET },
    { name: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", value: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID },
    { name: "NEXT_PUBLIC_FIREBASE_APP_ID", value: process.env.NEXT_PUBLIC_FIREBASE_APP_ID },
    { name: "NEXT_PUBLIC_HOUSE_ID", value: process.env.NEXT_PUBLIC_HOUSE_ID },
    { name: "NEXT_PUBLIC_ENVIRONMENT", value: process.env.NEXT_PUBLIC_ENVIRONMENT },
  ];

  const allFirebaseVarsSet = envVars
    .filter(v => v.name.startsWith("NEXT_PUBLIC_FIREBASE_"))
    .every(v => v.value);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Environment Test Page</h1>
        
        {/* App Config */}
        <div className="bg-card border border-border rounded-lg p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4">App Configuration</h2>
          <div className="space-y-2">
            <div>
              <strong>HOUSE_ID:</strong> <code className="bg-muted px-2 py-1 rounded">{HOUSE_ID}</code>
            </div>
            <div>
              <strong>ENVIRONMENT:</strong> <code className="bg-muted px-2 py-1 rounded">{ENVIRONMENT}</code>
            </div>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-card border border-border rounded-lg p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2">
            {envVars.map(({ name, value }) => (
              <div key={name} className="flex items-center gap-2">
                <strong className="w-64 text-sm">{name}:</strong>
                {value ? (
                  <code className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                    ✅ {name.includes("API_KEY") ? `***${value.slice(-4)}` : value}
                  </code>
                ) : (
                  <code className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                    ❌ Missing
                  </code>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded" style={{ 
            backgroundColor: allFirebaseVarsSet ? "#d1fae5" : "#fee2e2",
            color: allFirebaseVarsSet ? "#065f46" : "#991b1b"
          }}>
            <strong>
              {allFirebaseVarsSet 
                ? "✅ All Firebase environment variables are set" 
                : "❌ Some Firebase environment variables are missing"}
            </strong>
          </div>
        </div>

        {/* Firebase Connection Test */}
        <div className="bg-card border border-border rounded-lg p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4">Firebase Connection Test</h2>
          <button
            onClick={testFirebaseConnection}
            disabled={testing}
            className="mb-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {testing ? "Testing..." : "Test Firestore Connection"}
          </button>
          {firebaseTest && (
            <div className={`p-3 rounded ${
              firebaseTest.status.includes("✅") 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            }`}>
              <div className="font-semibold">{firebaseTest.status}</div>
              {firebaseTest.error && (
                <div className="mt-2 text-sm font-mono bg-white/50 p-2 rounded">
                  {firebaseTest.error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Troubleshooting Tips */}
        {(!allFirebaseVarsSet || firebaseTest?.status.includes("❌")) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2 text-yellow-800">Troubleshooting Tips</h2>
            <ul className="list-disc list-inside space-y-1 text-yellow-700 text-sm">
              <li>Go to Vercel Dashboard → Your Project → Settings → Environment Variables</li>
              <li>Ensure all <code>NEXT_PUBLIC_FIREBASE_*</code> variables are set</li>
              <li>Make sure they are set for <strong>Production</strong> environment (not just Preview)</li>
              <li>After adding/updating variables, <strong>redeploy</strong> your project</li>
              <li>Check that variable names match exactly (case-sensitive, no extra spaces)</li>
              <li>Verify your Firebase project ID matches the one in Firebase Console</li>
              {firebaseTest?.error?.includes("404") && (
                <li className="font-semibold text-red-700">
                  The 404 error suggests Firebase can't find your project. 
                  Double-check your PROJECT_ID matches your Firebase project.
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="mt-4">
          <a href="/director" className="text-primary hover:underline">
            ← Go to Director Page
          </a>
        </div>
      </div>
    </div>
  );
}

"use client";

import { HOUSE_ID, ENVIRONMENT } from "@/lib/config";

export default function TestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Environment Test Page</h1>
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <strong>HOUSE_ID:</strong> <code className="bg-muted px-2 py-1 rounded">{HOUSE_ID}</code>
          </div>
          <div>
            <strong>ENVIRONMENT:</strong> <code className="bg-muted px-2 py-1 rounded">{ENVIRONMENT}</code>
          </div>
          <div>
            <strong>Firebase API Key:</strong>{" "}
            <code className="bg-muted px-2 py-1 rounded">
              {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅ Set" : "❌ Missing"}
            </code>
          </div>
          <div>
            <strong>Firebase Project ID:</strong>{" "}
            <code className="bg-muted px-2 py-1 rounded">
              {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "❌ Missing"}
            </code>
          </div>
          <div className="mt-4">
            <a href="/director" className="text-primary hover:underline">
              ← Go to Director Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

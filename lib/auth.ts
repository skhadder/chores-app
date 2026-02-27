import { signInWithPopup, signOut as firebaseSignOut, GoogleAuthProvider, User } from "firebase/auth";
import { auth } from "./firebase";

export const ALLOWED_EMAILS = ["sarahkhadder@gmail.com", "zeiphj@gmail.com"];

export function isEmailAllowed(email: string | null): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email);
}

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  // Add custom parameters to ensure proper authentication flow
  provider.setCustomParameters({
    prompt: "select_account",
  });
  
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    // Re-throw with more context
    console.error("Firebase auth error:", error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

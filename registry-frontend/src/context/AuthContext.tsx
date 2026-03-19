"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import { toast } from "react-toastify";
import { auth, googleProvider } from "@/lib/firebaseConfig";
import { getUserProfile } from "@/lib/firestoreService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setUser(firebaseUser);
        if (firebaseUser) {
          let role = "user";
          try {
            const profile = await getUserProfile(firebaseUser.uid);
            if (profile?.role) {
              role = profile.role;
            }
          } catch {
            // profile fetch failed, default to user role
          }
          const sessionData = JSON.stringify({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role,
          });
          document.cookie = `session=${encodeURIComponent(sessionData)}; path=/; max-age=${7 * 24 * 60 * 60}`;
        }
        setLoading(false);
      },
      (error) => {
        console.error("Auth listener error:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === "auth/popup-closed-by-user") {
        return;
      }
      console.error("Login failed:", error);
      toast.error(firebaseError.message || "Failed to sign in with Google");
    }
  };

  const logout = async () => {
    try {
      document.cookie = "session=; path=/; max-age=0";
      await signOut(auth);
    } catch (error: unknown) {
      console.error("Logout failed:", error);
      const message = error instanceof Error ? error.message : "Failed to log out";
      toast.error(message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

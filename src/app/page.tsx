"use client";

import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import { apiGet, GoogleAuthResponse } from "@/lib/api";
import { useEffect, useState } from "react";

export default function Landing() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        await apiGet("/api/auth/check");
        window.location.href = "/dashboard";
      } catch {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);

      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        throw new Error("Google auth failed");
      }

      const data = (await res.json()) as GoogleAuthResponse;

      sessionStorage.setItem("user", JSON.stringify(data.user));
      router.push(data.firstTime ? "/onboarding" : "/dashboard");
    } catch (err) {
      console.error(err);
      setGoogleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg font-semibold">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <button
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className="rounded-lg bg-blue-500 px-6 py-3 text-white hover:bg-blue-600 disabled:opacity-50"
      >
        {googleLoading ? "Signing in..." : "Sign in with Google"}
      </button>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiGet, apiPut, MeResponse, UpdateMovieRequest, UpdateMovieResponse } from "@/lib/api";

export default function Onboarding() {
  const [movie, setMovie] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        await apiGet("/api/auth/check");
      } catch {
        setLoading(false);
        window.location.href = "/";
      }
    };
    checkAuthentication();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const trimmed = movie.trim();
    if (trimmed.length < 2) return setError("Movie name too short");
    if (trimmed.length > 100) return setError("Movie name too long");

    setLoading(true);

    try {
      await apiPut<UpdateMovieResponse, UpdateMovieRequest>("/api/me/movie", {
        favoriteMovie: trimmed,
      });
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to save movie. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center p-4">
      <h1 className="mb-4 text-2xl font-bold">Welcome! What&apos;s your favorite movie?</h1>
      <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col">
        <input
          type="text"
          placeholder="Enter movie name"
          value={movie}
          onChange={(e) => setMovie(e.target.value)}
          className="mb-2 rounded border p-2"
        />
        {error && <p className="mb-2 text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          {loading ? "Saving..." : "Save & Continue"}
        </button>
      </form>
    </div>
  );
}

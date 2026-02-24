"use client";

import Image from "next/image";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  apiPost,
  apiPut,
  ApiError,
  MeResponse,
  UpdateMovieRequest,
  UpdateMovieResponse,
} from "@/lib/api";
import { applyOptimisticMovie, rollbackMovie } from "@/lib/movie-edit";
import MovieFact from "@/components/MovieFact";

export default function DashboardClient({ initialUser }: { initialUser: MeResponse }) {
  const [user, setUser] = useState<MeResponse>(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [draftMovie, setDraftMovie] = useState(initialUser.favoriteMovie ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setError("");
    const nextMovie = draftMovie.trim();

    if (nextMovie.length < 2 || nextMovie.length > 100) {
      setError("Favorite movie must be between 2 and 100 characters.");
      return;
    }

    const previousMovie = user.favoriteMovie;
    setSaving(true);

    setUser(applyOptimisticMovie(user, nextMovie));
    setIsEditing(false);

    try {
      const response = await apiPut<UpdateMovieResponse, UpdateMovieRequest>("/api/me/movie", {
        favoriteMovie: nextMovie,
      });
      setUser((prev) => ({ ...prev, favoriteMovie: response.favoriteMovie }));

      if (previousMovie !== response.favoriteMovie) {
        queryClient.removeQueries({ queryKey: ["fact", previousMovie] });
        queryClient.removeQueries({ queryKey: ["fact", response.favoriteMovie] });
      }
    } catch (err) {
      setUser((prev) => rollbackMovie(prev, previousMovie ?? null));
      setDraftMovie(previousMovie ?? "");
      setIsEditing(true);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to update favorite movie.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await apiPost<{ success: boolean }>("/api/auth/logout");
    window.location.href = "/";
  };

  return (
    <div className="relative p-8">
      <button
        onClick={handleLogout}
        className="absolute right-8 top-8 rounded bg-red-500 px-4 py-2 text-white"
      >
        Logout
      </button>

      <h1 className="text-2xl font-semibold">Welcome, {user.name || user.email || "Movie fan"}</h1>

      {user.image ? (
        <Image
          src={user.image}
          alt="Profile"
          width={64}
          height={64}
          className="mt-2 rounded-full"
        />
      ) : (
        <p className="mt-2 text-sm text-gray-500">No profile photo available</p>
      )}

      <p className="mt-4">Email: {user.email}</p>

      <div className="mt-2">
        <p className="font-medium">Favorite Movie:</p>
        {isEditing ? (
          <div className="mt-2 flex items-center gap-2">
            <input
              value={draftMovie}
              onChange={(e) => setDraftMovie(e.target.value)}
              className="rounded border px-2 py-1"
              placeholder="Enter favorite movie"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded bg-green-600 px-3 py-1 text-white"
            >
              Save
            </button>
            <button
              onClick={() => {
                setDraftMovie(user.favoriteMovie ?? "");
                setIsEditing(false);
              }}
              disabled={saving}
              className="rounded bg-red-500 px-3 py-1 text-white"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-2">
            <span>{user.favoriteMovie || "Not set"}</span>
            <button
              onClick={() => setIsEditing(true)}
              className="rounded bg-blue-500 px-3 py-1 text-white"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-red-500">{error}</p>}

      {user.favoriteMovie && <MovieFact movie={user.favoriteMovie} />}
    </div>
  );
}

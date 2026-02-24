"use client"

import Image from "next/image";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  apiPost,
  apiPut,
  ApiError,
  MeResponse,
  UpdateMovieRequest,
  UpdateMovieResponse,
  apiGet,
  FactResponse,
} from "@/lib/api";
import { applyOptimisticMovie, rollbackMovie } from "@/lib/movie-edit";
import MovieFact from "@/components/MovieFact";
import { LogOut, Film, Pencil, Check, X } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftMovie, setDraftMovie] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        const me = await apiGet<MeResponse>("/api/me");
        setUser(me);
        setDraftMovie(me.favoriteMovie ?? "");
      } catch {
        window.location.href = "/";
      }
    };

    loadUserDetails();
  }, []);

  if (!user)
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-white/5 border-t-violet-600 animate-spin" />
      </div>
    );

  const handleSave = async () => {
    if (!user) return;
    setError("");
    const nextMovie = draftMovie.trim();
    if (nextMovie.length < 2 || nextMovie.length > 100) {
      setError("Favorite movie must be between 2 and 100 characters.");
      return;
    }
    const previousMovie = user.favoriteMovie;
    setSaving(true);
    setUser(applyOptimisticMovie(user, nextMovie));
    setDraftMovie(nextMovie);
    setIsEditing(false);
    try {
      const response = await apiPut<UpdateMovieResponse, UpdateMovieRequest>("/api/me/movie", {
        favoriteMovie: nextMovie,
      });
      setUser((prev) => (prev ? { ...prev, favoriteMovie: response.favoriteMovie } : prev));
      setDraftMovie(response.favoriteMovie ?? "");

      // Movie changed — clear old cache and immediately fetch a fresh fact
      if (previousMovie !== response.favoriteMovie) {
        queryClient.removeQueries({ queryKey: ["fact", previousMovie] });
        queryClient.removeQueries({ queryKey: ["fact", response.favoriteMovie] });

        // Fetch a fresh fact and seed the cache so MovieFact shows it instantly
        const freshFact = await apiGet<FactResponse>("/api/fact?forceNew=true");
        queryClient.setQueryData(["fact", response.favoriteMovie], freshFact);
      }
    } catch (err) {
      setUser((prev) => (prev ? rollbackMovie(prev, previousMovie ?? null) : prev));
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
    <div className="min-h-screen bg-[#080808] flex items-center justify-center relative overflow-hidden">

      {/* Subtle grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />

      {/* Top-right logout */}
      <button
        onClick={handleLogout}
        title="Logout"
        className="fixed top-5 right-6 z-50 flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-white/4 border border-white/8 text-white/50 text-[13px] tracking-wide backdrop-blur-md cursor-pointer transition-all duration-200 hover:bg-white/8 hover:text-white/70"
      >
        <LogOut size={16} strokeWidth={2} />
        <span>Logout</span>
      </button>

      {/* Centered card */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-105 mx-4 px-11 pt-12 pb-10 rounded-3xl bg-white/3 border border-white/[0.07] backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_40px_80px_rgba(0,0,0,0.6)] animate-[fadeUp_0.5s_ease_both]">

        {/* Glow accent */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-40 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.18) 0%, transparent 70%)" }}
        />

        {/* Avatar */}
        <div className="relative mb-5 z-10">
          {user.image ? (
            <Image
              src={user.image}
              alt="Profile"
              width={88}
              height={88}
              className="rounded-full block border-2 border-white/10"
            />
          ) : (
            <div className="w-22 h-22 rounded-full bg-linear-to-br from-violet-900 to-violet-600 flex items-center justify-center text-[32px] font-bold text-white border-2 border-white/10">
              {(user.name || user.email || "?")[0].toUpperCase()}
            </div>
          )}
          {/* Pulsing ring */}
          <div className="absolute -inset-1.25 rounded-full border border-violet-500/40 animate-[pulseRing_3s_ease-in-out_infinite] pointer-events-none" />
        </div>

        {/* Name */}
        <h1 className="z-10 text-[22px] font-bold text-white/90 tracking-tight text-center mb-1.5">
          {user.name || "Movie Fan"}
        </h1>

        {/* Email */}
        <p className="z-10 text-[13.5px] text-white/35 tracking-wide text-center mb-6">
          {user.email}
        </p>

        {/* Divider */}
        <div className="w-full h-px bg-white/6 mb-6" />

        {/* Favourite Movie inline edit */}
        <div className="w-full flex flex-col gap-2.5 z-10">

          <div className="flex items-center gap-1.5">
            <Film size={14} strokeWidth={2} className="text-violet-400" />
            <span className="text-[11px] font-medium tracking-[0.08em] uppercase text-white/30">
              Favourite Movie
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={isEditing ? draftMovie : (draftMovie || "Not set")}
              onChange={(e) => setDraftMovie(e.target.value)}
              readOnly={!isEditing}
              placeholder="Enter favourite movie"
              autoFocus={isEditing}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") {
                  setDraftMovie(user.favoriteMovie ?? "");
                  setIsEditing(false);
                }
              }}
              className={[
                "flex-1 text-[15px] rounded-[10px] px-3.5 py-2.5 outline-none transition-all duration-200 tracking-wide",
                isEditing
                  ? "bg-violet-600/[0.07] border border-violet-500/40 shadow-[0_0_0_3px_rgba(124,58,237,0.08)] text-white/90"
                  : "bg-transparent border border-white/4 text-white/70 cursor-default",
              ].join(" ")}
            />

            {!isEditing ? (
              <button
                onClick={() => {
                  setDraftMovie(user.favoriteMovie ?? "");
                  setIsEditing(true);
                }}
                title="Edit"
                className="flex items-center justify-center w-8.5 h-8.5 rounded-[9px] border border-white/8 bg-white/4 text-white/45 cursor-pointer transition-all duration-150 hover:bg-white/8 hover:text-white/70 shrink-0"
              >
                <Pencil size={14} strokeWidth={2} />
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  title="Save"
                  className="flex items-center justify-center w-8.5 h-8.5 rounded-[9px] border border-violet-500/35 bg-violet-600/15 text-violet-400 cursor-pointer transition-all duration-150 hover:bg-violet-600/25 disabled:opacity-50 shrink-0"
                >
                  <Check size={14} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => {
                    setDraftMovie(user.favoriteMovie ?? "");
                    setIsEditing(false);
                    setError("");
                  }}
                  disabled={saving}
                  title="Cancel"
                  className="flex items-center justify-center w-8.5 h-8.5 rounded-[9px] border border-red-500/20 bg-red-500/8 text-red-400 cursor-pointer transition-all duration-150 hover:bg-red-500/15 disabled:opacity-50 shrink-0"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </>
            )}
          </div>

          {error && (
            <p className="text-[12.5px] text-red-400 tracking-wide">{error}</p>
          )}
        </div>

        {/* Movie Fact */}
        {user.favoriteMovie && (
          <div className="w-full mt-5 px-4 py-3.5 bg-white/2 border border-white/5 rounded-xl z-10">
            <MovieFact movie={user.favoriteMovie} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseRing {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}

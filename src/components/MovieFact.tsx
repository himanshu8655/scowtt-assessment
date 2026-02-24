"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, FactResponse } from "@/lib/api";
import { RefreshCw } from "lucide-react";

export default function MovieFact({ movie }: { movie: string }) {
  const queryClient = useQueryClient();
  const queryKey = ["fact", movie] as const;

  const { data, isLoading, isError, isFetching } = useQuery<FactResponse>({
    queryKey,
    queryFn: () => apiGet<FactResponse>("/api/fact"),
    staleTime: 30_000,
  });

  const handleGetNewFact = async () => {
    const freshFact = await apiGet<FactResponse>("/api/fact?forceNew=true");
    queryClient.setQueryData(queryKey, freshFact);
  };

  if (isLoading)
    return (
      <div className="flex items-center gap-2 text-white/30 text-[13px]">
        <div className="w-3.5 h-3.5 rounded-full border border-white/10 border-t-violet-500 animate-spin" />
        Loading fact…
      </div>
    );

  if (isError)
    return <p className="text-[13px] text-red-400/70">Could not load fact.</p>;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13.5px] text-white/60 italic leading-relaxed">
        "{data?.fact}"
      </p>

      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-white/25 tracking-wide">
          Source: {data?.source ?? "unknown"}
        </span>

        <button
          onClick={handleGetNewFact}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-[11.5px] text-violet-400/70 hover:text-violet-400 transition-colors duration-150 disabled:opacity-40 cursor-pointer"
        >
          <RefreshCw
            size={11}
            strokeWidth={2.5}
            className={isFetching ? "animate-spin" : ""}
          />
          {isFetching ? "Refreshing…" : "New fact"}
        </button>
      </div>
    </div>
  );
}

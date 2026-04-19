"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPublicUrl } from "@/lib/supabase/storage-url";
import { timeAgo } from "@/lib/time";
import { ClipModal } from "@/components/clip-modal";

export interface ClipWithScore {
  id: string;
  storage_path: string;
  thumbnail_path: string | null;
  performer_name: string | null;
  duration_seconds: number;
  created_at: string;
  user_id: string;
  score: number;
  like_count: number;
  dislike_count: number;
}

const PAGE_SIZE = 20;

interface ClipGridProps {
  trickId: string;
  trickSlug: string;
  sort: string;
  initialClipId?: string;
  totalCount: number;
}

export function ClipGrid({ trickId, trickSlug, sort, initialClipId, totalCount }: ClipGridProps) {
  const [clips, setClips] = useState<ClipWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [modalClipIndex, setModalClipIndex] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null!);

  const fetchClips = useCallback(async (pageNum: number) => {
    const supabase = createClient();
    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Get clip IDs for this trick
    const { data: clipTricks } = await supabase
      .from("clip_tricks")
      .select("clip_id")
      .eq("trick_id", trickId);

    if (!clipTricks || clipTricks.length === 0) {
      setLoading(false);
      setHasMore(false);
      return [];
    }

    const clipIds = clipTricks.map((ct) => ct.clip_id);

    // Get clips with scores
    let query = supabase
      .from("clips")
      .select("id, storage_path, thumbnail_path, performer_name, duration_seconds, created_at, user_id")
      .in("id", clipIds)
      .eq("status", "active");

    if (sort === "newest") {
      query = query.order("created_at", { ascending: false });
    } else if (sort === "rising") {
      const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
      query = query.gte("created_at", threeDaysAgo);
    }

    query = query.range(from, to);

    const { data: clipsData } = await query;

    if (!clipsData) {
      setLoading(false);
      setHasMore(false);
      return [];
    }

    // Get scores for these clips
    const ids = clipsData.map((c) => c.id);
    const { data: votes } = await supabase
      .from("clip_votes")
      .select("clip_id, value")
      .in("clip_id", ids);

    const scoreMap = new Map<string, { score: number; likes: number; dislikes: number }>();
    for (const v of votes ?? []) {
      if (!scoreMap.has(v.clip_id)) {
        scoreMap.set(v.clip_id, { score: 0, likes: 0, dislikes: 0 });
      }
      const s = scoreMap.get(v.clip_id)!;
      s.score += v.value;
      if (v.value === 1) s.likes++;
      else s.dislikes++;
    }

    const enriched: ClipWithScore[] = clipsData.map((c) => {
      const s = scoreMap.get(c.id) || { score: 0, likes: 0, dislikes: 0 };
      return {
        ...c,
        score: s.score,
        like_count: s.likes,
        dislike_count: s.dislikes,
      };
    });

    if (sort === "top") {
      enriched.sort((a, b) => b.score - a.score || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === "rising") {
      const filtered = enriched.filter((c) => c.score > 0);
      filtered.sort((a, b) => b.score - a.score);
      return filtered;
    }

    return enriched;
  }, [trickId, sort]);

  // Initial fetch
  useEffect(() => {
    setClips([]);
    setPage(0);
    setHasMore(true);
    setLoading(true);

    fetchClips(0).then((data) => {
      setClips(data);
      setHasMore(data.length === PAGE_SIZE);
      setLoading(false);

      // Open modal if clip ID in URL
      if (initialClipId) {
        const idx = data.findIndex((c) => c.id === initialClipId);
        if (idx >= 0) setModalClipIndex(idx);
      }
    });
  }, [fetchClips, initialClipId]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const nextPage = page + 1;
          setPage(nextPage);
          setLoading(true);

          fetchClips(nextPage).then((data) => {
            setClips((prev) => [...prev, ...data]);
            setHasMore(data.length === PAGE_SIZE);
            setLoading(false);
          });
        }
      },
      { rootMargin: "200px" }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [hasMore, loading, page, fetchClips]);

  function openModal(index: number) {
    setModalClipIndex(index);
    const clip = clips[index];
    window.history.replaceState(null, "", `/tricks/${trickSlug}?sort=${sort}&clip=${clip.id}`);
  }

  function closeModal() {
    setModalClipIndex(null);
    window.history.replaceState(null, "", `/tricks/${trickSlug}?sort=${sort}`);
  }

  if (!loading && clips.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        No clips yet. Be the first to upload!
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {clips.map((clip, i) => {
          const collapsed = clip.score <= -5;

          return (
            <button
              key={clip.id}
              onClick={() => !collapsed && openModal(i)}
              className={`group text-left rounded-lg border overflow-hidden transition-all hover:shadow-sm ${
                collapsed ? "opacity-40" : "hover:border-primary/50"
              }`}
            >
              <div className="aspect-video bg-muted relative">
                {clip.thumbnail_path ? (
                  <img
                    src={getPublicUrl(clip.thumbnail_path)}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl text-muted-foreground/40">&#9654;</span>
                  </div>
                )}
                {collapsed && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <span className="text-xs text-muted-foreground">Low score — click to expand</span>
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-sm font-medium truncate">
                  {clip.performer_name || "Unknown"}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="text-green-600">{clip.like_count}</span>
                  <span>/</span>
                  <span className="text-red-500">{clip.dislike_count}</span>
                  <span className="ml-auto">{timeAgo(clip.created_at)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      <div ref={sentinelRef} />

      {modalClipIndex !== null && (
        <ClipModal
          clips={clips}
          currentIndex={modalClipIndex}
          trickSlug={trickSlug}
          sort={sort}
          onClose={closeModal}
          onNavigate={(index) => {
            setModalClipIndex(index);
            const clip = clips[index];
            window.history.replaceState(null, "", `/tricks/${trickSlug}?sort=${sort}&clip=${clip.id}`);
          }}
        />
      )}
    </>
  );
}

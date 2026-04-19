"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getPublicUrl } from "@/lib/supabase/storage-url";
import { timeAgo } from "@/lib/time";

interface FavoriteItem {
  clipId: string;
  storagePath: string;
  thumbnailPath: string | null;
  performerName: string | null;
  createdAt: string;
  favoritedAt: string;
  score: number;
  likeCount: number;
  dislikeCount: number;
  tricks: { name: string; slug: string }[];
}

export function FavoritesList({ initialItems }: { initialItems: FavoriteItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [removing, setRemoving] = useState<string | null>(null);
  const router = useRouter();

  async function handleUnfavorite(clipId: string) {
    setRemoving(clipId);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("clip_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("clip_id", clipId);

    setItems((prev) => prev.filter((item) => item.clipId !== clipId));
    setRemoving(null);
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground">
        No favorites yet. Browse tricks and save clips to your study list.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.clipId}
          className="rounded-lg border overflow-hidden transition-all hover:shadow-sm hover:border-primary/50"
        >
          <a
            href={
              item.tricks.length > 0
                ? `/tricks/${item.tricks[0].slug}?clip=${item.clipId}`
                : "#"
            }
            className="block"
          >
            <div className="aspect-video bg-muted relative">
              {item.thumbnailPath ? (
                <img
                  src={getPublicUrl(item.thumbnailPath)}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl text-muted-foreground/40">&#9654;</span>
                </div>
              )}
            </div>
          </a>

          <div className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {item.performerName || "Unknown"}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.tricks.map((trick) => (
                    <a
                      key={trick.slug}
                      href={`/tricks/${trick.slug}`}
                      className="text-xs px-1.5 py-0.5 rounded bg-muted hover:bg-accent transition-colors"
                    >
                      {trick.name}
                    </a>
                  ))}
                </div>
              </div>
              <button
                onClick={() => handleUnfavorite(item.clipId)}
                disabled={removing === item.clipId}
                className="shrink-0 px-2 py-1 rounded text-sm text-yellow-700 bg-yellow-100 hover:bg-yellow-200 transition-colors disabled:opacity-50"
                title="Remove from favorites"
              >
                {removing === item.clipId ? "..." : "★"}
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-green-600">{item.likeCount}</span>
              <span>/</span>
              <span className="text-red-500">{item.dislikeCount}</span>
              <span className="ml-auto">{timeAgo(item.createdAt)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

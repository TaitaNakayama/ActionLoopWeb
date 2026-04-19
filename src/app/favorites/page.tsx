import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FavoritesList } from "./favorites-list";

export const metadata: Metadata = {
  title: "Favorites — TrickDB",
};

export default async function FavoritesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/favorites");
  }

  const { data: favorites } = await supabase
    .from("clip_favorites")
    .select(`
      clip_id,
      created_at,
      clips:clip_id (
        id,
        storage_path,
        thumbnail_path,
        performer_name,
        duration_seconds,
        created_at,
        status
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const clipIds = (favorites ?? [])
    .filter((f: any) => f.clips && f.clips.status === "active")
    .map((f: any) => f.clip_id);

  // Get trick names for each clip
  const { data: clipTricks } = clipIds.length > 0
    ? await supabase
        .from("clip_tricks")
        .select("clip_id, tricks:trick_id (name, slug)")
        .in("clip_id", clipIds)
    : { data: [] };

  // Get scores
  const { data: votes } = clipIds.length > 0
    ? await supabase
        .from("clip_votes")
        .select("clip_id, value")
        .in("clip_id", clipIds)
    : { data: [] };

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

  const trickMap = new Map<string, { name: string; slug: string }[]>();
  for (const ct of clipTricks ?? []) {
    const existing = trickMap.get(ct.clip_id) ?? [];
    if (ct.tricks) {
      existing.push(ct.tricks as any);
    }
    trickMap.set(ct.clip_id, existing);
  }

  const items = (favorites ?? [])
    .filter((f: any) => f.clips && f.clips.status === "active")
    .map((f: any) => {
      const s = scoreMap.get(f.clip_id) || { score: 0, likes: 0, dislikes: 0 };
      return {
        clipId: f.clip_id,
        storagePath: f.clips.storage_path,
        thumbnailPath: f.clips.thumbnail_path,
        performerName: f.clips.performer_name,
        createdAt: f.clips.created_at,
        favoritedAt: f.created_at,
        score: s.score,
        likeCount: s.likes,
        dislikeCount: s.dislikes,
        tricks: trickMap.get(f.clip_id) ?? [],
      };
    });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Favorites</h1>
      {items.length === 0 ? (
        <p className="text-muted-foreground">
          No favorites yet. Browse tricks and save clips to your study list.
        </p>
      ) : (
        <FavoritesList initialItems={items} />
      )}
    </div>
  );
}

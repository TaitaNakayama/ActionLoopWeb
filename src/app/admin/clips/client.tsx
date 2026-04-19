"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPublicUrl } from "@/lib/supabase/storage-url";
import { timeAgo } from "@/lib/time";

interface Clip {
  id: string;
  storage_path: string;
  thumbnail_path: string | null;
  performer_name: string | null;
  status: string;
  created_at: string;
  user_id: string;
}

export function AdminClipsClient({ clips: initial }: { clips: Clip[] }) {
  const [clips, setClips] = useState(initial);
  const [filter, setFilter] = useState("active");

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("clips").update({ status }).eq("id", id);
    setClips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  }

  const filtered = filter === "all" ? clips : clips.filter((c) => c.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {["all", "active", "hidden", "removed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              filter === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"
            }`}
          >
            {s} ({s === "all" ? clips.length : clips.filter((c) => c.status === s).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No clips.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((clip) => (
            <div key={clip.id} className="border rounded-md overflow-hidden">
              <div className="aspect-video bg-muted">
                {clip.thumbnail_path ? (
                  <img
                    src={getPublicUrl(clip.thumbnail_path)}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 text-2xl">
                    &#9654;
                  </div>
                )}
              </div>
              <div className="p-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">
                    {clip.performer_name || "Unknown"}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    clip.status === "active" ? "bg-green-100 text-green-700" :
                    clip.status === "hidden" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-600"
                  }`}>
                    {clip.status}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {timeAgo(clip.created_at)} &middot; <code className="bg-muted px-1 rounded">{clip.id.slice(0, 8)}</code>
                </div>
                <div className="flex gap-1">
                  {clip.status !== "active" && (
                    <button
                      onClick={() => updateStatus(clip.id, "active")}
                      className="text-xs px-2 py-0.5 rounded border hover:bg-accent transition-colors"
                    >
                      Restore
                    </button>
                  )}
                  {clip.status !== "hidden" && (
                    <button
                      onClick={() => updateStatus(clip.id, "hidden")}
                      className="text-xs px-2 py-0.5 rounded border border-yellow-300 text-yellow-700 hover:bg-yellow-50 transition-colors"
                    >
                      Hide
                    </button>
                  )}
                  {clip.status !== "removed" && (
                    <button
                      onClick={() => updateStatus(clip.id, "removed")}
                      className="text-xs px-2 py-0.5 rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

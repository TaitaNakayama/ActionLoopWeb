"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/time";

interface TrickRequest {
  id: string;
  trick_name: string;
  notes: string | null;
  status: string;
  created_at: string;
  user_id: string;
}

function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/[-_]/g, " ").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");
}

function slugify(input: string): string {
  return normalize(input).replace(/ /g, "-");
}

export function AdminRequestsClient({ requests: initial }: { requests: TrickRequest[] }) {
  const [requests, setRequests] = useState(initial);
  const [filter, setFilter] = useState("pending");
  const router = useRouter();

  async function approve(req: TrickRequest) {
    const supabase = createClient();

    // Create the trick
    const { error: trickError } = await supabase.from("tricks").insert({
      name: req.trick_name,
      normalized_name: normalize(req.trick_name),
      slug: slugify(req.trick_name),
    });

    if (trickError) {
      alert("Failed to create trick: " + trickError.message);
      return;
    }

    // Update request status
    await supabase
      .from("trick_requests")
      .update({ status: "approved" })
      .eq("id", req.id);

    setRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: "approved" } : r))
    );
  }

  async function reject(id: string) {
    const supabase = createClient();
    await supabase
      .from("trick_requests")
      .update({ status: "rejected" })
      .eq("id", id);

    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r))
    );
  }

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {["all", "pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              filter === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"
            }`}
          >
            {s} ({s === "all" ? requests.length : requests.filter((r) => r.status === s).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No requests.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div key={req.id} className="border rounded-md p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-semibold">{req.trick_name}</span>
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                    req.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    req.status === "approved" ? "bg-green-100 text-green-700" :
                    "bg-red-100 text-red-600"
                  }`}>
                    {req.status}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{timeAgo(req.created_at)}</span>
              </div>

              {req.notes && (
                <p className="text-sm text-muted-foreground">{req.notes}</p>
              )}

              {req.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => approve(req)}
                    className="text-xs px-3 py-1 rounded border border-green-300 text-green-700 hover:bg-green-50 transition-colors"
                  >
                    Approve & Create Trick
                  </button>
                  <button
                    onClick={() => reject(req.id)}
                    className="text-xs px-3 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

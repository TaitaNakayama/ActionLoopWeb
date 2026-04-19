"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/time";

interface Report {
  id: string;
  reason: string;
  notes: string | null;
  status: string;
  created_at: string;
  user_id: string;
  clip_id: string;
}

const STATUS_OPTIONS = ["open", "reviewed", "dismissed", "actioned"] as const;

export function AdminReportsClient({ reports: initial }: { reports: Report[] }) {
  const [reports, setReports] = useState(initial);
  const [filter, setFilter] = useState<string>("open");

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("clip_reports").update({ status }).eq("id", id);
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  }

  async function hideClip(clipId: string) {
    const supabase = createClient();
    await supabase.from("clips").update({ status: "hidden" }).eq("id", clipId);
  }

  async function removeClip(clipId: string) {
    const supabase = createClient();
    await supabase.from("clips").update({ status: "removed" }).eq("id", clipId);
  }

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {["all", ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              filter === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"
            }`}
          >
            {s} ({s === "all" ? reports.length : reports.filter((r) => r.status === s).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No reports.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <div key={report.id} className="border rounded-md p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-sm font-medium capitalize">
                    {report.reason.replace(/_/g, " ")}
                  </span>
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                    report.status === "open" ? "bg-yellow-100 text-yellow-700" :
                    report.status === "actioned" ? "bg-green-100 text-green-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {report.status}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{timeAgo(report.created_at)}</span>
              </div>

              {report.notes && (
                <p className="text-sm text-muted-foreground">{report.notes}</p>
              )}

              <div className="text-xs text-muted-foreground">
                Clip: <code className="bg-muted px-1 rounded">{report.clip_id.slice(0, 8)}</code>
              </div>

              <div className="flex gap-1 flex-wrap">
                {STATUS_OPTIONS.filter((s) => s !== report.status).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(report.id, s)}
                    className="text-xs px-2 py-1 rounded border hover:bg-accent transition-colors"
                  >
                    Mark {s}
                  </button>
                ))}
                <button
                  onClick={() => { hideClip(report.clip_id); updateStatus(report.id, "actioned"); }}
                  className="text-xs px-2 py-1 rounded border border-yellow-300 text-yellow-700 hover:bg-yellow-50 transition-colors"
                >
                  Hide clip
                </button>
                <button
                  onClick={() => { removeClip(report.clip_id); updateStatus(report.id, "actioned"); }}
                  className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                >
                  Remove clip
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

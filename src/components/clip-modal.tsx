"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPublicUrl } from "@/lib/supabase/storage-url";
import { timeAgo } from "@/lib/time";
import { Button } from "@/components/ui/button";
import type { ClipWithScore } from "@/app/tricks/[slug]/clip-grid";

const SPEEDS = [0.25, 0.5, 1, 2] as const;

interface ClipModalProps {
  clips: ClipWithScore[];
  currentIndex: number;
  trickSlug: string;
  sort: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function ClipModal({
  clips,
  currentIndex,
  trickSlug,
  sort,
  onClose,
  onNavigate,
}: ClipModalProps) {
  const clip = clips[currentIndex];
  const videoRef = useRef<HTMLVideoElement>(null!);
  const [speed, setSpeed] = useState<number>(1);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likeCount, setLikeCount] = useState(clip.like_count);
  const [dislikeCount, setDislikeCount] = useState(clip.dislike_count);
  const [showReport, setShowReport] = useState(false);
  const [showFavWarning, setShowFavWarning] = useState(false);
  const [favWarningTrick, setFavWarningTrick] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Load user state for this clip
  useEffect(() => {
    const supabase = createClient();

    async function loadState() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserId(null);
        return;
      }
      setUserId(user.id);

      const [voteRes, favRes] = await Promise.all([
        supabase
          .from("clip_votes")
          .select("value")
          .eq("user_id", user.id)
          .eq("clip_id", clip.id)
          .maybeSingle(),
        supabase
          .from("clip_favorites")
          .select("clip_id")
          .eq("user_id", user.id)
          .eq("clip_id", clip.id)
          .maybeSingle(),
      ]);

      setUserVote(voteRes.data?.value ?? null);
      setIsFavorited(!!favRes.data);
    }

    setLikeCount(clip.like_count);
    setDislikeCount(clip.dislike_count);
    setUserVote(null);
    setIsFavorited(false);
    setShowReport(false);
    loadState();
  }, [clip.id, clip.like_count, clip.dislike_count]);

  // Set playback speed when it changes or clip changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (showReport) return;
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
      else if (e.key === "ArrowRight" && currentIndex < clips.length - 1) onNavigate(currentIndex + 1);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, clips.length, onClose, onNavigate, showReport]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function handleVote(value: 1 | -1) {
    if (!userId) return;
    const supabase = createClient();

    if (userVote === value) {
      // Remove vote
      await supabase
        .from("clip_votes")
        .delete()
        .eq("user_id", userId)
        .eq("clip_id", clip.id);

      if (value === 1) setLikeCount((c) => c - 1);
      else setDislikeCount((c) => c - 1);
      setUserVote(null);
    } else {
      // Upsert vote
      await supabase
        .from("clip_votes")
        .upsert(
          { user_id: userId, clip_id: clip.id, value, updated_at: new Date().toISOString() },
          { onConflict: "user_id,clip_id" }
        );

      if (userVote === 1) setLikeCount((c) => c - 1);
      else if (userVote === -1) setDislikeCount((c) => c - 1);

      if (value === 1) setLikeCount((c) => c + 1);
      else setDislikeCount((c) => c + 1);
      setUserVote(value);
    }
  }

  async function handleFavorite() {
    if (!userId) return;
    const supabase = createClient();

    if (isFavorited) {
      await supabase
        .from("clip_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("clip_id", clip.id);
      setIsFavorited(false);
    } else {
      // Check if user already has a favorite for any of this clip's tricks
      const { data: clipTricks } = await supabase
        .from("clip_tricks")
        .select("trick_id, tricks:trick_id (name)")
        .eq("clip_id", clip.id);

      if (clipTricks && clipTricks.length > 0) {
        const trickIds = clipTricks.map((ct) => ct.trick_id);

        const { data: existingFavs } = await supabase
          .from("clip_favorites")
          .select("clip_id, clips:clip_id (id)")
          .eq("user_id", userId);

        if (existingFavs && existingFavs.length > 0) {
          const favClipIds = existingFavs.map((f) => f.clip_id);
          const { data: favClipTricks } = await supabase
            .from("clip_tricks")
            .select("trick_id")
            .in("clip_id", favClipIds)
            .in("trick_id", trickIds);

          if (favClipTricks && favClipTricks.length > 0) {
            const overlappingTrickId = favClipTricks[0].trick_id;
            const trickName = clipTricks.find((ct) => ct.trick_id === overlappingTrickId);
            setFavWarningTrick((trickName?.tricks as any)?.name ?? "this trick");
            setShowFavWarning(true);
            return;
          }
        }
      }

      await saveFavorite();
    }
  }

  async function saveFavorite() {
    if (!userId) return;
    const supabase = createClient();
    await supabase
      .from("clip_favorites")
      .insert({ user_id: userId, clip_id: clip.id });
    setIsFavorited(true);
    setShowFavWarning(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-3xl mx-2 sm:mx-4 bg-background rounded-lg overflow-hidden shadow-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          &times;
        </button>

        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors text-lg"
          >
            &#8249;
          </button>
        )}
        {currentIndex < clips.length - 1 && (
          <button
            onClick={() => onNavigate(currentIndex + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors text-lg"
          >
            &#8250;
          </button>
        )}

        {/* Video player */}
        <div className="bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            key={clip.id}
            src={getPublicUrl(clip.storage_path)}
            controls
            autoPlay
            loop
            playsInline
            className="w-full max-h-[60vh] object-contain"
            onLoadedMetadata={() => {
              if (videoRef.current) videoRef.current.playbackRate = speed;
            }}
          />
        </div>

        {/* Controls */}
        <div className="p-4 space-y-3 overflow-y-auto">
          {/* Speed controls */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-1">Speed:</span>
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  speed === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-accent"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Info row */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {clip.performer_name || "Unknown"}
              </p>
              <p className="text-xs text-muted-foreground">
                {timeAgo(clip.created_at)}
              </p>
            </div>

            {/* Vote + action buttons */}
            <div className="flex items-center gap-2">
              {/* Like */}
              <button
                onClick={() => handleVote(1)}
                disabled={!userId}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-sm transition-colors ${
                  userVote === 1
                    ? "bg-green-100 text-green-700"
                    : "hover:bg-muted"
                } ${!userId ? "opacity-50 cursor-not-allowed" : ""}`}
                title={userId ? "Good example of this trick" : "Sign in to vote"}
              >
                <span>&#9650;</span>
                <span>{likeCount}</span>
              </button>

              {/* Dislike */}
              <button
                onClick={() => handleVote(-1)}
                disabled={!userId}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-sm transition-colors ${
                  userVote === -1
                    ? "bg-red-100 text-red-700"
                    : "hover:bg-muted"
                } ${!userId ? "opacity-50 cursor-not-allowed" : ""}`}
                title={userId ? "Not a good example" : "Sign in to vote"}
              >
                <span>&#9660;</span>
                <span>{dislikeCount}</span>
              </button>

              {/* Favorite */}
              <button
                onClick={handleFavorite}
                disabled={!userId}
                className={`px-2.5 py-1 rounded text-sm transition-colors ${
                  isFavorited
                    ? "bg-yellow-100 text-yellow-700"
                    : "hover:bg-muted"
                } ${!userId ? "opacity-50 cursor-not-allowed" : ""}`}
                title={userId ? (isFavorited ? "Remove from favorites" : "Save to favorites") : "Sign in to favorite"}
              >
                {isFavorited ? "★" : "☆"}
              </button>

              {/* Report */}
              <button
                onClick={() => userId && setShowReport(true)}
                disabled={!userId}
                className={`px-2.5 py-1 rounded text-sm hover:bg-muted transition-colors ${
                  !userId ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title={userId ? "Report clip" : "Sign in to report"}
              >
                ⚑
              </button>
            </div>
          </div>
        </div>

        {/* Favorite warning overlay */}
        {showFavWarning && (
          <div className="absolute inset-0 bg-background/95 flex items-center justify-center p-6">
            <div className="w-full max-w-sm space-y-4 text-center">
              <p className="text-sm">
                You already have a favorite for <span className="font-semibold">{favWarningTrick}</span>. Save anyway?
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setShowFavWarning(false)}>
                  Cancel
                </Button>
                <Button onClick={saveFavorite}>
                  Save Anyway
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Report form overlay */}
        {showReport && (
          <ReportForm
            clipId={clip.id}
            userId={userId!}
            onClose={() => setShowReport(false)}
          />
        )}
      </div>
    </div>
  );
}

const REPORT_REASONS = [
  { value: "wrong_trick", label: "Wrong trick tagged" },
  { value: "not_a_trick", label: "Not a trick clip" },
  { value: "inappropriate", label: "Inappropriate / NSFW" },
  { value: "duplicate", label: "Duplicate clip" },
  { value: "low_quality", label: "Low quality / unwatchable" },
  { value: "stolen_content", label: "Stolen content / no attribution" },
  { value: "dangerous_technique", label: "Dangerous / unsafe technique" },
] as const;

function ReportForm({
  clipId,
  userId,
  onClose,
}: {
  clipId: string;
  userId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;

    setSubmitting(true);
    const supabase = createClient();
    await supabase.from("clip_reports").insert({
      user_id: userId,
      clip_id: clipId,
      reason,
      notes: notes.trim() || null,
    });

    setSubmitted(true);
    setSubmitting(false);
    setTimeout(onClose, 1500);
  }

  if (submitted) {
    return (
      <div className="absolute inset-0 bg-background/95 flex items-center justify-center">
        <p className="text-sm font-medium">Report submitted. Thank you.</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-background/95 flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Report Clip</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            &times;
          </button>
        </div>

        <div className="space-y-2">
          {REPORT_REASONS.map((r) => (
            <label
              key={r.value}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
                reason === r.value ? "bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
            >
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="sr-only"
              />
              <span className={`w-3 h-3 rounded-full border-2 ${
                reason === r.value ? "border-primary bg-primary" : "border-muted-foreground"
              }`} />
              {r.label}
            </label>
          ))}
        </div>

        <textarea
          placeholder="Additional notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full h-20 px-3 py-2 text-sm border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={!reason || submitting} className="flex-1">
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </form>
    </div>
  );
}

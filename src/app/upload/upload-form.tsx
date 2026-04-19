"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrickSelector } from "@/components/trick-selector";
import { createClient } from "@/lib/supabase/client";

const MAX_DURATION = 20;
const MAX_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

interface Trick {
  id: string;
  name: string;
  slug: string;
}

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [tricks, setTricks] = useState<Trick[]>([]);
  const [performer, setPerformer] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null!);
  const router = useRouter();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setError("");

    if (!selected) {
      setFile(null);
      setVideoUrl(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Only MP4, MOV, and WebM files are allowed.");
      return;
    }

    if (selected.size > MAX_SIZE) {
      setError("File must be under 100 MB.");
      return;
    }

    const url = URL.createObjectURL(selected);
    setFile(selected);
    setVideoUrl(url);
  }, []);

  function handleLoadedMetadata() {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    if (video.duration > MAX_DURATION) {
      setError(`Clip must be ${MAX_DURATION} seconds or shorter. This clip is ${Math.round(video.duration)}s.`);
    } else {
      setError("");
    }
  }

  async function generateThumbnail(videoFile: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        video.currentTime = video.duration * 0.5;
      };

      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(video.src);
            if (blob) resolve(blob);
            else reject(new Error("Failed to generate thumbnail"));
          },
          "image/jpeg",
          0.8
        );
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error("Failed to load video for thumbnail"));
      };

      video.src = URL.createObjectURL(videoFile);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!file) {
      setError("Please select a video file.");
      return;
    }
    if (duration > MAX_DURATION) {
      setError(`Clip must be ${MAX_DURATION} seconds or shorter.`);
      return;
    }
    if (tricks.length === 0) {
      setError("Please select at least one trick.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be signed in to upload.");
        setUploading(false);
        return;
      }

      // Check username
      const { data: profile } = await supabase
        .from("users")
        .select("username")
        .eq("id", user.id)
        .single();

      if (!profile?.username) {
        router.push(`/auth/set-username?redirect=${encodeURIComponent("/upload")}`);
        return;
      }

      setProgress(10);

      const ext = file.name.split(".").pop() || "mp4";
      const uuid = crypto.randomUUID();
      const storagePath = `clips/${uuid}.${ext}`;

      // Upload video
      const { error: uploadError } = await supabase.storage
        .from("clips")
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      setProgress(60);

      // Generate and upload thumbnail
      let thumbnailPath: string | null = null;
      try {
        const thumbnailBlob = await generateThumbnail(file);
        thumbnailPath = `thumbnails/${uuid}.jpg`;
        await supabase.storage
          .from("clips")
          .upload(thumbnailPath, thumbnailBlob, {
            contentType: "image/jpeg",
            upsert: false,
          });
      } catch {
        // Thumbnail generation can fail for some formats, continue without
      }

      setProgress(80);

      // Create clip record
      const { data: clip, error: clipError } = await supabase
        .from("clips")
        .insert({
          user_id: user.id,
          storage_path: storagePath,
          thumbnail_path: thumbnailPath,
          performer_name: performer.trim() || null,
          duration_seconds: Math.round(duration),
          file_size_bytes: file.size,
          mime_type: file.type,
        })
        .select("id")
        .single();

      if (clipError) {
        setError(`Failed to create clip: ${clipError.message}`);
        setUploading(false);
        return;
      }

      // Create clip-trick associations
      const clipTricks = tricks.map((t) => ({
        clip_id: clip.id,
        trick_id: t.id,
      }));

      const { error: linkError } = await supabase
        .from("clip_tricks")
        .insert(clipTricks);

      if (linkError) {
        setError(`Failed to link tricks: ${linkError.message}`);
        setUploading(false);
        return;
      }

      setProgress(100);

      // Redirect to the first trick's page
      router.push(`/tricks/${tricks[0].slug}`);
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Video file input */}
      <div className="space-y-2">
        <Label htmlFor="video">Video File</Label>
        <Input
          id="video"
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <p className="text-xs text-muted-foreground">
          MP4, MOV, or WebM. Max 20 seconds, 100 MB.
        </p>
      </div>

      {/* Video preview */}
      {videoUrl && (
        <div className="rounded-lg overflow-hidden border bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full max-h-80 object-contain"
            onLoadedMetadata={handleLoadedMetadata}
          />
        </div>
      )}

      {/* Trick selector */}
      <div className="space-y-2">
        <Label>
          Tricks <span className="text-destructive">*</span>
        </Label>
        <TrickSelector
          selected={tricks}
          onChange={setTricks}
          max={3}
        />
      </div>

      {/* Performer name */}
      <div className="space-y-2">
        <Label htmlFor="performer">Performer</Label>
        <Input
          id="performer"
          type="text"
          placeholder="Who is performing?"
          value={performer}
          onChange={(e) => setPerformer(e.target.value)}
          disabled={uploading}
        />
        <p className="text-xs text-muted-foreground">
          Optional. Shows &quot;Unknown&quot; if left blank.
        </p>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Progress */}
      {uploading && (
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {progress < 60 ? "Uploading video..." :
             progress < 80 ? "Generating thumbnail..." :
             progress < 100 ? "Saving clip data..." :
             "Done!"}
          </p>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        disabled={uploading || !file || tricks.length === 0 || duration > MAX_DURATION}
      >
        {uploading ? "Uploading..." : "Upload Clip"}
      </Button>
    </form>
  );
}

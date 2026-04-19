"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function RequestTrickForm({ prefillName }: { prefillName: string }) {
  const [trickName, setTrickName] = useState(prefillName);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = trickName.trim();
    if (!name) return;

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be signed in.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("trick_requests").insert({
      user_id: user.id,
      trick_name: name,
      notes: notes.trim() || null,
    });

    if (insertError) {
      setError("Failed to submit request. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-lg font-medium">Request submitted!</p>
        <p className="text-sm text-muted-foreground">
          An admin will review your request. If approved, the trick will appear in the database.
        </p>
        <Button variant="outline" onClick={() => router.push("/tricks")}>
          Browse Tricks
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="trick-name" className="block text-sm font-medium mb-1">
          Trick Name
        </label>
        <input
          id="trick-name"
          type="text"
          value={trickName}
          onChange={(e) => setTrickName(e.target.value)}
          placeholder="e.g. Triple Cork"
          required
          className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-1">
          Notes <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe the trick, common names, or why it should be added..."
          className="w-full h-24 px-3 py-2 text-sm border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={!trickName.trim() || submitting} className="w-full">
        {submitting ? "Submitting..." : "Submit Request"}
      </Button>
    </form>
  );
}

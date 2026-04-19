"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function SetUsernameForm() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!usernameRegex.test(username)) {
      setError("Username must be 3-20 characters, alphanumeric and underscores only.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ username })
      .eq("id", user.id);

    if (updateError) {
      if (updateError.code === "23505") {
        setError("Username already taken.");
      } else {
        setError(updateError.message);
      }
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Choose a Username</CardTitle>
          <CardDescription className="text-center">
            Pick a username before you continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                required
                minLength={3}
                maxLength={20}
                pattern="^[a-zA-Z0-9_]{3,20}$"
              />
              <p className="text-xs text-muted-foreground">
                3-20 characters, letters, numbers, and underscores
              </p>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SetUsernamePage() {
  return (
    <Suspense>
      <SetUsernameForm />
    </Suspense>
  );
}

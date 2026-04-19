import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RequestTrickForm } from "./request-form";

export const metadata: Metadata = {
  title: "Request a Trick — TrickDB",
};

export default async function RequestTrickPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=/request-trick");
  }

  const params = await searchParams;
  const prefill = params.name ?? "";

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Request a Trick</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Can't find a trick in our database? Submit a request and an admin will review it.
      </p>
      <RequestTrickForm prefillName={prefill} />
    </div>
  );
}

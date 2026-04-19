import { createClient } from "@/lib/supabase/server";
import { AdminClipsClient } from "./client";

export default async function AdminClipsPage() {
  const supabase = await createClient();
  const { data: clips } = await supabase
    .from("clips")
    .select("id, storage_path, thumbnail_path, performer_name, status, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(100);

  return <AdminClipsClient clips={clips ?? []} />;
}

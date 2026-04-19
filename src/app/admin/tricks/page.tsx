import { createClient } from "@/lib/supabase/server";
import { AdminTricksClient } from "./client";

export default async function AdminTricksPage() {
  const supabase = await createClient();
  const { data: tricks } = await supabase
    .from("tricks")
    .select("id, name, normalized_name, slug, is_active, created_at")
    .order("name");

  return <AdminTricksClient tricks={tricks ?? []} />;
}

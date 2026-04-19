import { createClient } from "@/lib/supabase/server";
import { AdminRequestsClient } from "./client";

export default async function AdminRequestsPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("trick_requests")
    .select("id, trick_name, notes, status, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(100);

  return <AdminRequestsClient requests={requests ?? []} />;
}

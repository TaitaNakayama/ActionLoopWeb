import { createClient } from "@/lib/supabase/server";
import { AdminReportsClient } from "./client";

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("clip_reports")
    .select("id, reason, notes, status, created_at, user_id, clip_id")
    .order("created_at", { ascending: false })
    .limit(100);

  return <AdminReportsClient reports={reports ?? []} />;
}

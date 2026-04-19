import { createClient } from "@/lib/supabase/server";
import { AdminAliasesClient } from "./client";

export default async function AdminAliasesPage() {
  const supabase = await createClient();
  const { data: aliases } = await supabase
    .from("trick_aliases")
    .select("id, alias, normalized_alias, trick_id, tricks:trick_id (name)")
    .order("alias");

  return <AdminAliasesClient aliases={(aliases ?? []) as any} />;
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Alias {
  id: string;
  alias: string;
  normalized_alias: string;
  trick_id: string;
  tricks: { name: string } | null;
}

function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/[-_]/g, " ").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");
}

export function AdminAliasesClient({ aliases: initial }: { aliases: Alias[] }) {
  const [aliases, setAliases] = useState(initial);
  const [aliasText, setAliasText] = useState("");
  const [trickSearch, setTrickSearch] = useState("");
  const [trickResults, setTrickResults] = useState<{ id: string; name: string }[]>([]);
  const [selectedTrick, setSelectedTrick] = useState<{ id: string; name: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const router = useRouter();

  async function searchTricks(q: string) {
    setTrickSearch(q);
    if (q.length < 1) {
      setTrickResults([]);
      return;
    }
    const supabase = createClient();
    const { data } = await supabase
      .from("tricks")
      .select("id, name")
      .ilike("normalized_name", `%${normalize(q)}%`)
      .limit(5);
    setTrickResults(data ?? []);
  }

  async function handleAdd() {
    if (!aliasText.trim() || !selectedTrick) return;
    setAdding(true);

    const supabase = createClient();
    const { error } = await supabase.from("trick_aliases").insert({
      trick_id: selectedTrick.id,
      alias: aliasText.trim(),
      normalized_alias: normalize(aliasText),
    });

    if (!error) {
      setAliasText("");
      setSelectedTrick(null);
      setTrickSearch("");
      router.refresh();
    }
    setAdding(false);
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("trick_aliases").delete().eq("id", id);
    setAliases((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium">Alias</label>
          <Input
            value={aliasText}
            onChange={(e) => setAliasText(e.target.value)}
            placeholder="e.g. dub cork"
          />
        </div>
        <div className="flex-1 space-y-1 relative">
          <label className="text-xs font-medium">
            Trick: {selectedTrick ? selectedTrick.name : "none"}
          </label>
          <Input
            value={trickSearch}
            onChange={(e) => searchTricks(e.target.value)}
            placeholder="Search trick..."
          />
          {trickResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50">
              {trickResults.map((t) => (
                <button
                  key={t.id}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    setSelectedTrick(t);
                    setTrickResults([]);
                    setTrickSearch(t.name);
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button onClick={handleAdd} disabled={adding || !aliasText.trim() || !selectedTrick}>
          {adding ? "..." : "Add"}
        </Button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 pr-4">Alias</th>
            <th className="py-2 pr-4">Trick</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {aliases.map((a) => (
            <tr key={a.id} className="border-b">
              <td className="py-2 pr-4">{a.alias}</td>
              <td className="py-2 pr-4 text-muted-foreground">
                {(a.tricks as any)?.name ?? "Unknown"}
              </td>
              <td className="py-2">
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xs text-muted-foreground">{aliases.length} aliases total</p>
    </div>
  );
}

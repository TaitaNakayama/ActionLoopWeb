"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Trick {
  id: string;
  name: string;
  normalized_name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/[-_]/g, " ").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");
}

function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[-_]/g, " ").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").replace(/ /g, "-");
}

export function AdminTricksClient({ tricks: initial }: { tricks: Trick[] }) {
  const [tricks, setTricks] = useState(initial);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const router = useRouter();

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);

    const supabase = createClient();
    const { error } = await supabase.from("tricks").insert({
      name,
      normalized_name: normalize(name),
      slug: slugify(name),
    });

    if (!error) {
      setNewName("");
      router.refresh();
    }
    setAdding(false);
  }

  async function toggleActive(trick: Trick) {
    const supabase = createClient();
    await supabase
      .from("tricks")
      .update({ is_active: !trick.is_active })
      .eq("id", trick.id);
    setTricks((prev) =>
      prev.map((t) => (t.id === trick.id ? { ...t, is_active: !t.is_active } : t))
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New trick name..."
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={adding || !newName.trim()}>
          {adding ? "Adding..." : "Add Trick"}
        </Button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Slug</th>
            <th className="py-2 pr-4">Active</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tricks.map((trick) => (
            <tr key={trick.id} className="border-b">
              <td className="py-2 pr-4 font-medium">{trick.name}</td>
              <td className="py-2 pr-4 text-muted-foreground">{trick.slug}</td>
              <td className="py-2 pr-4">
                <span className={trick.is_active ? "text-green-600" : "text-red-500"}>
                  {trick.is_active ? "Yes" : "No"}
                </span>
              </td>
              <td className="py-2">
                <button
                  onClick={() => toggleActive(trick)}
                  className="text-xs text-primary hover:underline"
                >
                  {trick.is_active ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xs text-muted-foreground">{tricks.length} tricks total</p>
    </div>
  );
}

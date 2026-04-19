import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse All Tricks — TrickDB",
  description: "Alphabetical list of all tricks in TrickDB.",
};

interface Trick {
  id: string;
  name: string;
  slug: string;
}

export default async function BrowseTricksPage() {
  const supabase = await createClient();

  const { data: tricks } = await supabase
    .from("tricks")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name");

  const grouped = new Map<string, Trick[]>();
  for (const trick of tricks ?? []) {
    const letter = trick.name[0].toUpperCase();
    if (!grouped.has(letter)) grouped.set(letter, []);
    grouped.get(letter)!.push(trick);
  }

  const letters = Array.from(grouped.keys()).sort();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">All Tricks</h1>

      <div className="flex flex-wrap gap-1 mb-8">
        {letters.map((letter) => (
          <a
            key={letter}
            href={`#${letter}`}
            className="px-2 py-1 text-sm font-medium rounded hover:bg-accent transition-colors"
          >
            {letter}
          </a>
        ))}
      </div>

      <div className="space-y-8">
        {letters.map((letter) => (
          <section key={letter} id={letter}>
            <h2 className="text-lg font-semibold border-b pb-1 mb-3">
              {letter}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {grouped.get(letter)!.map((trick) => (
                <Link
                  key={trick.id}
                  href={`/tricks/${trick.slug}`}
                  className="px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                >
                  {trick.name}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

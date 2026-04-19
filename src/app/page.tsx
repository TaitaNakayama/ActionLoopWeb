import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

interface TrickCard {
  trick_id: string;
  name: string;
  slug: string;
  weekly_vote_score: number;
  weekly_upload_count: number;
}

export default async function HomePage() {
  const supabase = await createClient();

  const { data: topTricks } = await supabase
    .from("trick_weekly_scores")
    .select("*")
    .order("weekly_vote_score", { ascending: false })
    .limit(12);

  let tricks = (topTricks ?? []) as TrickCard[];

  if (tricks.every((t) => t.weekly_vote_score === 0)) {
    tricks.sort((a, b) => b.weekly_upload_count - a.weekly_upload_count);
  }

  if (tricks.length === 0) {
    const { data: allTricks } = await supabase
      .from("tricks")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("name")
      .limit(12);

    tricks = (allTricks ?? []).map((t) => ({
      trick_id: t.id,
      name: t.name,
      slug: t.slug,
      weekly_vote_score: 0,
      weekly_upload_count: 0,
    }));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3">TrickDB</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          The trick study database. Search any trick, watch community-ranked
          clips, and build your personal study list.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">
          {tricks.some((t) => t.weekly_vote_score > 0)
            ? "Top Tricks This Week"
            : "Explore Tricks"}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {tricks.map((trick) => (
            <Link
              key={trick.trick_id}
              href={`/tricks/${trick.slug}`}
              className="group rounded-lg border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all"
            >
              <div className="aspect-video bg-muted rounded-md mb-3 flex items-center justify-center">
                <span className="text-2xl text-muted-foreground/40">
                  &#9654;
                </span>
              </div>
              <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {trick.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

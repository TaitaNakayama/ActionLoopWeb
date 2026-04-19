import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ClipGrid } from "./clip-grid";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; clip?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: trick } = await supabase
    .from("tricks")
    .select("name")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!trick) return { title: "Trick Not Found — TrickDB" };

  return {
    title: `${trick.name} Study Clips — TrickDB`,
    description: `Community-ranked study clips for ${trick.name}`,
    openGraph: {
      title: `${trick.name} Study Clips — TrickDB`,
      description: `Community-ranked study clips for ${trick.name}`,
    },
  };
}

export default async function TrickPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sort = "top", clip: clipId } = await searchParams;
  const supabase = await createClient();

  const { data: trick } = await supabase
    .from("tricks")
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!trick) notFound();

  const { count } = await supabase
    .from("clip_tricks")
    .select("*", { count: "exact", head: true })
    .eq("trick_id", trick.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{trick.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {count ?? 0} clip{count !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex gap-1 mb-6">
        {(["top", "newest", "rising"] as const).map((s) => (
          <a
            key={s}
            href={`/tricks/${trick.slug}?sort=${s}`}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              sort === s
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </a>
        ))}
      </div>

      <ClipGrid
        trickId={trick.id}
        trickSlug={trick.slug}
        sort={sort}
        initialClipId={clipId}
        totalCount={count ?? 0}
      />
    </div>
  );
}

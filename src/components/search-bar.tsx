"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface TrickResult {
  id: string;
  name: string;
  slug: string;
  matched_alias?: string;
  fuzzy?: boolean;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TrickResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null!);
  const containerRef = useRef<HTMLDivElement>(null!);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const router = useRouter();

  const search = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const normalized = q.toLowerCase().trim().replace(/[-_]/g, " ").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");

    const { data: trickMatches } = await supabase
      .from("tricks")
      .select("id, name, slug")
      .eq("is_active", true)
      .ilike("normalized_name", `%${normalized}%`)
      .limit(6);

    const { data: aliasMatches } = await supabase
      .from("trick_aliases")
      .select("trick_id, alias, normalized_alias, tricks!inner(id, name, slug, is_active)")
      .eq("tricks.is_active", true)
      .ilike("normalized_alias", `%${normalized}%`)
      .limit(6);

    const seen = new Set<string>();
    const combined: TrickResult[] = [];

    for (const t of trickMatches ?? []) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        combined.push({ id: t.id, name: t.name, slug: t.slug });
      }
    }

    for (const a of aliasMatches ?? []) {
      const trick = a.tricks as unknown as { id: string; name: string; slug: string };
      if (!seen.has(trick.id)) {
        seen.add(trick.id);
        combined.push({
          id: trick.id,
          name: trick.name,
          slug: trick.slug,
          matched_alias: a.alias,
        });
      }
    }

    if (combined.length > 0) {
      setResults(combined.slice(0, 8));
      setIsOpen(true);
      setSelectedIndex(-1);
      setLoading(false);
      return;
    }

    // Fuzzy fallback
    const { data: fuzzyResults } = await supabase.rpc("search_tricks_fuzzy", {
      search_query: normalized,
      result_limit: 5,
    });

    const fuzzy: TrickResult[] = (fuzzyResults ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      fuzzy: true,
    }));

    setResults(fuzzy);
    setIsOpen(true);
    setSelectedIndex(-1);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(slug: string) {
    setQuery("");
    setIsOpen(false);
    router.push(`/tricks/${slug}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex].slug);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        type="search"
        placeholder="Search tricks..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        className="h-9"
      />

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 overflow-hidden">
          {results.length > 0 && results[0].fuzzy && (
            <div className="px-3 py-1.5 text-xs text-muted-foreground border-b">
              Did you mean?
            </div>
          )}
          {results.map((trick, i) => (
            <button
              key={trick.id}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center justify-between ${
                i === selectedIndex ? "bg-accent" : ""
              }`}
              onClick={() => handleSelect(trick.slug)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="font-medium">{trick.name}</span>
              {trick.matched_alias && (
                <span className="text-xs text-muted-foreground ml-2">
                  matched &ldquo;{trick.matched_alias}&rdquo;
                </span>
              )}
            </button>
          ))}

          {results.length === 0 && query.length > 0 && !loading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No tricks found.{" "}
              <button
                className="text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  setIsOpen(false);
                  setQuery("");
                  router.push(`/request-trick?name=${encodeURIComponent(query.trim())}`);
                }}
              >
                Request this trick
              </button>
            </div>
          )}

          {results.length > 0 && results[0].fuzzy && (
            <div className="px-3 py-2 text-xs border-t">
              <button
                className="text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  setIsOpen(false);
                  setQuery("");
                  router.push(`/request-trick?name=${encodeURIComponent(query.trim())}`);
                }}
              >
                Request &ldquo;{query.trim()}&rdquo; as a new trick
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

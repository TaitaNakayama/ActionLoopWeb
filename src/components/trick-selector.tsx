"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

interface Trick {
  id: string;
  name: string;
  slug: string;
}

interface TrickSelectorProps {
  selected: Trick[];
  onChange: (tricks: Trick[]) => void;
  max?: number;
}

export function TrickSelector({ selected, onChange, max = 3 }: TrickSelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Trick[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null!);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(async (q: string) => {
    if (q.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const supabase = createClient();
    const normalized = q.toLowerCase().trim().replace(/[-_]/g, " ").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");

    const { data: trickMatches } = await supabase
      .from("tricks")
      .select("id, name, slug")
      .eq("is_active", true)
      .ilike("normalized_name", `%${normalized}%`)
      .limit(8);

    const { data: aliasMatches } = await supabase
      .from("trick_aliases")
      .select("trick_id, tricks!inner(id, name, slug, is_active)")
      .eq("tricks.is_active", true)
      .ilike("normalized_alias", `%${normalized}%`)
      .limit(8);

    const seen = new Set(selected.map((t) => t.id));
    const combined: Trick[] = [];

    for (const t of trickMatches ?? []) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        combined.push(t);
      }
    }

    for (const a of aliasMatches ?? []) {
      const trick = a.tricks as unknown as Trick;
      if (!seen.has(trick.id)) {
        seen.add(trick.id);
        combined.push(trick);
      }
    }

    setResults(combined.slice(0, 6));
    setIsOpen(true);
    setSelectedIndex(-1);
  }, [selected]);

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

  function handleSelect(trick: Trick) {
    if (selected.length >= max) return;
    onChange([...selected, trick]);
    setQuery("");
    setIsOpen(false);
  }

  function handleRemove(trickId: string) {
    onChange(selected.filter((t) => t.id !== trickId));
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
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((trick) => (
            <Badge key={trick.id} variant="secondary" className="gap-1">
              {trick.name}
              <button
                type="button"
                onClick={() => handleRemove(trick.id)}
                className="ml-0.5 hover:text-destructive"
              >
                &times;
              </button>
            </Badge>
          ))}
        </div>
      )}

      {selected.length >= 2 && selected.length < max && (
        <p className="text-xs text-amber-600">
          Best clips focus on a single trick.
        </p>
      )}

      {selected.length < max && (
        <div className="relative">
          <Input
            type="text"
            placeholder="Search for a trick..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setIsOpen(true)}
          />

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 overflow-hidden">
              {results.map((trick, i) => (
                <button
                  key={trick.id}
                  type="button"
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-accent ${
                    i === selectedIndex ? "bg-accent" : ""
                  }`}
                  onClick={() => handleSelect(trick)}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  {trick.name}
                </button>
              ))}
              {results.length === 0 && query.length > 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No tricks found.{" "}
                  <a
                    href={`/request-trick?name=${encodeURIComponent(query.trim())}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Request this trick
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selected.length >= max && (
        <p className="text-xs text-muted-foreground">
          Maximum {max} tricks per clip.
        </p>
      )}
    </div>
  );
}

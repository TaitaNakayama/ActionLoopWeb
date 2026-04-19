-- Enable trigram extension for fuzzy search
create extension if not exists pg_trgm;

-- Fuzzy search function: returns tricks similar to query
create or replace function public.fuzzy_search_tricks(search_query text, result_limit int default 5)
returns table (
  id uuid,
  name text,
  slug text,
  similarity_score real
)
language sql stable
as $$
  select distinct on (t.id)
    t.id,
    t.name,
    t.slug,
    greatest(
      similarity(t.normalized_name, search_query),
      coalesce((
        select max(similarity(a.normalized_alias, search_query))
        from public.trick_aliases a
        where a.trick_id = t.id
      ), 0)
    ) as similarity_score
  from public.tricks t
  where t.is_active = true
    and (
      similarity(t.normalized_name, search_query) > 0.15
      or exists (
        select 1 from public.trick_aliases a
        where a.trick_id = t.id
          and similarity(a.normalized_alias, search_query) > 0.15
      )
    )
  order by t.id, similarity_score desc
$$;

-- Wrapper to sort by score (distinct on requires matching order)
create or replace function public.search_tricks_fuzzy(search_query text, result_limit int default 5)
returns table (
  id uuid,
  name text,
  slug text,
  similarity_score real
)
language sql stable
as $$
  select * from public.fuzzy_search_tricks(search_query, result_limit)
  order by similarity_score desc
  limit result_limit;
$$;

-- Allow admins to delete tricks (cascades to trick_aliases and clip_tricks via FK)
create policy "Tricks: admin delete" on public.tricks
  for delete using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

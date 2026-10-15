-- PROPOSED — NOT APPLIED. Review, then run in the Supabase SQL editor.
-- Each block is independent; apply only the ones you approve.

-- 1) One account per directory record ---------------------------------------
-- Today any member can link their account to any `cowboys` row, including one
-- another member already linked. First check for existing duplicates:
select cowboy_id, count(*) as accounts
from public.profiles
where cowboy_id is not null
group by cowboy_id
having count(*) > 1;
-- Resolve any rows returned above (keep the right account), then:
create unique index if not exists profiles_cowboy_id_unique
  on public.profiles (cowboy_id)
  where cowboy_id is not null;


-- 2) Per-field contact visibility ---------------------------------------------
-- Lets a member share their profile but hide email or phone individually.
-- Defaults preserve today's behaviour (everything shared when the profile is).
alter table public.profiles
  add column if not exists show_email boolean not null default true,
  add column if not exists show_phone boolean not null default true;


-- 3) Member-editable industry and LinkedIn ------------------------------------
-- Today both live only on the admin-managed `cowboys` roster. These columns
-- would let members keep them current; the app would prefer them when set.
alter table public.profiles
  add column if not exists industry text,
  add column if not exists linkedin text;


-- 4) Let members delete their own old avatar files ---------------------------
-- The editor uploads each new photo to avatars/<user id>/avatar-<time>.jpg and
-- tries to remove the previous file after saving. Without this policy the
-- removal is silently skipped (harmless, just leaves old files behind).
create policy "Users can delete their own avatar files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

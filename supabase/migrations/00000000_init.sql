-- ============================================================================
-- ACTBL — Consolidated initial schema
--
-- Sets up profiles, friend requests, friendships, tasks, weekly check-ins,
-- pokes, and self-service account deletion. All tables have Row Level
-- Security enabled with policies that scope access to the authenticated user
-- and (for select queries) their friends.
--
-- Apply once via the Supabase SQL Editor, or via `supabase db push`.
-- ============================================================================

-- ---- Extensions ----
create extension if not exists pgcrypto;

-- ============================================================================
-- profiles
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  friend_code text not null unique,
  expo_push_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_friend_code_idx on public.profiles (friend_code);

alter table public.profiles enable row level security;

-- RLS policies moved to end of file (after all tables created)

-- Server-side generation of a unique 6-digit friend code.
create or replace function public.generate_friend_code()
returns text
language plpgsql
as $$
declare
  candidate text;
  attempts int := 0;
begin
  loop
    candidate := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (select 1 from public.profiles where friend_code = candidate);
    attempts := attempts + 1;
    if attempts > 50 then
      raise exception 'Could not allocate a unique friend code';
    end if;
  end loop;
  return candidate;
end;
$$;

-- Auto-create a profile row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, friend_code)
  values (new.id, '', public.generate_friend_code())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Keep updated_at fresh on profile changes.
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at_trigger on public.profiles;
create trigger profiles_set_updated_at_trigger
before update on public.profiles
for each row execute function public.set_profiles_updated_at();

-- ============================================================================
-- friend_requests
-- ============================================================================

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  to_user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (from_user_id <> to_user_id)
);

-- One pending request per directed pair.
create unique index if not exists friend_requests_unique_pending
  on public.friend_requests (from_user_id, to_user_id)
  where status = 'pending';

create index if not exists friend_requests_to_status_idx
  on public.friend_requests (to_user_id, status, created_at desc);

alter table public.friend_requests enable row level security;

-- ============================================================================
-- friendships
-- ============================================================================

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_low_id uuid not null references public.profiles (id) on delete cascade,
  user_high_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_low_id, user_high_id),
  check (user_low_id < user_high_id)
);

create index if not exists friendships_user_low_idx on public.friendships (user_low_id);
create index if not exists friendships_user_high_idx on public.friendships (user_high_id);

alter table public.friendships enable row level security;

-- ============================================================================
-- RPCs: send / accept friend request
-- ============================================================================

create or replace function public.send_friend_request_by_code(target_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_id uuid := auth.uid();
  target_id uuid;
  request_id uuid;
  low_id uuid;
  high_id uuid;
begin
  if sender_id is null then
    raise exception 'Not authenticated';
  end if;

  select id into target_id
  from public.profiles
  where friend_code = target_code;

  if target_id is null then
    raise exception 'No user found with that friend code';
  end if;

  if target_id = sender_id then
    raise exception 'That is your own friend code';
  end if;

  low_id := least(sender_id, target_id);
  high_id := greatest(sender_id, target_id);

  if exists (
    select 1 from public.friendships
    where user_low_id = low_id and user_high_id = high_id
  ) then
    raise exception 'You are already friends';
  end if;

  -- If the target already sent us a pending request, auto-accept it.
  select id into request_id
  from public.friend_requests
  where from_user_id = target_id and to_user_id = sender_id and status = 'pending';

  if request_id is not null then
    update public.friend_requests
    set status = 'accepted', responded_at = now()
    where id = request_id;

    insert into public.friendships (user_low_id, user_high_id)
    values (low_id, high_id)
    on conflict do nothing;

    return request_id;
  end if;

  -- Otherwise create a new outgoing pending request.
  insert into public.friend_requests (from_user_id, to_user_id, status)
  values (sender_id, target_id, 'pending')
  on conflict (from_user_id, to_user_id) where status = 'pending' do nothing
  returning id into request_id;

  return request_id;
end;
$$;

revoke all on function public.send_friend_request_by_code(text) from public;
grant execute on function public.send_friend_request_by_code(text) to authenticated;


create or replace function public.accept_friend_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  req record;
  low_id uuid;
  high_id uuid;
begin
  if me is null then
    raise exception 'Not authenticated';
  end if;

  select * into req from public.friend_requests where id = request_id;

  if not found then
    raise exception 'Request not found';
  end if;

  if req.to_user_id <> me then
    raise exception 'Not authorized to accept this request';
  end if;

  if req.status <> 'pending' then
    raise exception 'Request is no longer pending';
  end if;

  low_id := least(req.from_user_id, req.to_user_id);
  high_id := greatest(req.from_user_id, req.to_user_id);

  update public.friend_requests
  set status = 'accepted', responded_at = now()
  where id = request_id;

  insert into public.friendships (user_low_id, user_high_id)
  values (low_id, high_id)
  on conflict do nothing;
end;
$$;

revoke all on function public.accept_friend_request(uuid) from public;
grant execute on function public.accept_friend_request(uuid) to authenticated;

-- ============================================================================
-- tasks
-- ============================================================================

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  week_start date not null,
  accountability_friend_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_owner_week_idx on public.tasks (owner_id, week_start desc);

alter table public.tasks enable row level security;

create or replace function public.set_tasks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at_trigger on public.tasks;
create trigger tasks_set_updated_at_trigger
before update on public.tasks
for each row execute function public.set_tasks_updated_at();

-- ============================================================================
-- weekly_check_ins
-- ============================================================================

create table if not exists public.weekly_check_ins (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  completed_task_ids uuid[] not null default '{}',
  missed_task_ids uuid[] not null default '{}',
  missed_reason text,
  next_week_focus text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, week_start)
);

create index if not exists weekly_check_ins_owner_week_idx
  on public.weekly_check_ins (owner_id, week_start desc);

alter table public.weekly_check_ins enable row level security;

create or replace function public.set_weekly_check_ins_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists weekly_check_ins_set_updated_at_trigger on public.weekly_check_ins;
create trigger weekly_check_ins_set_updated_at_trigger
before update on public.weekly_check_ins
for each row execute function public.set_weekly_check_ins_updated_at();

-- ============================================================================
-- pokes
-- ============================================================================

create table if not exists public.pokes (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references public.profiles (id) on delete cascade,
  recipient_user_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'on_it', 'later')),
  response_message text,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (sender_user_id <> recipient_user_id)
);

create index if not exists pokes_sender_created_idx
  on public.pokes (sender_user_id, created_at desc);

create index if not exists pokes_recipient_created_idx
  on public.pokes (recipient_user_id, created_at desc);

create index if not exists pokes_recipient_status_idx
  on public.pokes (recipient_user_id, status);

alter table public.pokes enable row level security;

create or replace function public.set_poke_responded_at()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'pending'
     and new.status in ('on_it', 'later')
     and new.responded_at is null then
    new.responded_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists pokes_set_responded_at_trigger on public.pokes;
create trigger pokes_set_responded_at_trigger
before update on public.pokes
for each row execute function public.set_poke_responded_at();

-- ============================================================================
-- delete_my_account
-- ============================================================================

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid := auth.uid();
begin
  if target_user_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.tasks
  set accountability_friend_id = null
  where accountability_friend_id = target_user_id;

  delete from public.tasks where owner_id = target_user_id;
  delete from public.weekly_check_ins where owner_id = target_user_id;
  delete from public.pokes
   where sender_user_id = target_user_id or recipient_user_id = target_user_id;
  delete from public.friend_requests
   where from_user_id = target_user_id or to_user_id = target_user_id;
  delete from public.friendships
   where user_low_id = target_user_id or user_high_id = target_user_id;
  delete from public.profiles where id = target_user_id;
  delete from auth.users where id = target_user_id;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- ============================================================================
-- RLS Policies (all tables created above)
-- ============================================================================

-- ---- profiles ----
drop policy if exists profiles_select_self_or_friend on public.profiles;
create policy profiles_select_self_or_friend
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.friendships f
    where (f.user_low_id = auth.uid() and f.user_high_id = profiles.id)
       or (f.user_high_id = auth.uid() and f.user_low_id = profiles.id)
  )
);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- ---- friend_requests ----
drop policy if exists friend_requests_select_participant on public.friend_requests;
create policy friend_requests_select_participant
on public.friend_requests
for select
to authenticated
using (from_user_id = auth.uid() or to_user_id = auth.uid());

drop policy if exists friend_requests_insert_sender on public.friend_requests;
create policy friend_requests_insert_sender
on public.friend_requests
for insert
to authenticated
with check (
  from_user_id = auth.uid()
  and from_user_id <> to_user_id
  and status = 'pending'
);

drop policy if exists friend_requests_update_recipient on public.friend_requests;
create policy friend_requests_update_recipient
on public.friend_requests
for update
to authenticated
using (to_user_id = auth.uid())
with check (
  to_user_id = auth.uid()
  and status in ('accepted', 'declined')
);

-- ---- friendships ----
drop policy if exists friendships_select_participant on public.friendships;
create policy friendships_select_participant
on public.friendships
for select
to authenticated
using (user_low_id = auth.uid() or user_high_id = auth.uid());

-- Friendships are only created via the accept_friend_request RPC, which runs
-- as security definer. No direct insert policy needed.

-- ---- tasks ----
drop policy if exists tasks_select_self_or_friend on public.tasks;
create policy tasks_select_self_or_friend
on public.tasks
for select
to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1
    from public.friendships f
    where (f.user_low_id = auth.uid() and f.user_high_id = tasks.owner_id)
       or (f.user_high_id = auth.uid() and f.user_low_id = tasks.owner_id)
  )
);

drop policy if exists tasks_insert_owner on public.tasks;
create policy tasks_insert_owner
on public.tasks
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists tasks_update_owner on public.tasks;
create policy tasks_update_owner
on public.tasks
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists tasks_delete_owner on public.tasks;
create policy tasks_delete_owner
on public.tasks
for delete
to authenticated
using (owner_id = auth.uid());

-- ---- weekly_check_ins ----
drop policy if exists weekly_check_ins_select_participant on public.weekly_check_ins;
create policy weekly_check_ins_select_participant
on public.weekly_check_ins
for select
to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1
    from public.friendships f
    where (f.user_low_id = auth.uid() and f.user_high_id = weekly_check_ins.owner_id)
       or (f.user_high_id = auth.uid() and f.user_low_id = weekly_check_ins.owner_id)
  )
);

drop policy if exists weekly_check_ins_insert_owner on public.weekly_check_ins;
create policy weekly_check_ins_insert_owner
on public.weekly_check_ins
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists weekly_check_ins_update_owner on public.weekly_check_ins;
create policy weekly_check_ins_update_owner
on public.weekly_check_ins
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- ---- pokes ----
drop policy if exists pokes_select_participant on public.pokes;
create policy pokes_select_participant
on public.pokes
for select
to authenticated
using (
  sender_user_id = auth.uid() or recipient_user_id = auth.uid()
);

drop policy if exists pokes_insert_sender on public.pokes;
create policy pokes_insert_sender
on public.pokes
for insert
to authenticated
with check (
  sender_user_id = auth.uid()
  and recipient_user_id <> auth.uid()
  and status = 'pending'
);

drop policy if exists pokes_update_recipient_response on public.pokes;
create policy pokes_update_recipient_response
on public.pokes
for update
to authenticated
using (recipient_user_id = auth.uid())
with check (
  recipient_user_id = auth.uid()
  and status in ('on_it', 'later')
);

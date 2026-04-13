-- Notifications + Pokes feature migration for ACTBL

-- Optional: store Expo push token per profile for future remote pushes
alter table public.profiles
add column if not exists expo_push_token text;

create table if not exists public.pokes (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references public.profiles(id) on delete cascade,
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
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

drop policy if exists pokes_select_participant on public.pokes;
create policy pokes_select_participant
on public.pokes
for select
to authenticated
using (
  sender_user_id = auth.uid()
  or recipient_user_id = auth.uid()
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
using (
  recipient_user_id = auth.uid()
)
with check (
  recipient_user_id = auth.uid()
  and status in ('on_it', 'later')
);

drop trigger if exists pokes_set_responded_at_trigger on public.pokes;
create or replace function public.set_poke_responded_at()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'pending' and new.status in ('on_it', 'later') and new.responded_at is null then
    new.responded_at := now();
  end if;
  return new;
end;
$$;

create trigger pokes_set_responded_at_trigger
before update on public.pokes
for each row
execute function public.set_poke_responded_at();

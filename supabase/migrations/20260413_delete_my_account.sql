-- Self-service account deletion for authenticated users.
-- Run this migration in Supabase before using the in-app Delete Account button.

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

  -- Remove references from other users' tasks before deleting profile.
  update public.tasks
  set accountability_friend_id = null
  where accountability_friend_id = target_user_id;

  delete from public.tasks
  where owner_id = target_user_id;

  delete from public.pokes
  where sender_user_id = target_user_id
    or recipient_user_id = target_user_id;

  delete from public.friend_requests
  where from_user_id = target_user_id
    or to_user_id = target_user_id;

  delete from public.friendships
  where user_low_id = target_user_id
    or user_high_id = target_user_id;

  delete from public.profiles
  where id = target_user_id;

  delete from auth.users
  where id = target_user_id;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

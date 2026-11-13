create table public.forecast_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  snapshot jsonb not null,
  constraint forecast_history_snapshot_object check (
    jsonb_typeof(snapshot) = 'object'
    and snapshot ?& array['route','date','price','dataVersion','seats','demand','sales','freeSeats','quantiles']
    and jsonb_typeof(snapshot->'quantiles') = 'array'
    and jsonb_array_length(snapshot->'quantiles') = 9
    and octet_length(snapshot::text) <= 8192
  )
);
create index forecast_history_user_created_idx on public.forecast_history (user_id, created_at desc, id desc);
alter table public.forecast_history enable row level security;
alter table public.forecast_history force row level security;
revoke all on public.forecast_history from public, anon, authenticated;
grant select, insert on public.forecast_history to authenticated;
create policy forecast_history_select_own on public.forecast_history
  for select to authenticated using ((select auth.uid()) = user_id);
create policy forecast_history_insert_own on public.forecast_history
  for insert to authenticated with check ((select auth.uid()) = user_id);

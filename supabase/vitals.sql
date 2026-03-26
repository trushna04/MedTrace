create table vitals (
  id text primary key,
  user_id uuid references auth.users on delete cascade,
  type text not null,
  value text not null,
  unit text not null,
  recorded_at timestamp with time zone,
  date text,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table vitals enable row level security;

create policy "Users manage own vitals"
  on vitals for all using (auth.uid() = user_id);

create policy "Guardian can read vitals"
  on vitals for select using (true);

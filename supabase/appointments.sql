create table appointments (
  id text primary key,
  user_id uuid references auth.users on delete cascade,
  doctor_name text not null,
  specialty text,
  date text not null,
  time text,
  location text,
  notes text,
  status text default 'upcoming',
  created_at timestamp with time zone default now()
);

alter table appointments enable row level security;

create policy "Users manage own appointments"
  on appointments for all using (auth.uid() = user_id);

create policy "Guardian can read appointments"
  on appointments for select using (true);

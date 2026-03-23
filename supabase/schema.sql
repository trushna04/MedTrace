-- Profiles table
create table profiles (
  id uuid references auth.users on delete cascade,
  name text,
  link_code text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);

-- Medicines table
create table medicines (
  id text,
  user_id uuid references auth.users on delete cascade,
  name text not null,
  dosage_mg numeric,
  frequency text,
  reminder_time text,
  pill_color text,
  start_date text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id, user_id)
);

-- Dose logs table
create table dose_logs (
  id text primary key,
  user_id uuid references auth.users on delete cascade,
  medicine_id text,
  medicine_name text,
  status text,
  taken_at text,
  date text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Row level security
alter table profiles enable row level security;
alter table medicines enable row level security;
alter table dose_logs enable row level security;

-- RLS Policies
create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Guardian can read profiles by link code"
  on profiles for select using (true);

create policy "Users manage own medicines"
  on medicines for all using (auth.uid() = user_id);

create policy "Guardian can read medicines"
  on medicines for select using (true);

create policy "Users manage own dose logs"
  on dose_logs for all using (auth.uid() = user_id);

create policy "Guardian can read dose logs"
  on dose_logs for select using (true);

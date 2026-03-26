create table lab_reports (
  id text primary key,
  user_id uuid references auth.users on delete cascade,
  title text not null,
  doctor_name text,
  report_date text,
  report_type text,
  notes text,
  file_name text,
  uploaded_at timestamp with time zone default now(),
  status text default 'uploaded',
  created_at timestamp with time zone default now()
);

alter table lab_reports enable row level security;

create policy "Users manage own reports"
  on lab_reports for all using (auth.uid() = user_id);

create policy "Guardian can read reports"
  on lab_reports for select using (true);

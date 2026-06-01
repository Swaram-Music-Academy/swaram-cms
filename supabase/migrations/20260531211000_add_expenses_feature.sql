begin;

create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  amount numeric(12, 2) not null check (amount > 0),
  expense_date date not null default current_date,
  category_id uuid not null references public.expense_categories(id) on delete restrict,
  paid_to text,
  payment_method text,
  receipt_path text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists expenses_expense_date_idx on public.expenses(expense_date desc);
create index if not exists expenses_category_id_idx on public.expenses(category_id);
create index if not exists expenses_payment_method_idx on public.expenses(payment_method);
create index if not exists expenses_created_by_idx on public.expenses(created_by);

alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "Authenticated users can view expense categories" on public.expense_categories;
create policy "Authenticated users can view expense categories"
on public.expense_categories
for select
using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can manage expense categories" on public.expense_categories;
create policy "Authenticated users can manage expense categories"
on public.expense_categories
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can manage expenses" on public.expenses;
create policy "Authenticated users can manage expenses"
on public.expenses
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

insert into public.expense_categories (name, description)
values
  ('Utilities', 'Electricity, water, internet, and other utility bills'),
  ('Building Maintenance', 'Cleaning, repairs, rent, and building maintenance checks'),
  ('Faculty Payments', 'Salary, session payments, and guest faculty payments'),
  ('Instrument Maintenance', 'Instrument repairs, tuning, parts, and purchases'),
  ('Events', 'Event venue, decoration, sound, travel, food, and related costs'),
  ('Staff / People Payments', 'Payments to staff, helpers, contractors, and other people'),
  ('Supplies', 'Stationery, printing, classroom materials, and other supplies'),
  ('Other', 'Miscellaneous expenses')
on conflict (name) do update
set
  description = excluded.description,
  is_active = true,
  updated_at = now();

create trigger trg_expense_categories_updated_at
before update on public.expense_categories
for each row execute function public.set_updated_at();

create trigger trg_expenses_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('expense-receipts', 'expense-receipts', false)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can read expense receipts" on storage.objects;
create policy "Authenticated users can read expense receipts"
on storage.objects
for select
using (bucket_id = 'expense-receipts' and auth.role() = 'authenticated');

drop policy if exists "Authenticated users can upload expense receipts" on storage.objects;
create policy "Authenticated users can upload expense receipts"
on storage.objects
for insert
with check (bucket_id = 'expense-receipts' and auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update expense receipts" on storage.objects;
create policy "Authenticated users can update expense receipts"
on storage.objects
for update
using (bucket_id = 'expense-receipts' and auth.role() = 'authenticated')
with check (bucket_id = 'expense-receipts' and auth.role() = 'authenticated');

drop policy if exists "Authenticated users can delete expense receipts" on storage.objects;
create policy "Authenticated users can delete expense receipts"
on storage.objects
for delete
using (bucket_id = 'expense-receipts' and auth.role() = 'authenticated');

commit;

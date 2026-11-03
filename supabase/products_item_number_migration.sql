alter table public.products add column if not exists item_number text;

create unique index if not exists products_item_number_unique
  on public.products (item_number);
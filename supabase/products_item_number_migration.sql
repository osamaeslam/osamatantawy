alter table public.products add column if not exists item_number text;
alter table public.products add column if not exists import_key text;

drop index if exists public.products_item_number_unique;

with keyed_products as (
  select
    id,
    lower(trim(coalesce(category, ''))) || '|' ||
      lower(trim(coalesce(name_ar, ''))) || '|' ||
      lower(regexp_replace(coalesce(image_url, ''), '[?#].*$', '')) as base_key,
    row_number() over (
      partition by
        lower(trim(coalesce(category, ''))),
        lower(trim(coalesce(name_ar, ''))),
        lower(regexp_replace(coalesce(image_url, ''), '[?#].*$', ''))
      order by id
    ) as duplicate_number
  from public.products
  where import_key is null
)
update public.products as products
set import_key = case
  when keyed_products.duplicate_number = 1 then keyed_products.base_key
  else keyed_products.base_key || '|legacy:' || products.id
end
from keyed_products
where products.id = keyed_products.id;

create unique index if not exists products_import_key_unique
  on public.products (import_key);
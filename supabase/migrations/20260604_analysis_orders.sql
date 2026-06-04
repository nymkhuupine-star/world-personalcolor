create table if not exists analysis_orders (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,
  analysis_result jsonb,
  invoice_id      text,
  transaction_id  text unique,
  amount          int  not null,
  paid            boolean not null default false,
  paid_at         timestamp with time zone,
  created_at      timestamp with time zone default now()
);

create index if not exists analysis_orders_invoice_id_idx on analysis_orders (invoice_id);
create index if not exists analysis_orders_email_idx      on analysis_orders (email);

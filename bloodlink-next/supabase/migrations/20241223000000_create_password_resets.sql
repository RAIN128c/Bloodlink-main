-- Create password_resets table
create table user_tokens (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  token text not null,
  type text not null default 'password_reset',
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Add index for faster lookups
create index idx_user_tokens_email on user_tokens(email);
create index idx_user_tokens_token on user_tokens(token);

-- Setup RLS (Even though we access this via admin client mainly, good practice)
alter table user_tokens enable row level security;

-- Only server can access this table usually, but we can add policy if needed
-- For now, we will rely on server-side admin client to read/write this table

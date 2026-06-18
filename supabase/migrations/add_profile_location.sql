-- Profile location fields (optional, collected at signup step 2)

alter table public.profiles
  add column if not exists city text,
  add column if not exists postal_code text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (
    id, email, full_name, intended_plan,
    , city, postal_code
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'intended_plan', ''),
    nullif(new.raw_user_meta_data->>'city', ''),
    nullif(new.raw_user_meta_data->>'postal_code', '')
  );
  return new;
end;
$$;

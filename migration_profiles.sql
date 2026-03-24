-- Create profiles table to link with auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  credits INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turn off RLS temporarily for simplicity in the prototype (or configure it)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Create function to automatically insert profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, tier, credits)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'user',
    'free',
    100
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- BACKFILL EXISTING USERS: Give your existing account a profile and set it to admin with 1000 credits
INSERT INTO public.profiles (id, email, full_name, role, tier, credits)
SELECT id, email, raw_user_meta_data->>'full_name', 'admin', 'pro', 1000
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.users.id
);

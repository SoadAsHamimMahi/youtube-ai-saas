-- Add last_reset_at to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMPTZ;

-- Update existing profiles to have last_reset_at equal to created_at if null
UPDATE public.profiles 
SET last_reset_at = created_at 
WHERE last_reset_at IS NULL;

-- Update the handle_new_user function to include last_reset_at
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, tier, credits, last_reset_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'user',
    'free',
    100,
    NOW()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

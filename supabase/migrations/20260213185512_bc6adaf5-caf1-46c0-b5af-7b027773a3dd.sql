
-- Create a function to set up initial admin (will be called once)
CREATE OR REPLACE FUNCTION public.setup_initial_admin(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin') ON CONFLICT DO NOTHING;
  INSERT INTO public.profiles (user_id, full_name, department, designation)
  VALUES (_user_id, 'System Admin', 'Administration', 'Admin')
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

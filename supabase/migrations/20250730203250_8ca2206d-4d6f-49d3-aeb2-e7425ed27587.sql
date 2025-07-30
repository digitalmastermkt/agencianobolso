-- Update the Digital Master user to have admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE display_name = 'Digital Master';

-- If the user doesn't exist yet, we'll create a function to set admin role for Digital Master on signup
CREATE OR REPLACE FUNCTION public.set_digital_master_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data ->> 'display_name' = 'Digital Master' OR 
     NEW.email = 'digitalmaster@example.com' THEN
    UPDATE public.profiles 
    SET role = 'admin' 
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
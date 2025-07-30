-- Fix the search path security warning for the function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
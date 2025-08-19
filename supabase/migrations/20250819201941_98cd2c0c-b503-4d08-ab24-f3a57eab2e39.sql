-- Add admin policies to profiles table
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (get_current_user_role() = 'admin');

-- Add admin policies to subscribers table  
CREATE POLICY "Admins can view all subscriptions"
ON public.subscribers
FOR SELECT
TO authenticated
USING (get_current_user_role() = 'admin');

-- Add admin policies to manage subscribers
CREATE POLICY "Admins can manage all subscriptions"
ON public.subscribers
FOR ALL
TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');
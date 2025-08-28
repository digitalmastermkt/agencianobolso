-- Fix the remaining security issue with event_registrations table
-- Remove the overly permissive admin policy and create more specific ones

-- Drop the current admin policy that allows ALL operations
DROP POLICY IF EXISTS "event_registrations_admin_modify" ON public.event_registrations;

-- Create specific policies for admins
-- Admins can INSERT (for data import/testing if needed)
CREATE POLICY "event_registrations_admin_insert" 
ON public.event_registrations 
FOR INSERT 
TO authenticated
WITH CHECK (get_current_user_role() = 'admin');

-- Admins can UPDATE (for data correction if needed)
CREATE POLICY "event_registrations_admin_update" 
ON public.event_registrations 
FOR UPDATE 
TO authenticated
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

-- Admins can DELETE (for data cleanup if needed)
CREATE POLICY "event_registrations_admin_delete" 
ON public.event_registrations 
FOR DELETE 
TO authenticated
USING (get_current_user_role() = 'admin');

-- Note: No SELECT policy for admins - all data access must go through 
-- the secure decryption functions get_decrypted_event_registrations() 
-- and get_decrypted_event_registration() which have proper audit logging

-- Also ensure the no_direct_access policy is properly restrictive
DROP POLICY IF EXISTS "event_registrations_no_direct_access" ON public.event_registrations;

CREATE POLICY "event_registrations_no_direct_select" 
ON public.event_registrations 
FOR SELECT 
TO authenticated
USING (false); -- No direct SELECT access - must use decryption functions
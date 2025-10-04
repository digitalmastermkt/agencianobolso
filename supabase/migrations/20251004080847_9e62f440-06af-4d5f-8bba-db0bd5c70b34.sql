-- PHASE 1: Fix Critical Privilege Escalation Vulnerability
-- This migration fixes the ability for users to self-promote to admin

-- Step 1: Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Step 2: Create secure user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Step 4: RLS policies for user_roles (only admins can modify roles)
CREATE POLICY "Anyone can view roles"
  ON public.user_roles FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Step 5: Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role::public.app_role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 6: Update all RLS policies to use has_role instead of get_current_user_role

-- Update profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Update subscribers policies
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscribers;

CREATE POLICY "Admins can manage all subscriptions"
  ON public.subscribers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update security_audit_log policies
DROP POLICY IF EXISTS "security_audit_admin_only" ON public.security_audit_log;

CREATE POLICY "security_audit_admin_only"
  ON public.security_audit_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Update auth_attempts policies
DROP POLICY IF EXISTS "auth_attempts_admin_only" ON public.auth_attempts;

CREATE POLICY "auth_attempts_admin_only"
  ON public.auth_attempts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Update data_access_audit policies
DROP POLICY IF EXISTS "audit_logs_admin_only" ON public.data_access_audit;

CREATE POLICY "audit_logs_admin_only"
  ON public.data_access_audit FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Update event_registration_rate_limit policies
DROP POLICY IF EXISTS "rate_limit_admin_only" ON public.event_registration_rate_limit;

CREATE POLICY "rate_limit_admin_only"
  ON public.event_registration_rate_limit FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Update form_submission_rate_limit policies
DROP POLICY IF EXISTS "form_rate_limit_admin_only" ON public.form_submission_rate_limit;

CREATE POLICY "form_rate_limit_admin_only"
  ON public.form_submission_rate_limit FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Update modules policies
DROP POLICY IF EXISTS "Admins can manage all modules" ON public.modules;

CREATE POLICY "Admins can manage all modules"
  ON public.modules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Modules are viewable by enrolled users" ON public.modules;

CREATE POLICY "Modules are viewable by enrolled users"
  ON public.modules FOR SELECT
  USING (
    is_published = true AND (
      EXISTS (
        SELECT 1 FROM user_enrollments
        WHERE user_id = auth.uid() AND course_id = modules.course_id
      ) OR public.has_role(auth.uid(), 'admin')
    )
  );

-- Update lessons policies
DROP POLICY IF EXISTS "Admins can manage all lessons" ON public.lessons;
DROP POLICY IF EXISTS "Lessons are viewable by enrolled users" ON public.lessons;

CREATE POLICY "Admins can manage all lessons"
  ON public.lessons FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Lessons are viewable by enrolled users"
  ON public.lessons FOR SELECT
  USING (
    is_published = true AND (
      EXISTS (
        SELECT 1 FROM user_enrollments ue
        JOIN modules m ON m.course_id = ue.course_id
        WHERE ue.user_id = auth.uid() AND m.id = lessons.module_id
      ) OR public.has_role(auth.uid(), 'admin')
    )
  );

-- Update user_notifications policies
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.user_notifications;

CREATE POLICY "Admins can manage all notifications"
  ON public.user_notifications FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Update plan_agents_access policies
DROP POLICY IF EXISTS "admins manage plan_agents_access" ON public.plan_agents_access;

CREATE POLICY "admins manage plan_agents_access"
  ON public.plan_agents_access FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update plan_courses_access policies
DROP POLICY IF EXISTS "admins manage plan_courses_access" ON public.plan_courses_access;

CREATE POLICY "admins manage plan_courses_access"
  ON public.plan_courses_access FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update plan_settings policies
DROP POLICY IF EXISTS "admins manage plan_settings" ON public.plan_settings;

CREATE POLICY "admins manage plan_settings"
  ON public.plan_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update stripe_price_config policies
DROP POLICY IF EXISTS "admins_manage_stripe_config" ON public.stripe_price_config;

CREATE POLICY "admins_manage_stripe_config"
  ON public.stripe_price_config FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update trainings policies
DROP POLICY IF EXISTS "Admins can manage all trainings" ON public.trainings;

CREATE POLICY "Admins can manage all trainings"
  ON public.trainings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Update courses policies
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;

CREATE POLICY "Admins can manage all courses"
  ON public.courses FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Update prompts policies
DROP POLICY IF EXISTS "Admins can manage all prompts" ON public.prompts;

CREATE POLICY "Admins can manage all prompts"
  ON public.prompts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Update event_registrations policies
DROP POLICY IF EXISTS "event_registrations_admin_delete" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_insert" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_update" ON public.event_registrations;

CREATE POLICY "event_registrations_admin_delete"
  ON public.event_registrations FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "event_registrations_admin_insert"
  ON public.event_registrations FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "event_registrations_admin_update"
  ON public.event_registrations FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update user_credits_usage policies
DROP POLICY IF EXISTS "Admins can manage all credit usage" ON public.user_credits_usage;

CREATE POLICY "Admins can manage all credit usage"
  ON public.user_credits_usage FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Step 7: Update get_current_user_role to use new user_roles table
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'moderator' THEN 2
      WHEN 'user' THEN 3
    END
  LIMIT 1
$$;

-- Step 8: Update trigger for new users to set default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  
  -- Insert default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Step 9: Add comment to profiles.role for deprecation notice
COMMENT ON COLUMN public.profiles.role IS 'DEPRECATED: Use user_roles table instead. This column is kept for backward compatibility only.';
-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create modules table
CREATE TABLE public.modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Enable RLS on modules  
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for courses
CREATE POLICY "Published courses are viewable by everyone" 
ON public.courses 
FOR SELECT 
USING ((is_published = true) OR (created_by = auth.uid()));

CREATE POLICY "Admins can manage all courses" 
ON public.courses 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Create RLS policies for modules
CREATE POLICY "Modules are viewable by enrolled users" 
ON public.modules 
FOR SELECT 
USING ((is_published = true) AND ((EXISTS ( 
  SELECT 1 FROM user_enrollments 
  WHERE user_enrollments.user_id = auth.uid() 
  AND user_enrollments.course_id = modules.course_id
)) OR (get_current_user_role() = 'admin')));

CREATE POLICY "Admins can manage all modules" 
ON public.modules 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Add module_id to lessons table and remove training_id
ALTER TABLE public.lessons 
ADD COLUMN module_id UUID;

-- Update user_enrollments to reference courses instead of trainings
ALTER TABLE public.user_enrollments 
ADD COLUMN course_id UUID;

-- Create foreign key constraints
ALTER TABLE public.modules 
ADD CONSTRAINT modules_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.lessons 
ADD CONSTRAINT lessons_module_id_fkey 
FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;

ALTER TABLE public.user_enrollments 
ADD CONSTRAINT user_enrollments_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

-- Update lessons RLS policy
DROP POLICY IF EXISTS "Lessons are viewable by enrolled users" ON public.lessons;
CREATE POLICY "Lessons are viewable by enrolled users" 
ON public.lessons 
FOR SELECT 
USING ((is_published = true) AND ((EXISTS ( 
  SELECT 1 FROM user_enrollments ue 
  JOIN modules m ON m.course_id = ue.course_id 
  WHERE ue.user_id = auth.uid() 
  AND m.id = lessons.module_id
)) OR (get_current_user_role() = 'admin')));

-- Update user_enrollments RLS policies
DROP POLICY IF EXISTS "Users can create their own enrollments" ON public.user_enrollments;
CREATE POLICY "Users can create their own enrollments" 
ON public.user_enrollments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_modules_updated_at
BEFORE UPDATE ON public.modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
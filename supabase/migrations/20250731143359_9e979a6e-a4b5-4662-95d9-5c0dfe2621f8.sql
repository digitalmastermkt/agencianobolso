-- Add module_id to lessons table
ALTER TABLE public.lessons 
ADD COLUMN module_id UUID;

-- Add foreign key constraint for lessons
ALTER TABLE public.lessons 
ADD CONSTRAINT lessons_module_id_fkey 
FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;

-- Add course_id to user_enrollments table
ALTER TABLE public.user_enrollments 
ADD COLUMN course_id UUID;

-- Add foreign key constraint for user_enrollments
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

-- Add policy for modules to be viewable by enrolled users
CREATE POLICY "Modules are viewable by enrolled users" 
ON public.modules 
FOR SELECT 
USING ((is_published = true) AND ((EXISTS ( 
  SELECT 1 FROM user_enrollments 
  WHERE user_enrollments.user_id = auth.uid() 
  AND user_enrollments.course_id = modules.course_id
)) OR (get_current_user_role() = 'admin')));
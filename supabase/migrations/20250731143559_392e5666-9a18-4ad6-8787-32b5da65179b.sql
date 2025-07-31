-- Make training_id nullable in lessons table since we're moving to module_id
ALTER TABLE public.lessons 
ALTER COLUMN training_id DROP NOT NULL;
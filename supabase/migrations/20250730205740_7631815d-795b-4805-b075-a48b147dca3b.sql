-- Create storage bucket for training thumbnails
INSERT INTO storage.buckets (id, name, public) VALUES ('training-thumbnails', 'training-thumbnails', true);

-- Create policies for training thumbnails
CREATE POLICY "Training thumbnails are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'training-thumbnails');

CREATE POLICY "Admins can upload training thumbnails" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'training-thumbnails' AND (get_current_user_role() = 'admin'));

CREATE POLICY "Admins can update training thumbnails" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'training-thumbnails' AND (get_current_user_role() = 'admin'));

CREATE POLICY "Admins can delete training thumbnails" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'training-thumbnails' AND (get_current_user_role() = 'admin'));

-- Add video_url field to trainings table
ALTER TABLE public.trainings 
ADD COLUMN video_url TEXT;
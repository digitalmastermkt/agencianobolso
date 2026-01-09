-- Create storage bucket for generated creatives
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-creatives', 'generated-creatives', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for generated-creatives bucket
-- Allow authenticated users to upload their own creatives
CREATE POLICY "Users can upload their own creatives"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'generated-creatives' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own creatives
CREATE POLICY "Users can view their own creatives"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'generated-creatives' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to creatives (they're public images)
CREATE POLICY "Public read access to creatives"
ON storage.objects
FOR SELECT
USING (bucket_id = 'generated-creatives');

-- Allow users to delete their own creatives
CREATE POLICY "Users can delete their own creatives"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'generated-creatives' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
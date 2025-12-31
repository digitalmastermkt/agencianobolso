-- Create storage bucket for generated creatives
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-creatives', 'generated-creatives', true);

-- Public read access for generated creatives
CREATE POLICY "Generated creatives are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'generated-creatives');

-- Service role can manage generated creatives
CREATE POLICY "Service role can upload generated creatives"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'generated-creatives' AND auth.role() = 'service_role');

CREATE POLICY "Service role can update generated creatives"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'generated-creatives' AND auth.role() = 'service_role');

CREATE POLICY "Service role can delete generated creatives"
ON storage.objects
FOR DELETE
USING (bucket_id = 'generated-creatives' AND auth.role() = 'service_role');

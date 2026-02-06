
-- Add manual_override column to subscribers table
-- When true, the check-subscription function will use the stored tier instead of checking Stripe
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS manual_override boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.subscribers.manual_override IS 'When true, subscription tier is manually set by admin and should not be overwritten by Stripe check';

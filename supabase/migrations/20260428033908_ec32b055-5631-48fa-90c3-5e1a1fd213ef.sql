-- Drop PII columns
ALTER TABLE public.sessions DROP COLUMN IF EXISTS first_name;
ALTER TABLE public.sessions DROP COLUMN IF EXISTS phone;
ALTER TABLE public.sessions DROP COLUMN IF EXISTS email;
ALTER TABLE public.sessions DROP COLUMN IF EXISTS consent;

-- Add new columns
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS photos jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS layout text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS output_url text;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (public kiosk)
CREATE POLICY "public read photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

CREATE POLICY "public upload photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'photos');

CREATE POLICY "public update photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'photos');
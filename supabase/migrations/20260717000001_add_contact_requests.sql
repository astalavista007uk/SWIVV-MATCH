-- Create contact_requests table for the Contact Us form
CREATE TABLE IF NOT EXISTS public.contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  town TEXT,
  country TEXT,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  attachment_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert (for logged-in users)
CREATE POLICY "contact_requests_insert_public"
  ON public.contact_requests FOR INSERT
  WITH CHECK (true);

-- Only admins can view
CREATE POLICY "contact_requests_select_admin"
  ON public.contact_requests FOR SELECT
  USING (auth.role() = 'service_role');

-- Create contact-attachments storage bucket (public uploads, admin read)
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('contact-attachments', 'contact-attachments', false, false, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload attachments
CREATE POLICY "contact_attachments_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'contact-attachments'
    AND auth.role() = 'authenticated'
  );

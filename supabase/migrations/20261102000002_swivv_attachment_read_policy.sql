-- Read access for document attachments: the private-bucket policy only matched
-- audio_url/image_url, so PDF/TXT rows (file_url) were unreadable by the recipient.
-- Not applied automatically.

drop policy if exists "Swivv voice participant read" on storage.objects;
create policy "Swivv voice participant read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'swivv-voice'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.is_staff()
      or exists (
        select 1 from public.swivv_chats c
        where c.user_id = auth.uid()
          and (
            strpos(c.audio_url, name) > 0
            or strpos(c.image_url, name) > 0
            or strpos(c.file_url, name) > 0
          )
      )
    )
  );

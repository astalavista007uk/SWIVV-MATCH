-- The admin e-mail journal lives in swivv_email_log (user ids + provider errors).
-- Staff-only read, no writes from the browser; the service_role keeps full access.
grant select on public.swivv_email_log to authenticated;

drop policy if exists swivv_email_log_staff_read on public.swivv_email_log;
create policy swivv_email_log_staff_read on public.swivv_email_log
  for select to authenticated
  using (public.staff_level() >= 50);

-- Critical alerts notify admins regardless of who triggers them (client role may
-- not read user_roles). Trigger is SECURITY DEFINER: reads roster, writes in-app
-- notifications. Delivery = the notification row (in-app only, no e-mail channel).

CREATE OR REPLACE FUNCTION public.swivv_alert_notify_admins()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.severity = 'critical' AND (TG_OP = 'INSERT' OR OLD.severity IS DISTINCT FROM 'critical') THEN
    INSERT INTO public.swivv_notifications (user_id, type, title, message)
    SELECT ur.user_id, 'admin', 'Alerte critique', LEFT(NEW.title, 300)
    FROM public.user_roles ur WHERE ur.role IN ('admin', 'super_admin');
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS swivv_alert_notify ON public.swivv_admin_alerts;
CREATE TRIGGER swivv_alert_notify
  AFTER INSERT OR UPDATE ON public.swivv_admin_alerts
  FOR EACH ROW EXECUTE FUNCTION public.swivv_alert_notify_admins();

-- Staff roster readable by staff (assignment dropdowns across reports/verification/
-- support/alerts). Role grants stay super-admin-only (existing write policy).
CREATE POLICY swivv_roles_staff_read ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_staff());

# SWIVV MATCH Web Push

Web Push delivers every row inserted into `public.swivv_notifications` to all devices subscribed for that member. The browser permission is per device: enable it once on desktop and once on the phone. On iPhone/iPad, install SWIVV MATCH from Safari with **Share → Add to Home Screen**, open the installed app, and then enable push in **Notifications**.

## One-time server setup

1. Generate a VAPID key pair on a trusted machine with `npx web-push generate-vapid-keys --json`. Keep the private key out of Git and out of client-side environment variables.
2. Link the Supabase CLI to the production project and deploy the function:

   ```sh
   supabase functions deploy swivv-push --no-verify-jwt
   ```

3. Generate a random webhook secret with `openssl rand -hex 32`. Set the function secrets, using the generated VAPID pair and the same webhook secret:

   ```sh
   supabase secrets set \
     VAPID_PUBLIC_KEY="<public-key>" \
     VAPID_PRIVATE_KEY="<private-key>" \
     VAPID_SUBJECT="mailto:contact@swivvmatch.com" \
     SWIVV_PUSH_WEBHOOK_SECRET="<webhook-secret>"
   ```

4. Apply `supabase db push`. In the Supabase SQL editor, store the function URL and the same webhook secret in Vault:

   ```sql
   select vault.create_secret(
     'https://<project-ref>.supabase.co/functions/v1/swivv-push',
     'swivv_push_function_url'
   );
   select vault.create_secret('<webhook-secret>', 'swivv_push_webhook_secret');
   ```

5. Add `VITE_VAPID_PUBLIC_KEY=<public-key>` to the environment used to build the web app, then deploy with the existing `bun run deploy` flow. The public key is safe in the browser bundle; only the private key belongs in Supabase Function secrets.

The database trigger reads the URL and webhook secret from Vault. If either is missing, notification writes continue normally and push delivery is skipped. The Edge Function reads all subscriptions for the notification recipient, sends a privacy-preserving push, and removes subscriptions that the push service reports as expired.

## Test

Sign into the same account on desktop and phone. In **Notifications → Notifications push**, choose **Activer sur cet appareil** on each device and allow the browser prompt. Press **Envoyer une notification test** on either device. The test notification should appear on every subscribed device, including when SWIVV MATCH is closed. Browser or operating-system notification settings can still suppress a notification after delivery.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MODERATION_EMAIL, swivvContactReceived } from "@/lib/swivv-email-templates";
import { sendEmail } from "@/lib/email";

// ponytail: one server call creates the ticket + first message + best-effort confirmation (admin client bypasses RLS so logged-out visitors land in the same admin inbox) — the visitor's uid rides along for linkage only, format-checked not ownership-checked; add a contact@ copy if staff need the ticket by e-mail too
export const submitContactTicket = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({
      name: z.string().min(1).max(100),
      email: z.string().email().max(200),
      subject: z.string().min(1).max(200),
      message: z.string().min(1).max(2000),
      fileNames: z.array(z.string().max(200)).max(3).optional(),
      userId: z.string().uuid().nullable().optional(),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: t, error } = await supabaseAdmin
      .from("swivv_support_tickets")
      .insert({ user_id: data.userId ?? null, subject: `[Site] ${data.subject}`, category: "other" })
      .select("id")
      .single();
    const tid = (t as { id: string } | null)?.id;
    if (error || !tid) {
      console.error("[contact] ticket insert failed", error?.message ?? "no-id");
      return { ok: false as const };
    }
    const first = data.name.trim().split(/\s+/)[0] ?? data.name.trim();
    await supabaseAdmin.from("swivv_support_messages").insert({
      ticket_id: tid,
      author_id: data.userId ?? null,
      is_staff: false,
      body: `${data.message.trim()}\n\n— ${data.name.trim()} (${data.email.trim()})${data.fileNames?.length ? `\nFichiers annoncés (à réclamer par e-mail) : ${data.fileNames.join(", ")}` : ""}`,
    });
    const { subject, html } = swivvContactReceived({ name: first, subject: data.subject, message: data.message.trim(), fileNames: data.fileNames });
    const r = await sendEmail({ to: data.email, subject, html });
    if (!r.ok) console.error("[contact] confirmation email failed", r.error);
    const esc = (s: string) =>
      s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
    const n = await sendEmail({
      to: process.env.CONTACT_NOTIFY_EMAIL || MODERATION_EMAIL,
      replyTo: data.email.trim(),
      subject: `[Contact] ${data.subject.trim()} - ${data.name.trim()}`,
      html: `<h2>Nouveau message via le formulaire de contact</h2>
<p><b>Ticket :</b> ${tid}<br><b>Nom :</b> ${esc(data.name.trim())}<br><b>E-mail :</b> ${esc(data.email.trim())}<br><b>Sujet :</b> ${esc(data.subject.trim())}</p>
<pre style="white-space:pre-wrap;font-family:inherit;font-size:14px">${esc(data.message.trim())}</pre>${
        data.fileNames?.length ? `<p><b>Fichiers annonces (a reclamer par e-mail) :</b> ${esc(data.fileNames.join(", "))}</p>` : ""
      }
<p style="color:#6b6b73;font-size:12px">Reponds a cet e-mail : il part directement a l'expediteur.</p>`,
    });
    if (!n.ok) console.error("[contact] admin notification failed", n.error);
    return { ok: true as const };
  });

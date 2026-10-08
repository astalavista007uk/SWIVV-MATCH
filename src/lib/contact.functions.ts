import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { buildContactConfirmationEmailHtml } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";

// ponytail: no auth middleware — the contact form is public; self-mail only (to = the visitor's own address), so there's no relay value; rate-limit when abused
export const sendContactConfirmation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({
      firstName: z.string().min(1).max(100),
      email: z.string().email().max(200),
      subject: z.string().min(1).max(200),
      message: z.string().min(1).max(5000),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    const html = buildContactConfirmationEmailHtml({
      firstName: data.firstName,
      subject: data.subject,
      message: data.message,
    });
    const ok = await sendEmail({ to: data.email, subject: "We received your message — PET BASE", html });
    return { ok };
  });

import { createClient } from "@supabase/supabase-js";
import { SERVICE_KEY, SUPABASE_URL } from "./env";

export const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findAuthUser(email: string) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);
    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < 1000) break;
  }
  return null;
}

export async function confirmUserByEmail(email: string) {
  const user = await findAuthUser(email);
  if (!user) throw new Error(`No auth user for ${email}`);
  const { error } = await admin.auth.admin.updateUserById(user.id, { email_confirm: true });
  if (error) throw new Error(error.message);
  return user.id;
}

export async function deleteUserByEmail(email: string) {
  const user = await findAuthUser(email);
  if (!user) return false;
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) throw new Error(error.message);
  return true;
}

export async function findContactByToken(token: string) {
  const { data: messages, error } = await admin
    .from("swivv_support_messages")
    .select("ticket_id,body")
    .ilike("body", `%${token}%`)
    .limit(10);
  if (error) throw new Error(error.message);
  const ids = [...new Set((messages ?? []).map((m) => m.ticket_id))];
  if (!ids.length) return null;
  const { data: tickets, error: ticketErr } = await admin
    .from("swivv_support_tickets")
    .select("id,subject,created_at")
    .in("id", ids)
    .order("created_at", { ascending: false })
    .limit(1);
  if (ticketErr) throw new Error(ticketErr.message);
  const ticket = tickets?.[0];
  if (!ticket) return null;
  return { ticket, message: (messages ?? []).find((m) => m.ticket_id === ticket.id) };
}

export async function cleanupContactByToken(token: string) {
  const found = await findContactByToken(token);
  if (!found) return;
  await admin.from("swivv_support_messages").delete().eq("ticket_id", found.ticket.id);
  await admin.from("swivv_support_tickets").delete().eq("id", found.ticket.id);
}

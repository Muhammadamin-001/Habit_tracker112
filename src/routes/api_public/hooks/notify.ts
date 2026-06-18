// Cron endpoint — pg_cron orqali chaqiriladi.
// Daily reminder (9:00 Tashkent): bugun rejada bo'lgan kunlik vazifalar uchun hisobot bermagan foydalanuvchilarga eslatma.
// Late alert (har soat): kunlik vazifalar uchun report_due_at o'tib ketgan + hisobot yo'q.
// Overdue (har soat): deadline_at o'tib ketgan deadline/onetime vazifalar.

import { createFileRoute } from "@tanstack/react-router";

const GATEWAY = "https://connector-gateway.lovable.dev/telegram";

async function tgSend(chatId: number, text: string) {
  const res = await fetch(`${GATEWAY}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": process.env.TELEGRAM_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  if (!res.ok) console.error("tgSend", res.status, await res.text());
}

const WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function todayTashkent(): { date: string; weekday: string; hour: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tashkent", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", hour12: false, weekday: "short",
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const map: Record<string, string> = { Sun: "sun", Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat" };
  return { date, weekday: map[parts.weekday] ?? WEEK[new Date().getUTCDay()], hour: Number(parts.hour) };
}

export const Route = createFileRoute("/api/public/hooks/notify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // apikey verification (Supabase publishable key)
        const apikey = request.headers.get("apikey");
        if (apikey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Unauthorized", { status: 401 });
        }

        const body = (await request.json().catch(() => ({}))) as { kind?: string };
        const kind = body.kind ?? "all";

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { date: today, weekday, hour } = todayTashkent();

        const results: Record<string, number> = {};

        // ---- DAILY REMINDERS ----
        if (kind === "daily" || kind === "all") {
          const { data: tasks } = await supabaseAdmin
            .from("tasks")
            .select("id,user_id,title,week_days,daily_target_amount,daily_target_unit")
            .eq("task_type", "daily")
            .eq("status", "active")
            .eq("archived", false);

          let sent = 0;
          for (const t of tasks ?? []) {
            const days = (t.week_days ?? []) as string[];
            if (days.length > 0 && !days.includes(weekday)) continue;

            const { data: prog } = await supabaseAdmin
              .from("task_progress").select("id")
              .eq("task_id", t.id).eq("report_date", today).maybeSingle();
            if (prog) continue;

            const { data: prof } = await supabaseAdmin
              .from("profiles").select("telegram_id").eq("id", t.user_id).maybeSingle();
            if (!prof?.telegram_id) continue;

            // dedup: bugun bu task uchun report-reminder yuborilganmi?
            const { data: existing } = await supabaseAdmin
              .from("notifications").select("id")
              .eq("user_id", t.user_id).eq("type", "report-reminder")
              .gte("created_at", `${today}T00:00:00+05:00`)
              .contains("payload", { task_id: t.id } as never).maybeSingle();
            if (existing) continue;

            const target = t.daily_target_amount ? ` (maqsad: ${t.daily_target_amount} ${t.daily_target_unit ?? ""})` : "";
            await tgSend(Number(prof.telegram_id),
              `⏰ <b>Bugungi vazifa:</b>\n${t.title}${target}\n\nWeb ilovada hisobot kiriting.`);
            await supabaseAdmin.from("notifications").insert({
              user_id: t.user_id, type: "report-reminder", sent_via: "telegram",
              title: "Kunlik eslatma", body: t.title, payload: { task_id: t.id, date: today },
            });
            sent++;
          }
          results.daily_reminders = sent;
        }

        // ---- LATE ALERTS (kunlik, report_due_at o'tgan, hisobot yo'q) ----
        if (kind === "late" || kind === "all") {
          const nowIso = new Date().toISOString();
          const { data: tasks } = await supabaseAdmin
            .from("tasks")
            .select("id,user_id,title,report_due_at")
            .eq("task_type", "daily").eq("status", "active").eq("archived", false)
            .not("report_due_at", "is", null).lt("report_due_at", nowIso);

          let sent = 0;
          for (const t of tasks ?? []) {
            const { data: prog } = await supabaseAdmin
              .from("task_progress").select("id")
              .eq("task_id", t.id).eq("report_date", today).maybeSingle();
            if (prog) continue;

            const { data: existing } = await supabaseAdmin
              .from("notifications").select("id")
              .eq("user_id", t.user_id).eq("type", "late-alert")
              .gte("created_at", `${today}T00:00:00+05:00`)
              .contains("payload", { task_id: t.id } as never).maybeSingle();
            if (existing) continue;

            const { data: prof } = await supabaseAdmin
              .from("profiles").select("telegram_id").eq("id", t.user_id).maybeSingle();
            if (!prof?.telegram_id) continue;

            await tgSend(Number(prof.telegram_id),
              `⚠️ <b>Kechikish:</b>\n${t.title}\n\nHisobot muddati o'tdi.`);
            await supabaseAdmin.from("notifications").insert({
              user_id: t.user_id, type: "late-alert", sent_via: "telegram",
              title: "Kechikish", body: t.title, payload: { task_id: t.id, date: today },
            });
            sent++;
          }
          results.late_alerts = sent;
        }

        // ---- OVERDUE (deadline/onetime) ----
        if (kind === "overdue" || kind === "all") {
          const nowIso = new Date().toISOString();
          const { data: tasks } = await supabaseAdmin
            .from("tasks")
            .select("id,user_id,title,deadline_at,task_type")
            .in("task_type", ["deadline", "onetime"])
            .eq("status", "active").eq("archived", false)
            .not("deadline_at", "is", null).lt("deadline_at", nowIso);

          let sent = 0;
          for (const t of tasks ?? []) {
            const { data: existing } = await supabaseAdmin
              .from("notifications").select("id")
              .eq("user_id", t.user_id).eq("type", "onetime-overdue")
              .contains("payload", { task_id: t.id } as never).maybeSingle();
            if (existing) continue;

            const { data: prof } = await supabaseAdmin
              .from("profiles").select("telegram_id").eq("id", t.user_id).maybeSingle();
            if (!prof?.telegram_id) continue;

            await tgSend(Number(prof.telegram_id),
              `🔴 <b>Muddat o'tdi:</b>\n${t.title}\n\nDeadline: ${new Date(t.deadline_at!).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" })}`);
            await supabaseAdmin.from("notifications").insert({
              user_id: t.user_id, type: "onetime-overdue", sent_via: "telegram",
              title: "Muddat o'tdi", body: t.title, payload: { task_id: t.id },
            });
            // mark task as overdue
            await supabaseAdmin.from("tasks").update({ status: "overdue" }).eq("id", t.id);
            sent++;
          }
          results.overdue = sent;
        }

        return Response.json({ ok: true, hour, weekday, today, results });
      },
    },
  },
});

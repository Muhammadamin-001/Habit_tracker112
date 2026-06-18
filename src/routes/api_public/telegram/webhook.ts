// Telegram webhook endpoint.
// Foydalanuvchi botda /start yuboradi -> telefon raqami so'raladi.
// Web tomondan generatsiya qilingan KOD ni /link KOD orqali yuboradi -> profil bog'lanadi.
//
// Webhook ro'yxatdan o'tkazish (sandbox terminalda, TELEGRAM connector ulangandan keyin):
//   TELEGRAM_WEBHOOK_SECRET=$(node -e "console.log(require('crypto').createHash('sha256').update('telegram-webhook:'+process.env.TELEGRAM_API_KEY).digest('base64url'))")
//   curl -sS 'https://connector-gateway.lovable.dev/telegram/setWebhook' \
//     -H "Authorization: Bearer $LOVABLE_API_KEY" \
//     -H "X-Connection-Api-Key: $TELEGRAM_API_KEY" \
//     -H 'Content-Type: application/json' \
//     -d "{\"url\":\"https://project--ujihwjdglekwgepxssqb-dev.lovable.app/api/public/telegram/webhook\",\"secret_token\":\"$TELEGRAM_WEBHOOK_SECRET\",\"allowed_updates\":[\"message\"]}"

import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";

const GATEWAY = "https://connector-gateway.lovable.dev/telegram";

function deriveSecret(apiKey: string) {
  return createHash("sha256").update(`telegram-webhook:${apiKey}`).digest("base64url");
}
function safeEqual(a: string, b: string) {
  const A = Buffer.from(a); const B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}

async function tgSend(chatId: number, text: string, extra: Record<string, unknown> = {}) {
  const res = await fetch(`${GATEWAY}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": process.env.TELEGRAM_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
  if (!res.ok) console.error("tgSend failed", res.status, await res.text());
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY;
        if (!TELEGRAM_API_KEY) return new Response("Telegram not configured", { status: 500 });

        const expected = deriveSecret(TELEGRAM_API_KEY);
        const actual = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (!safeEqual(actual, expected)) return new Response("Unauthorized", { status: 401 });

        const update = await request.json();
        const message = update.message;
        if (!message?.chat?.id || typeof update.update_id !== "number") {
          return Response.json({ ok: true, ignored: true });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // dedup store
        await supabaseAdmin.from("telegram_messages").upsert({
          update_id: update.update_id,
          chat_id: message.chat.id,
          tg_user_id: message.from?.id ?? null,
          text: message.text ?? null,
          raw_update: update,
        }, { onConflict: "update_id" });

        const chatId = message.chat.id as number;
        const text = (message.text ?? "").trim();
        const tgUserId = message.from?.id as number | undefined;

        // /start
        if (text === "/start") {
          await tgSend(chatId,
            "👋 Salom! Task Manager botiga xush kelibsiz.\n\n" +
            "1️⃣ Web ilovaga kiring va Dashboard'dan <b>bog'lash kodi</b> oling.\n" +
            "2️⃣ Bu yerga <code>/link KOD</code> yuboring.\n\n" +
            "Shundan keyin botdan eslatma olasiz va hisobot topshira olasiz.");
          return Response.json({ ok: true });
        }

        // /link CODE
        if (text.startsWith("/link ")) {
          const code = text.substring(6).trim().toUpperCase();
          const { data: link } = await supabaseAdmin
            .from("telegram_link_codes")
            .select("user_id, expires_at, consumed_at")
            .eq("code", code)
            .maybeSingle();

          if (!link) { await tgSend(chatId, "❌ Kod topilmadi."); return Response.json({ ok: true }); }
          if (link.consumed_at) { await tgSend(chatId, "❌ Kod allaqachon ishlatilgan."); return Response.json({ ok: true }); }
          if (new Date(link.expires_at) < new Date()) { await tgSend(chatId, "❌ Kod muddati o'tgan."); return Response.json({ ok: true }); }

          await supabaseAdmin.from("profiles").update({
            telegram_id: tgUserId,
            first_name: message.from?.first_name ?? null,
            last_name: message.from?.last_name ?? null,
            username: message.from?.username ?? null,
          }).eq("id", link.user_id);

          await supabaseAdmin.from("telegram_link_codes")
            .update({ consumed_at: new Date().toISOString() })
            .eq("code", code);

          await tgSend(chatId, "✅ Hisobingiz muvaffaqiyatli bog'landi! Endi bildirishnomalar shu yerga keladi.");
          return Response.json({ ok: true });
        }

        // /help
        if (text === "/help") {
          await tgSend(chatId, "Buyruqlar:\n<code>/start</code> — boshlash\n<code>/link KOD</code> — web hisob bilan bog'lash\n<code>/help</code> — yordam");
          return Response.json({ ok: true });
        }

        await tgSend(chatId, "Tushunmadim. <code>/help</code> yuboring.");
        return Response.json({ ok: true });
      },
    },
  },
});

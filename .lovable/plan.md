## Loyiha haqida

Sizning planingiz **Next.js 15 + Supabase + Vercel** stekida yozilgan. Lovable platformasi **TanStack Start + Lovable Cloud (Supabase asosida) + Cloudflare Workers** stekida ishlaydi. Yaxshi xabar: **biznes-mantiq, ma'lumotlar tuzilmasi, Telegram bot va PostgreSQL** to'liq portativ — faqat:

- `app/api/.../route.ts` → `src/routes/api/.../*.ts` (TanStack server routes)
- Server Actions → `createServerFn` (TanStack)
- Next.js middleware (auth) → `_authenticated` layout (Lovable Cloud)
- Vercel Cron → `pg_cron` (Supabase ichida)
- Drizzle ORM → Supabase JS client + migration SQL (Lovable Cloud-da Drizzle ham mumkin, lekin standart yo'l — to'g'ridan-to'g'ri Supabase)

Telegram bot **webhook rejimida** ishlaydi (polling Cloudflare Workers'da ishlamaydi) — bu sizning planda ham shunday.

Loyiha **juda katta** (1358 qatorlik spec, ~8 ta yirik modul: auth, tasks 3 turi, sections, daily reports, weekly/monthly analytics, anonymous comparison, Telegram bot, admin panel). Bitta turda hammasini qurib bo'lmaydi — bosqichlarga ajratdim.

---

## Bosqich 1 — Poydevor (HOZIR quramiz)

1. **Lovable Cloud** ni yoqish (PostgreSQL + Auth + secrets).
2. **Telegram connector** ni ulash (siz uchun `TELEGRAM_API_KEY` avtomatik keladi, bot tokeningiz kerak emas).
3. **DB schema** — barcha enum'lar va asosiy jadvallar:
   - `profiles` (Supabase `auth.users`ga bog'liq, telegram_id, settings, timezone)
   - `user_roles` + `has_role()` (xavfsizlik uchun alohida jadval)
   - `sections` (standart 7 ta seed + custom)
   - `tasks` (3 turi: `daily` / `deadline` / `onetime`, `taskType` + `sectionId`)
   - `task_progress` (kunlik bajarilish foizi)
   - `daily_reports`, `notifications`, `telegram_messages` (webhook updates)
   - RLS policies + GRANT'lar
4. **Telegram webhook endpoint** — `/api/public/telegram/webhook` (signature verification, `/start` orqali ro'yxatdan o'tish, telefon raqam so'rash, profil yaratish, web app linkini yuborish).
5. **Auth oqimi** — Telegram orqali ro'yxatdan o'tgan foydalanuvchi web app'ga email/parol bilan kiradi (yoki magic link — Telegram'dan deep link). MVP uchun: email/parol auth + Telegram'da bog'lanish.
6. **Asosiy UI shell** — `/` (landing), `/auth`, `/_authenticated/dashboard` (vazifalar ro'yxati skeleti).

## Bosqich 2 — Vazifalar CRUD (keyingi turda)
3 ta task type uchun forma + ro'yxat + kunlik progress kiritish + bo'lim filtri.

## Bosqich 3 — Hisobotlar va cron
`pg_cron` orqali kunlik eslatma, kechikish ogohlantirish, haftalik hisobot. Telegram orqali yuborish.

## Bosqich 4 — Analitika + anonim taqqoslash
Recharts grafiklar, haftalik/oylik tahlil, `MIN_COMPARE_SAMPLE_SIZE=5` bilan anonim taqqoslash.

## Bosqich 5 — Admin panel + eksport
Admin role, foydalanuvchilarni boshqarish, PDF/Excel eksport (Supabase Storage).

---

## Texnik tafsilotlar (Bosqich 1)

- **Stek**: TanStack Start 1.x + React 19 + Tailwind v4 + shadcn/ui + Lovable Cloud (Supabase) + Cloudflare Workers.
- **Drizzle o'rniga**: SQL migration fayli (`supabase/migrations/...sql`) — schema bir xil mantiqda yoziladi, faqat `pgTable(...)` o'rniga sof SQL.
- **Server fn'lar** `src/lib/*.functions.ts` ichida (route loader'dan emas, component'dan `useServerFn` orqali chaqiriladi).
- **Telegram bot tokeni**: connector orqali keladi (`TELEGRAM_API_KEY` — Lovable gateway connection key, asl bot tokeningiz emas). Webhook secret — token'dan `sha256` orqali derivatsiya qilinadi.
- **Vaqt zonasi**: barcha vaqtlar `timestamptz`, taqqoslashlar `Asia/Tashkent`.

---

## Sizdan tasdiq kerak

1. **Boshlab yuboraymi?** Bosqich 1 dan boshlasam — bir nechta turda Bosqich 1 to'liq ishga tushadi (Cloud yoqish, schema migration, webhook endpoint, auth shell, dashboard skeleti).
2. **Telegram bot tokeningiz** bormi? Bo'lmasa @BotFather'dan oling — connectorni ulaganingizda so'raydi.
3. **Auth**: Email/parol + Telegram bog'lanish bilan ketaymi, yoki sof Telegram-only (deep link orqali magic kirish)? Email/parol — soddaroq va ishonchli.

Tasdiqlasangiz, darhol Bosqich 1 ni quraman.
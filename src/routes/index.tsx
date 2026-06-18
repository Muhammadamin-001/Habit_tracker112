import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Zap, Send, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Task Manager — Telegram bot bilan vazifalarni boshqaring" },
      { name: "description", content: "Kunlik, Muddatli va Bir martalik vazifalarni boshqaring. Telegram bot orqali hisobot toping va eslatma oling." },
      { property: "og:title", content: "Task Manager — Telegram + Web" },
      { property: "og:description", content: "Vazifalarni 3 turga ajratib boshqaring, kunlik hisobot va anonim taqqoslash." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">📋 Task Manager</h1>
          <Link to="/auth"><Button>Boshlash</Button></Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold tracking-tight">Vazifalaringizni 3 turga ajratib boshqaring</h2>
        <p className="mt-6 text-lg text-muted-foreground">
          Kunlik odatlar, deadline'li loyihalar va bir martalik topshiriqlar — bitta tizimda.
          Telegram bot orqali eslatma oling, hisobot topshiring va o'sishingizni tahlil qiling.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link to="/auth"><Button size="lg">Bepul boshlash</Button></Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-6">
        <Feature icon={<CalendarDays />} title="Kunlik vazifalar" desc="Har kuni yoki tanlangan kunlarda bajariladigan odatlar. Foiz bilan kuzating." />
        <Feature icon={<Clock />} title="Muddatli vazifalar" desc="Aniq deadline'li loyihalar. Kunlik progress va kechikish ogohlantirish." />
        <Feature icon={<Zap />} title="Bir martalik" desc="Eslatma vaqti va hisobot muddati bilan bir marta bajariladigan vazifa." />
        <Feature icon={<Send />} title="Telegram bot" desc="Bot orqali ro'yxatdan o'ting, eslatma oling va hisobot topshiring." />
        <Feature icon={<BarChart3 />} title="Tahlil" desc="Haftalik/oylik hisobot, bo'lim bo'yicha statistika, anonim taqqoslash." />
        <Feature icon={<span>🇺🇿</span>} title="O'zbek tilida" desc="To'liq o'zbek tilida interfeys. Asia/Tashkent vaqt zonasi." />
      </section>

      <footer className="border-t mt-20">
        <div className="max-w-6xl mx-auto p-6 text-sm text-muted-foreground text-center">
          © 2026 Task Manager
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-6 border rounded-lg">
      <div className="size-12 rounded bg-primary/10 text-primary flex items-center justify-center mb-4">{icon}</div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2">{desc}</p>
    </div>
  );
}

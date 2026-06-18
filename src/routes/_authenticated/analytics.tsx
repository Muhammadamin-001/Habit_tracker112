import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Users } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend,
} from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Tahlil — Task Manager" }] }),
  component: Analytics,
});

interface DailyPoint { date: string; percent: number }
interface SectionPoint { name: string; percent: number; color?: string }
interface Comparison { user_avg: number; global_avg: number | null; sample_size: number }

function Analytics() {
  const [daily, setDaily] = useState<DailyPoint[]>([]);
  const [bySection, setBySection] = useState<SectionPoint[]>([]);
  const [cmp, setCmp] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return;
      const from = new Date(); from.setDate(from.getDate() - 6);
      const fromStr = from.toISOString().slice(0, 10);

      const [{ data: progress }, { data: sections }, { data: tasks }, { data: cmpData }] = await Promise.all([
        supabase.from("task_progress").select("report_date,percent,task_id").eq("user_id", userRes.user.id).gte("report_date", fromStr),
        supabase.from("sections").select("id,name,color").eq("user_id", userRes.user.id),
        supabase.from("tasks").select("id,section_id").eq("user_id", userRes.user.id),
        supabase.rpc("get_anonymous_comparison", { _days: 7 }),
      ]);

      // Daily aggregation
      const dayMap = new Map<string, { sum: number; n: number }>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        dayMap.set(d.toISOString().slice(0, 10), { sum: 0, n: 0 });
      }
      (progress ?? []).forEach((p: { report_date: string; percent: number }) => {
        const k = p.report_date;
        const cur = dayMap.get(k);
        if (cur) { cur.sum += Number(p.percent ?? 0); cur.n++; }
      });
      setDaily(Array.from(dayMap, ([date, v]) => ({
        date: date.slice(5),
        percent: v.n ? Math.round(v.sum / v.n) : 0,
      })));

      // Per section
      const taskToSection = new Map((tasks ?? []).filter((t): t is { id: string; section_id: string } => !!t.section_id).map((t) => [t.id, t.section_id]));
      const sectionAgg = new Map<string, { sum: number; n: number }>();
      (progress ?? []).forEach((p: { task_id: string; percent: number }) => {
        const sid = taskToSection.get(p.task_id);
        if (!sid) return;
        const cur = sectionAgg.get(sid) ?? { sum: 0, n: 0 };
        cur.sum += Number(p.percent ?? 0); cur.n++;
        sectionAgg.set(sid, cur);
      });
      setBySection((sections ?? []).map((s: { id: string; name: string; color: string | null }) => {
        const v = sectionAgg.get(s.id);
        return { name: s.name, percent: v && v.n ? Math.round(v.sum / v.n) : 0, color: s.color ?? "#6366f1" };
      }));

      if (cmpData && cmpData[0]) {
        setCmp({
          user_avg: Math.round(Number(cmpData[0].user_avg ?? 0)),
          global_avg: cmpData[0].global_avg == null ? null : Math.round(Number(cmpData[0].global_avg)),
          sample_size: cmpData[0].sample_size ?? 0,
        });
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto p-4 flex items-center gap-3">
          <Button asChild variant="ghost" size="sm"><Link to="/dashboard"><ArrowLeft className="size-4" /> Dashboard</Link></Button>
          <h1 className="text-xl font-semibold">Tahlil (7 kun)</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="size-5" /> Kunlik bajarilish %</CardTitle>
            <CardDescription>Oxirgi 7 kunlik o'rtacha foiz</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? <div className="text-muted-foreground">Yuklanmoqda…</div> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Line type="monotone" dataKey="percent" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bo'limlar bo'yicha</CardTitle>
            <CardDescription>Har bir bo'limning o'rtacha foizi</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? <div className="text-muted-foreground">Yuklanmoqda…</div> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="percent" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="size-5" /> Anonim taqqoslash</CardTitle>
            <CardDescription>Sizning natijangiz vs barcha foydalanuvchilar o'rtachasi (kamida 5 ta foydalanuvchi bo'lganda ko'rinadi)</CardDescription>
          </CardHeader>
          <CardContent>
            {!cmp ? <div className="text-muted-foreground">Yuklanmoqda…</div> : (
              <div className="grid sm:grid-cols-3 gap-4">
                <Stat label="Siz" value={`${cmp.user_avg}%`} />
                <Stat label="O'rtacha (anonim)" value={cmp.global_avg == null ? "—" : `${cmp.global_avg}%`} hint={cmp.global_avg == null ? `Kamida 5 foydalanuvchi kerak (hozir: ${cmp.sample_size})` : `${cmp.sample_size} foydalanuvchi`} />
                <Stat label="Farq" value={cmp.global_avg == null ? "—" : `${cmp.user_avg - cmp.global_avg > 0 ? "+" : ""}${cmp.user_avg - cmp.global_avg}%`} />
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

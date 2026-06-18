import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Zap, LogOut, Link2 } from "lucide-react";
import { toast } from "sonner";
import { TaskFormDialog } from "@/components/tasks/TaskFormDialog";
import { TaskList } from "@/components/tasks/TaskList";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Task Manager" }] }),
  component: Dashboard,
});

interface Section { id: string; name: string; color: string | null; standard_key: string | null }

function Dashboard() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [counts, setCounts] = useState({ daily: 0, deadline: 0, onetime: 0 });

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      setEmail(userRes.user?.email ?? null);
      const { data: secs } = await supabase.from("sections").select("id,name,color,standard_key").order("sort_order");
      setSections(secs ?? []);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tasks").select("task_type").eq("archived", false);
      const c = { daily: 0, deadline: 0, onetime: 0 };
      (data ?? []).forEach((t: { task_type: string }) => { c[t.task_type as keyof typeof c]++; });
      setCounts(c);
    })();
  }, [refreshKey]);

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); };

  const generateLinkCode = async () => {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) return;
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const { error } = await supabase.from("telegram_link_codes").insert({ code, user_id: userRes.user.id, expires_at: expiresAt });
    if (error) return toast.error(error.message);
    setLinkCode(code);
    toast.success("Kod yaratildi!");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto p-4 flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">Task Manager</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{email}</span>
            <Button asChild variant="outline" size="sm"><Link to="/analytics">Tahlil</Link></Button>
            <Button variant="outline" size="sm" onClick={signOut}><LogOut className="size-4" /> Chiqish</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Link2 className="size-5" /> Telegram bilan bog'lash</CardTitle>
            <CardDescription>Bot orqali bildirishnoma olish va hisobot topshirish uchun.</CardDescription>
          </CardHeader>
          <CardContent>
            {linkCode ? (
              <div className="font-mono text-2xl bg-muted px-4 py-2 rounded inline-block">{linkCode}</div>
            ) : (
              <Button onClick={generateLinkCode}>Bog'lash kodini olish</Button>
            )}
            <p className="text-sm text-muted-foreground mt-2">Telegram botda: <code className="bg-muted px-1">/link KOD</code></p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <TypeCard icon={<CalendarDays />} title="Kunlik" count={counts.daily} desc="Har kuni bajariladi" />
          <TypeCard icon={<Clock />} title="Muddatli" count={counts.deadline} desc="Deadline'i bor" />
          <TypeCard icon={<Zap />} title="Bir martalik" count={counts.onetime} desc="Bir marta" />
        </div>

        <Card>
          <CardHeader><CardTitle>Bo'limlar ({sections.length})</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <Badge key={s.id} variant="outline" style={{ borderColor: s.color ?? undefined, color: s.color ?? undefined }}>{s.name}</Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Vazifalar</CardTitle>
              <CardDescription>Yangi qo'shing, hisobot kiriting, holatni boshqaring.</CardDescription>
            </div>
            <TaskFormDialog sections={sections} onCreated={() => setRefreshKey((k) => k + 1)} />
          </CardHeader>
          <CardContent>
            <TaskList sections={sections} refreshKey={refreshKey} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function TypeCard({ icon, title, count, desc }: { icon: React.ReactNode; title: string; count: number; desc: string }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <div className="size-10 rounded bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="text-xs">{desc}</CardDescription>
        </div>
      </CardHeader>
      <CardContent><div className="text-3xl font-bold">{count}</div></CardContent>
    </Card>
  );
}

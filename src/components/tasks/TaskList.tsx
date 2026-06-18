import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Check, Pause, Play } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

interface Task {
  id: string; title: string; description: string | null;
  task_type: "daily" | "deadline" | "onetime"; status: string;
  section_id: string | null; deadline_at: string | null;
  daily_target_amount: number | null; daily_target_unit: string | null;
}
interface Section { id: string; name: string; color: string | null }

export function TaskList({ sections, refreshKey }: { sections: Section[]; refreshKey: number }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select("id,title,description,task_type,status,section_id,deadline_at,daily_target_amount,daily_target_unit")
      .eq("archived", false)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setTasks((data ?? []) as Task[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [refreshKey]);

  const visible = filter === "all" ? tasks : tasks.filter((t) => t.task_type === filter || t.section_id === filter);

  const archive = async (id: string) => {
    const { error } = await supabase.from("tasks").update({ archived: true }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("O'chirildi"); load();
  };
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("tasks").update({ status: status as "active" | "paused" | "completed" }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const sectionMap = Object.fromEntries(sections.map((s) => [s.id, s]));

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center flex-wrap">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hammasi</SelectItem>
            <SelectItem value="daily">Kunlik</SelectItem>
            <SelectItem value="deadline">Muddatli</SelectItem>
            <SelectItem value="onetime">Bir martalik</SelectItem>
            {sections.map((s) => <SelectItem key={s.id} value={s.id}>📁 {s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{visible.length} ta</span>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Yuklanmoqda...</p> :
        visible.length === 0 ? <p className="text-sm text-muted-foreground">Vazifa yo'q.</p> :
        <ul className="space-y-2">
          {visible.map((t) => {
            const sec = t.section_id ? sectionMap[t.section_id] : null;
            return (
              <li key={t.id}>
                <Card>
                  <CardContent className="p-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium ${t.status === "completed" ? "line-through opacity-60" : ""}`}>{t.title}</span>
                        <Badge variant="outline">{t.task_type}</Badge>
                        {sec && <Badge variant="outline" style={{ borderColor: sec.color ?? undefined, color: sec.color ?? undefined }}>{sec.name}</Badge>}
                        {t.status !== "active" && <Badge>{t.status}</Badge>}
                      </div>
                      {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description}</p>}
                      {t.task_type === "daily" && t.daily_target_amount && (
                        <p className="text-xs text-muted-foreground mt-1">Maqsad: {t.daily_target_amount} {t.daily_target_unit ?? ""}</p>
                      )}
                      {t.task_type === "deadline" && t.deadline_at && (
                        <p className="text-xs text-muted-foreground mt-1">Deadline: {new Date(t.deadline_at).toLocaleString()}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {t.task_type === "daily" && t.status === "active" && (
                        <ProgressDialog task={t} onSaved={load} />
                      )}
                      {(t.task_type === "onetime" || t.task_type === "deadline") && t.status !== "completed" && (
                        <Button size="icon" variant="ghost" onClick={() => setStatus(t.id, "completed")} title="Yakunlash">
                          <Check className="size-4" />
                        </Button>
                      )}
                      {t.status === "active" ? (
                        <Button size="icon" variant="ghost" onClick={() => setStatus(t.id, "paused")} title="To'xtatish"><Pause className="size-4" /></Button>
                      ) : t.status === "paused" ? (
                        <Button size="icon" variant="ghost" onClick={() => setStatus(t.id, "active")} title="Davom etish"><Play className="size-4" /></Button>
                      ) : null}
                      <Button size="icon" variant="ghost" onClick={() => archive(t.id)} title="O'chirish"><Trash2 className="size-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      }
    </div>
  );
}

function ProgressDialog({ task, onSaved }: { task: Task; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [doneAmount, setDoneAmount] = useState("");
  const [percent, setPercent] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const today = new Date().toISOString().slice(0, 10);
    const done = doneAmount ? Number(doneAmount) : 0;
    let pct = percent ? Number(percent) : 0;
    if (!percent && task.daily_target_amount && done) {
      pct = Math.min(100, (done / Number(task.daily_target_amount)) * 100);
    }
    const { error } = await supabase.from("task_progress").upsert({
      user_id: u.user.id, task_id: task.id, report_date: today,
      done_amount: done, percent: pct, note: note || null, reported_via: "web",
    } as never, { onConflict: "task_id,report_date" });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Saqlandi"); setOpen(false); setDoneAmount(""); setPercent(""); setNote(""); onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Hisobot</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Bugungi hisobot: {task.title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {task.daily_target_amount && (
            <div>
              <label className="text-sm">Bajarildi ({task.daily_target_unit ?? ""}) / maqsad: {task.daily_target_amount}</label>
              <Input type="number" value={doneAmount} onChange={(e) => setDoneAmount(e.target.value)} />
            </div>
          )}
          <div>
            <label className="text-sm">Foiz (0-100)</label>
            <Input type="number" min={0} max={100} value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="Avtomatik hisoblanadi" />
          </div>
          <div>
            <label className="text-sm">Izoh</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Bekor</Button>
          <Button onClick={save} disabled={loading}>{loading ? "..." : "Saqlash"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

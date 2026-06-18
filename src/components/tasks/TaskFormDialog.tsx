import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

type TaskType = "daily" | "deadline" | "onetime";
const WEEK_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

interface Section { id: string; name: string }

export function TaskFormDialog({ sections, onCreated }: { sections: Section[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<TaskType>("daily");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sectionId, setSectionId] = useState<string>("");
  const [weekDays, setWeekDays] = useState<string[]>([...WEEK_DAYS]);
  const [dailyTargetAmount, setDailyTargetAmount] = useState("");
  const [dailyTargetUnit, setDailyTargetUnit] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [totalTargetAmount, setTotalTargetAmount] = useState("");

  const reset = () => {
    setTitle(""); setDescription(""); setSectionId(""); setType("daily");
    setWeekDays([...WEEK_DAYS]); setDailyTargetAmount(""); setDailyTargetUnit("");
    setDeadlineAt(""); setTotalTargetAmount("");
  };

  const toggleDay = (d: string) =>
    setWeekDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const submit = async () => {
    if (!title.trim()) return toast.error("Sarlavha kerak");
    if (type === "deadline" && !deadlineAt) return toast.error("Deadline sana kerak");
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return toast.error("Avtorizatsiya yo'q"); }

    const payload: Record<string, unknown> = {
      user_id: u.user.id,
      title: title.trim(),
      description: description.trim() || null,
      task_type: type,
      section_id: sectionId || null,
      status: "active",
    };
    if (type === "daily") {
      payload.week_days = weekDays;
      payload.daily_target_amount = dailyTargetAmount ? Number(dailyTargetAmount) : null;
      payload.daily_target_unit = dailyTargetUnit || null;
    }
    if (type === "deadline") {
      payload.deadline_at = new Date(deadlineAt).toISOString();
      payload.total_target_amount = totalTargetAmount ? Number(totalTargetAmount) : null;
    }

    const { error } = await supabase.from("tasks").insert(payload as never);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Vazifa qo'shildi");
    setOpen(false); reset(); onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="size-4" /> Yangi vazifa</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Yangi vazifa</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tur</Label>
            <Select value={type} onValueChange={(v) => setType(v as TaskType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Kunlik</SelectItem>
                <SelectItem value="deadline">Muddatli</SelectItem>
                <SelectItem value="onetime">Bir martalik</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sarlavha</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Tavsif (ixtiyoriy)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Bo'lim</Label>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger><SelectValue placeholder="Tanlang" /></SelectTrigger>
              <SelectContent>
                {sections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {type === "daily" && (
            <>
              <div>
                <Label>Hafta kunlari</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {WEEK_DAYS.map((d) => (
                    <button key={d} type="button" onClick={() => toggleDay(d)}
                      className={`px-3 py-1 rounded text-xs border ${weekDays.includes(d) ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Kunlik miqdor</Label><Input type="number" value={dailyTargetAmount} onChange={(e) => setDailyTargetAmount(e.target.value)} placeholder="masalan 30" /></div>
                <div><Label>O'lchov</Label><Input value={dailyTargetUnit} onChange={(e) => setDailyTargetUnit(e.target.value)} placeholder="daqiqa, bet..." /></div>
              </div>
            </>
          )}

          {type === "deadline" && (
            <>
              <div><Label>Deadline</Label><Input type="datetime-local" value={deadlineAt} onChange={(e) => setDeadlineAt(e.target.value)} /></div>
              <div><Label>Umumiy miqdor (ixtiyoriy)</Label><Input type="number" value={totalTargetAmount} onChange={(e) => setTotalTargetAmount(e.target.value)} /></div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Bekor qilish</Button>
          <Button onClick={submit} disabled={loading}>{loading ? "Saqlanmoqda..." : "Saqlash"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Plus, X, Briefcase, BookOpen, GraduationCap, Dumbbell, Heart, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSaveBlock, useSaveHabit, useSaveLearningGoal, useSaveCourse } from "@/hooks/use-local-data";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { Block, Habit, LearningGoal, Course } from "@/lib/schema";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type ActivityType = "work" | "learning" | "studies" | "gym" | "habits" | "free";

const ACTIVITY_TYPES: { type: ActivityType; label: string; icon: any; color: string; desc: string }[] = [
  { type: "work", label: "Work Shift", icon: Briefcase, color: "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20", desc: "Schedule a work block" },
  { type: "learning", label: "Learning Goal", icon: BookOpen, color: "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20", desc: "Add a skill to learn" },
  { type: "studies", label: "Study Session", icon: GraduationCap, color: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20", desc: "Schedule study time" },
  { type: "gym", label: "Gym Session", icon: Dumbbell, color: "bg-success/10 text-success border-success/20 hover:bg-success/20", desc: "Add workout block" },
  { type: "habits", label: "Habit", icon: Heart, color: "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20", desc: "Build a daily habit" },
  { type: "free", label: "Fun Activity", icon: Coffee, color: "bg-muted text-muted-foreground border-border hover:bg-muted/80", desc: "Add free time activity" },
];

function BlockForm({ type, onSave, onCancel }: { type: ActivityType; onSave: (b: Block) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [days, setDays] = useState<number[]>([new Date().getDay()]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const toggleDay = (d: number) => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const handleSave = () => {
    if (!title.trim() || days.length === 0) return;
    days.forEach(day => {
      onSave({ id: uuidv4(), title: title.trim(), type, dayOfWeek: day, startTime, endTime });
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1 block">Title</label>
        <input
          autoFocus
          className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={type === "work" ? "Deep Work" : type === "gym" ? "Push Day" : "e.g. Python Study"}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSave()}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">Days</label>
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map((d, i) => (
            <button
              key={d}
              onClick={() => toggleDay(i)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                days.includes(i) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/50"
              )}
            >{d.slice(0, 3)}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Start Time</label>
          <input type="time" className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={startTime} onChange={e => setStartTime(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">End Time</label>
          <input type="time" className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={endTime} onChange={e => setEndTime(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button className="flex-1" onClick={handleSave} disabled={!title.trim() || days.length === 0}>
          Add {days.length > 1 ? `(${days.length} days)` : ""}
        </Button>
        <Button variant="outline" onClick={onCancel}>Back</Button>
      </div>
    </div>
  );
}

function HabitForm({ onSave, onCancel }: { onSave: (h: Habit) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekdays" | "weekends">("daily");
  const [duration, setDuration] = useState(30);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1 block">Habit Name</label>
        <input autoFocus className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Morning Meditation" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">Frequency</label>
        <div className="flex gap-2">
          {(["daily", "weekdays", "weekends"] as const).map(f => (
            <button key={f} onClick={() => setFrequency(f)} className={cn("flex-1 py-2 px-3 rounded-md text-xs font-medium border capitalize transition-colors", frequency === f ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/50")}>{f}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1 block">Duration (minutes)</label>
        <input type="number" min="1" max="240" className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={duration} onChange={e => setDuration(Number(e.target.value))} />
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => name.trim() && onSave({ id: uuidv4(), name: name.trim(), frequency, durationMinutes: duration, streak: 0, history: {} })} disabled={!name.trim()}>Add Habit</Button>
        <Button variant="outline" onClick={onCancel}>Back</Button>
      </div>
    </div>
  );
}

function LearningForm({ onSave, onCancel }: { onSave: (g: LearningGoal) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [hours, setHours] = useState(3);
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1 block">Goal Name</label>
        <input autoFocus className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Python, Guitar, Spanish" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Level</label>
          <select className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={level} onChange={e => setLevel(e.target.value as any)}>
            <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Priority</label>
          <select className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={priority} onChange={e => setPriority(e.target.value as any)}>
            <option>High</option><option>Medium</option><option>Low</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-1 block">Target hrs/week</label>
        <input type="number" min="1" max="40" className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={hours} onChange={e => setHours(Number(e.target.value))} />
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => name.trim() && onSave({ id: uuidv4(), name: name.trim(), level, targetHoursPerWeek: hours, priority, hoursLogged: 0 })} disabled={!name.trim()}>Add Goal</Button>
        <Button variant="outline" onClick={onCancel}>Back</Button>
      </div>
    </div>
  );
}

export default function QuickAdd({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ActivityType | "habit" | "learning" | null>(null);
  const saveBlock = useSaveBlock();
  const saveHabit = useSaveHabit();
  const saveGoal = useSaveLearningGoal();
  const { toast } = useToast();

  const close = () => { setOpen(false); setSelected(null); };

  const handleBlockSave = async (b: Block) => {
    await saveBlock.mutateAsync(b);
    toast({ title: `✅ ${b.title} added!`, description: `${b.type} block saved to your schedule.` });
    close();
  };

  const handleHabitSave = async (h: Habit) => {
    await saveHabit.mutateAsync(h);
    toast({ title: `✅ Habit added!`, description: `"${h.name}" added to your daily habits.` });
    close();
  };

  const handleGoalSave = async (g: LearningGoal) => {
    await saveGoal.mutateAsync(g);
    toast({ title: `✅ Goal added!`, description: `"${g.name}" added to Learning.` });
    close();
  };

  const getTypeForBlock = (s: typeof selected): ActivityType => {
    if (s === "habit" || s === "learning") return "free";
    return s as ActivityType;
  };

  return (
    <>
      <button
        className={cn("bg-primary hover:bg-primary/90 text-primary-foreground h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-50", className)}
        onClick={() => setOpen(true)}
        title="Quick Add"
      >
        <Plus className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
              <h2 className="font-bold text-lg">
                {selected ? `Add ${ACTIVITY_TYPES.find(a => a.type === selected)?.label || (selected === "habit" ? "Habit" : "Learning Goal")}` : "Quick Add"}
              </h2>
              <Button size="icon" variant="ghost" onClick={close}><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-4">
              {!selected && (
                <div className="grid grid-cols-2 gap-3">
                  {ACTIVITY_TYPES.map(({ type, label, icon: Icon, color, desc }) => (
                    <button
                      key={type}
                      onClick={() => setSelected(type === "habits" ? "habit" : type === "learning" ? "learning" : type)}
                      className={cn("flex flex-col items-start p-4 rounded-lg border text-left transition-colors", color)}
                    >
                      <Icon className="h-5 w-5 mb-2" />
                      <span className="font-semibold text-sm">{label}</span>
                      <span className="text-xs opacity-70 mt-0.5">{desc}</span>
                    </button>
                  ))}
                </div>
              )}
              {selected === "habit" && (
                <HabitForm onSave={handleHabitSave} onCancel={() => setSelected(null)} />
              )}
              {selected === "learning" && (
                <LearningForm onSave={handleGoalSave} onCancel={() => setSelected(null)} />
              )}
              {selected && selected !== "habit" && selected !== "learning" && (
                <BlockForm type={selected} onSave={handleBlockSave} onCancel={() => setSelected(null)} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

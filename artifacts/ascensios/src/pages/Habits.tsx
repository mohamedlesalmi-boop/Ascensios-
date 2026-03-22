import { useState, useEffect } from "react";
import { useHabits, useToggleHabit, useSaveHabit, useDeleteHabit, useSettings } from "@/hooks/use-local-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Check, Flame, Trophy, Trash2, Bell, BellOff, X } from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { Habit } from "@/lib/schema";
import { requestNotificationPermission } from "@/lib/notifications";

function AddHabitModal({ onClose, onSave }: { onClose: () => void; onSave: (h: Habit) => void }) {
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekdays" | "weekends">("daily");
  const [duration, setDuration] = useState(30);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-lg">New Habit</h2>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Habit Name</label>
            <input autoFocus className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Morning Meditation" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && name.trim() && onSave({ id: uuidv4(), name: name.trim(), frequency, durationMinutes: duration, streak: 0, history: {} })} />
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
            <Button className="flex-1" disabled={!name.trim()} onClick={() => name.trim() && onSave({ id: uuidv4(), name: name.trim(), frequency, durationMinutes: duration, streak: 0, history: {} })}>Add Habit</Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Habits() {
  const { data: habits = [] } = useHabits();
  const { data: settings } = useSettings();
  const toggleHabit = useToggleHabit();
  const saveHabit = useSaveHabit();
  const deleteHabit = useDeleteHabit();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [notifGranted, setNotifGranted] = useState(Notification.permission === "granted");

  const today = new Date();
  const dateStr = format(today, 'yyyy-MM-dd');
  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    return { date: d, str: format(d, 'yyyy-MM-dd'), dayName: format(d, 'EE') };
  });

  const handleAddHabit = async (h: Habit) => {
    await saveHabit.mutateAsync(h);
    toast({ title: `✅ "${h.name}" habit added!` });
    setShowAdd(false);
  };

  const handleDelete = async (id: string, name: string) => {
    await deleteHabit.mutateAsync(id);
    toast({ title: `Removed "${name}"` });
  };

  const handleRequestNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
    if (granted) {
      toast({ title: "✅ Notifications enabled!", description: "You'll be notified before activities start." });
      // Show a test notification
      setTimeout(() => {
        try {
          new Notification("🔔 Ascensios Notifications Active", {
            body: "You'll get reminders before your activities start.",
            icon: "/favicon.svg",
          });
        } catch {}
      }, 500);
    } else {
      toast({ title: "Permission denied", description: "Allow notifications in your browser settings.", variant: "destructive" });
    }
  };

  const completedToday = habits.filter(h => !!h.history[dateStr]).length;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Discipline</h1>
          <p className="text-muted-foreground">Build consistency, master yourself</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className={cn("gap-2 text-sm", notifGranted && "border-success/50 text-success")}
            onClick={handleRequestNotifications}
            title={notifGranted ? "Notifications active" : "Enable activity notifications"}
          >
            {notifGranted ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            {notifGranted ? "Notifs On" : "Enable Notifs"}
          </Button>
          <Button className="gap-2" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> New Habit
          </Button>
        </div>
      </div>

      {/* Today summary */}
      {habits.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border">
          <div className={cn("text-2xl font-bold tabular-nums", completedToday === habits.length ? "text-success" : "text-foreground")}>
            {completedToday}/{habits.length}
          </div>
          <div>
            <p className="font-medium text-sm">habits completed today</p>
            <div className="flex gap-1 mt-1">
              {habits.map(h => (
                <div key={h.id} className={cn("h-2 flex-1 rounded-full max-w-8 transition-colors", !!h.history[dateStr] ? "bg-success" : "bg-muted")} />
              ))}
            </div>
          </div>
          {completedToday === habits.length && <span className="ml-auto text-lg">🎉</span>}
        </div>
      )}

      {habits.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Flame className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No habits yet</p>
          <p className="text-sm mt-1">Add your first habit to start building streaks</p>
          <Button className="mt-4 gap-2" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Add First Habit</Button>
        </div>
      )}

      <div className="grid gap-3">
        {habits.map((habit) => {
          const isDoneToday = !!habit.history[dateStr];

          return (
            <Card key={habit.id} className={cn("overflow-hidden transition-all", isDoneToday && "border-success/30")}>
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Main */}
                  <div className="p-4 flex-1 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className={cn("text-base font-bold", isDoneToday && "text-muted-foreground line-through")}>{habit.name}</h3>
                      <div className="flex gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span className="capitalize bg-muted px-2 py-0.5 rounded">{habit.frequency}</span>
                        {habit.durationMinutes > 0 && <span>{habit.durationMinutes} min</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant={isDoneToday ? "success" : "outline"}
                        className={cn("rounded-full px-4 font-semibold", isDoneToday && "shadow-[0_0_12px_rgba(54,179,126,0.3)]")}
                        onClick={() => toggleHabit.mutate({ habitId: habit.id, dateStr })}
                      >
                        {isDoneToday ? <><Check className="mr-1.5 h-4 w-4" /> Done</> : "Check In"}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(habit.id, habit.name)}
                        title="Delete habit"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Stats & Heatmap */}
                  <div className="bg-muted/30 px-4 py-3 md:w-72 flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Flame className={cn("h-4 w-4", habit.streak > 0 ? "text-orange-500" : "text-muted-foreground")} />
                        <span className="font-semibold text-sm">{habit.streak} day streak</span>
                      </div>
                      {habit.streak >= 30 && <Trophy className="h-4 w-4 text-yellow-500" title="30+ day milestone!" />}
                      {habit.streak >= 7 && habit.streak < 30 && <span className="text-xs text-orange-500 font-medium">🔥 On fire!</span>}
                    </div>
                    <div className="flex justify-between gap-1">
                      {past7Days.map((day) => {
                        const done = !!habit.history[day.str];
                        return (
                          <div key={day.str} className="flex flex-col items-center gap-1">
                            <button
                              className={cn("w-7 h-7 rounded-md flex items-center justify-center transition-all text-xs",
                                done ? "bg-success text-white shadow-sm" : "bg-card border border-border hover:bg-muted"
                              )}
                              onClick={() => toggleHabit.mutate({ habitId: habit.id, dateStr: day.str })}
                              title={day.str}
                            >
                              {done && <Check className="h-3 w-3" />}
                            </button>
                            <span className="text-[9px] text-muted-foreground uppercase">{day.dayName[0]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showAdd && <AddHabitModal onClose={() => setShowAdd(false)} onSave={handleAddHabit} />}
    </div>
  );
}

import { useSettings, useHabits, useBlocks, useLearningGoals, useToggleHabit } from "@/hooks/use-local-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, CalendarDays, CheckCircle2, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import VoiceAssistant from "@/components/VoiceAssistant";
import QuickAdd from "@/components/QuickAdd";

export default function Dashboard() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: habits = [] } = useHabits();
  const { data: blocks = [] } = useBlocks();
  const { data: learningGoals = [] } = useLearningGoals();
  const toggleHabit = useToggleHabit();

  const today = new Date();
  const dateStr = format(today, "yyyy-MM-dd");
  const dayOfWeek = today.getDay();
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const activeGoals = learningGoals.length;
  const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;

  const todaysBlocks = blocks
    .filter(b => b.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const nextBlocks = todaysBlocks.filter(b => parseInt(b.startTime.split(":")[0]) >= hour).slice(0, 3);

  const BLOCK_COLORS: Record<string, string> = {
    work: "border-l-4 border-[#0052CC] bg-[#0052CC]/10",
    learning: "border-l-4 border-[#6554C0] bg-[#6554C0]/10",
    studies: "border-l-4 border-[#0065FF] bg-[#0065FF]/10",
    gym: "border-l-4 border-[#36B37E] bg-[#36B37E]/10",
    habits: "border-l-4 border-[#FF8B00] bg-[#FF8B00]/10",
    free: "border-l-4 border-muted bg-muted/20",
  };

  const completedHabits = habits.filter(h => !!h.history[dateStr]).length;
  const habitCompletion = habits.length > 0 ? Math.round((completedHabits / habits.length) * 100) : 0;

  const totalLearningHours = learningGoals.reduce((s, g) => s + g.hoursLogged, 0);
  const totalScheduleSlots = blocks.length;

  if (settingsLoading) return (
    <div className="p-8 flex justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-muted-foreground font-medium">{format(today, "EEEE, MMMM do")}</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">
            {greeting}, <span className="text-primary">{settings?.name || "User"}</span>
          </h1>
        </div>
        <VoiceAssistant />
      </div>

      {/* AI Briefing */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="border-primary/20 bg-primary/5 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" /> ✨ Daily Briefing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/85 leading-relaxed text-sm">
              {nextBlocks.length > 0
                ? `You have ${nextBlocks.length} activities coming up today. Your next: "${nextBlocks[0].title}" at ${nextBlocks[0].startTime}. Stay focused — you're on a ${bestStreak}-day streak!`
                : `No more activities scheduled for today. Use your free time wisely — consider reviewing your learning goals or prepping for tomorrow.`}
              {habits.length > 0 && ` You've completed ${completedHabits}/${habits.length} habits today.`}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Goals", value: activeGoals, color: "text-[#6554C0]" },
          { label: "Best Streak", value: `${bestStreak} 🔥`, color: "text-[#FF8B00]" },
          { label: "Schedule Blocks", value: totalScheduleSlots, color: "text-primary" },
          { label: "Learning Hours", value: `${totalLearningHours}h`, color: "text-success" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}>
            <Card>
              <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1">{stat.label}</p>
                <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Up Next */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" /> Up Next
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {nextBlocks.length > 0 ? (
              <div className="space-y-2">
                {nextBlocks.map((block) => (
                  <div key={block.id} className={cn("flex gap-3 items-center p-3 rounded-lg", BLOCK_COLORS[block.type])}>
                    <div className="text-xs font-medium text-muted-foreground w-12 text-right shrink-0">{block.startTime}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{block.title}</div>
                      <div className="text-xs text-muted-foreground capitalize">{block.type} · ends {block.endTime}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-8">
                <CalendarDays className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">No more activities today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Habits */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Daily Habits</CardTitle>
              <span className="text-xs text-muted-foreground font-medium">{completedHabits}/{habits.length} done</span>
            </div>
            <Progress value={habitCompletion} className="h-1.5 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {habits.slice(0, 5).map(habit => {
                const isCompleted = !!habit.history[dateStr];
                return (
                  <div key={habit.id} className="flex items-center justify-between p-2 hover:bg-muted/40 rounded-lg transition-colors cursor-pointer group"
                    onClick={() => toggleHabit.mutate({ habitId: habit.id, dateStr })}>
                    <div className="flex items-center gap-3">
                      <div className={cn("h-5 w-5 transition-colors", isCompleted ? "text-success" : "text-muted-foreground group-hover:text-primary")}>
                        {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                      </div>
                      <span className={cn("text-sm font-medium", isCompleted && "line-through text-muted-foreground")}>{habit.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">{habit.streak} 🔥</span>
                  </div>
                );
              })}
              {habits.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No habits yet. Add one with the + button.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Snapshot */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Habit Completion", value: habitCompletion, color: "bg-success" },
          { label: "Learning Progress", value: Math.min(totalLearningHours * 2, 100), color: "bg-primary" },
          { label: "Schedule Fill", value: Math.min(totalScheduleSlots * 8, 100), color: "bg-[#6554C0]" },
        ].map((item, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2">{item.label}</p>
              <div className="flex items-end gap-2">
                <span className="text-xl font-bold">{item.value}%</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-700", item.color)} style={{ width: `${item.value}%` }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Floating Quick Add */}
      <QuickAdd className="fixed bottom-20 md:bottom-8 right-4 md:right-8" />
    </div>
  );
}

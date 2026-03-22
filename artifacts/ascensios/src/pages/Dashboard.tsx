import { useState } from "react";
import { useSettings, useHabits, useBlocks, useLearningGoals, useToggleHabit } from "@/hooks/use-local-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, CalendarDays, CheckCircle2, Circle, Clock, ChevronRight, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import VoiceAssistant from "@/components/VoiceAssistant";
import QuickAdd from "@/components/QuickAdd";
import { Button } from "@/components/ui/button";

const BLOCK_COLORS: Record<string, { bg: string; dot: string }> = {
  work:     { bg: "border-l-4 border-[#0052CC] bg-[#0052CC]/10", dot: "bg-[#0052CC]" },
  learning: { bg: "border-l-4 border-[#6554C0] bg-[#6554C0]/10", dot: "bg-[#6554C0]" },
  studies:  { bg: "border-l-4 border-[#0065FF] bg-[#0065FF]/10", dot: "bg-[#0065FF]" },
  gym:      { bg: "border-l-4 border-[#36B37E] bg-[#36B37E]/10", dot: "bg-[#36B37E]" },
  habits:   { bg: "border-l-4 border-[#FF8B00] bg-[#FF8B00]/10", dot: "bg-[#FF8B00]" },
  free:     { bg: "border-l-4 border-muted bg-muted/20",          dot: "bg-muted-foreground" },
};

function TodayScheduleModal({ blocks, onClose }: { blocks: any[]; onClose: () => void }) {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-bold text-lg">Today's Schedule</h2>
            <p className="text-xs text-muted-foreground">{format(now, "EEEE, MMMM do")}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          {blocks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No blocks scheduled today</p>
              <p className="text-sm mt-1">Go to Schedule → Auto-Schedule to generate your day</p>
            </div>
          ) : (
            <div className="space-y-2">
              {blocks.map(block => {
                const startH = parseInt(block.startTime.split(":")[0]) + parseInt(block.startTime.split(":")[1]) / 60;
                const endH = parseInt(block.endTime.split(":")[0]) + parseInt(block.endTime.split(":")[1]) / 60;
                const isNow = currentHour >= startH && currentHour < endH;
                const isPast = currentHour >= endH;
                const style = BLOCK_COLORS[block.type] || BLOCK_COLORS.free;

                return (
                  <div key={block.id} className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all",
                    style.bg,
                    isPast && "opacity-50",
                    isNow && "ring-2 ring-primary/50 shadow-md"
                  )}>
                    <div className="text-xs font-mono text-muted-foreground w-20 shrink-0 text-right">
                      {block.startTime}<br/>
                      <span className="opacity-60">{block.endTime}</span>
                    </div>
                    <div className={cn("w-1.5 h-10 rounded-full shrink-0", style.dot)} />
                    <div className="flex-1 min-w-0">
                      <div className={cn("font-semibold text-sm truncate", isPast && "line-through")}>{block.title}</div>
                      <div className="text-xs text-muted-foreground capitalize">{block.type}</div>
                    </div>
                    {isNow && <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">NOW</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: habits = [] } = useHabits();
  const { data: blocks = [] } = useBlocks();
  const { data: learningGoals = [] } = useLearningGoals();
  const toggleHabit = useToggleHabit();
  const [showSchedule, setShowSchedule] = useState(false);

  const today = new Date();
  const dateStr = format(today, "yyyy-MM-dd");
  const dayOfWeek = today.getDay();
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const todaysBlocks = blocks
    .filter(b => b.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const currentHour = hour + today.getMinutes() / 60;
  const currentBlock = todaysBlocks.find(b => {
    const s = parseInt(b.startTime.split(":")[0]) + parseInt(b.startTime.split(":")[1]) / 60;
    const e = parseInt(b.endTime.split(":")[0]) + parseInt(b.endTime.split(":")[1]) / 60;
    return currentHour >= s && currentHour < e;
  });
  const nextBlocks = todaysBlocks.filter(b => parseInt(b.startTime.split(":")[0]) > hour).slice(0, 3);

  const completedHabits = habits.filter(h => !!h.history[dateStr]).length;
  const habitCompletion = habits.length > 0 ? Math.round((completedHabits / habits.length) * 100) : 0;
  const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  const totalLearningHours = learningGoals.reduce((s, g) => s + g.hoursLogged, 0);

  if (settingsLoading) return (
    <div className="p-8 flex justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-muted-foreground font-medium text-sm">{format(today, "EEEE, MMMM do")}</p>
          <h1 className="text-3xl font-bold tracking-tight mt-0.5">
            {greeting}, <span className="text-primary">{settings?.name || "User"}</span>
          </h1>
        </div>
        <VoiceAssistant />
      </div>

      {/* Currently Active Block */}
      {currentBlock && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className={cn("flex items-center gap-3 p-3 rounded-lg border-l-4", BLOCK_COLORS[currentBlock.type]?.bg)}>
            <div className="animate-pulse w-2.5 h-2.5 rounded-full bg-success shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Happening now</p>
              <p className="font-bold truncate">{currentBlock.title}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{currentBlock.startTime}–{currentBlock.endTime}</span>
          </div>
        </motion.div>
      )}

      {/* AI Briefing */}
      <Card className="border-primary/20 bg-primary/5 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <CardHeader className="pb-1 pt-4">
          <CardTitle className="text-sm flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" /> Daily Briefing
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-foreground/85 text-sm leading-relaxed">
            {todaysBlocks.length > 0
              ? `${todaysBlocks.length} activities scheduled today. ${currentBlock ? `Currently: "${currentBlock.title}".` : nextBlocks.length > 0 ? `Next up: "${nextBlocks[0].title}" at ${nextBlocks[0].startTime}.` : "All done for today!"}`
              : "No activities scheduled today. Use Auto-Schedule or the + button to plan your day."}
            {habits.length > 0 && ` ${completedHabits}/${habits.length} habits completed.`}
            {bestStreak >= 3 && ` You're on a ${bestStreak}-day streak — keep going!`}
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Goals", value: learningGoals.length, color: "text-purple-400" },
          { label: "Best Streak", value: `${bestStreak} 🔥`, color: "text-orange-400" },
          { label: "Today's Blocks", value: todaysBlocks.length, color: "text-primary" },
          { label: "Learning Hrs", value: `${totalLearningHours}h`, color: "text-success" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">{stat.label}</p>
                <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Today's Schedule Quick View */}
        <Card className="cursor-pointer hover:border-primary/40 transition-colors group" onClick={() => setShowSchedule(true)}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Today's Schedule
              </CardTitle>
              <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                View all <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {todaysBlocks.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No blocks today — tap to plan</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {todaysBlocks.slice(0, 4).map(block => {
                  const startH = parseInt(block.startTime.split(":")[0]) + parseInt(block.startTime.split(":")[1]) / 60;
                  const endH = parseInt(block.endTime.split(":")[0]) + parseInt(block.endTime.split(":")[1]) / 60;
                  const isNow = currentHour >= startH && currentHour < endH;
                  const style = BLOCK_COLORS[block.type] || BLOCK_COLORS.free;
                  return (
                    <div key={block.id} className={cn("flex items-center gap-2.5 p-2 rounded-md", style.bg, isNow && "ring-1 ring-primary/30")}>
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", style.dot)} />
                      <span className="text-xs text-muted-foreground w-10 shrink-0 font-mono">{block.startTime}</span>
                      <span className={cn("text-sm font-medium truncate flex-1", isNow && "text-primary")}>{block.title}</span>
                      {isNow && <span className="text-[10px] font-bold text-primary shrink-0">NOW</span>}
                    </div>
                  );
                })}
                {todaysBlocks.length > 4 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">+{todaysBlocks.length - 4} more — tap to see all</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Habits */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Daily Habits</CardTitle>
              <span className="text-xs font-medium text-muted-foreground">{completedHabits}/{habits.length} done</span>
            </div>
            <Progress value={habitCompletion} className="h-1.5 mt-1.5" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {habits.slice(0, 5).map(habit => {
                const isCompleted = !!habit.history[dateStr];
                return (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between p-2 hover:bg-muted/40 rounded-lg transition-colors cursor-pointer group"
                    onClick={() => toggleHabit.mutate({ habitId: habit.id, dateStr })}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={cn("h-4 w-4 transition-colors shrink-0", isCompleted ? "text-success" : "text-muted-foreground group-hover:text-primary")}>
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                      </div>
                      <span className={cn("text-sm font-medium", isCompleted && "line-through text-muted-foreground")}>{habit.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">{habit.streak} 🔥</span>
                  </div>
                );
              })}
              {habits.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No habits yet — tap + to add one</p>
              )}
              {habits.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-1">+{habits.length - 5} more in Habits page</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Up Next */}
      {nextBlocks.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" /> Up Next
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-2">
              {nextBlocks.map(block => {
                const style = BLOCK_COLORS[block.type] || BLOCK_COLORS.free;
                return (
                  <div key={block.id} className={cn("flex gap-2 items-center p-3 rounded-lg", style.bg)}>
                    <div className={cn("w-1.5 h-8 rounded-full shrink-0", style.dot)} />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{block.title}</div>
                      <div className="text-xs text-muted-foreground">{block.startTime} – {block.endTime}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floating Quick Add */}
      <QuickAdd className="fixed bottom-20 md:bottom-8 right-4 md:right-8" />

      {/* Today Schedule Modal */}
      {showSchedule && <TodayScheduleModal blocks={todaysBlocks} onClose={() => setShowSchedule(false)} />}
    </div>
  );
}

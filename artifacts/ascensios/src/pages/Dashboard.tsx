import { useSettings, useHabits, useBlocks, useLearningGoals, useToggleHabit } from "@/hooks/use-local-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Sparkles, Plus, CheckCircle2, Circle, CalendarDays } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: habits = [] } = useHabits();
  const { data: blocks = [] } = useBlocks();
  const { data: learningGoals = [] } = useLearningGoals();
  const toggleHabit = useToggleHabit();

  const today = new Date();
  const dateStr = format(today, 'yyyy-MM-dd');
  const dayOfWeek = today.getDay(); // 0 is Sunday
  
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Quick Stats
  const activeGoals = learningGoals.length;
  const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  
  const todaysBlocks = blocks
    .filter(b => b.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const nextBlocks = todaysBlocks.filter(b => parseInt(b.startTime.split(':')[0]) >= hour).slice(0, 3);

  const getBlockColor = (type: string) => {
    switch(type) {
      case 'work': return 'bg-primary border-primary/20 text-primary';
      case 'learning': return 'bg-chart-4 border-chart-4/20 text-chart-4';
      case 'studies': return 'bg-primary border-primary/20 text-primary';
      case 'gym': return 'bg-success border-success/20 text-success';
      case 'habits': return 'bg-chart-2 border-chart-2/20 text-chart-2';
      default: return 'bg-secondary border-border text-foreground';
    }
  };

  if (settingsLoading) return <div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-muted-foreground font-medium">{format(today, 'EEEE, MMMM do')}</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-1">
            {greeting}, {settings?.name || "User"}
          </h1>
        </div>
        <Button size="icon" className="rounded-full shadow-lg h-12 w-12 hover:scale-105 transition-transform">
          <Mic className="h-5 w-5" />
        </Button>
      </div>

      {/* AI Briefing */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="border-primary/20 bg-primary/5 shadow-md overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5 animate-sparkle" />
              Daily Briefing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/90 leading-relaxed">
              You have a solid block of Deep Work scheduled for 9:00 AM. Your <strong>React Native Course</strong> is at risk of falling behind - consider dedicating your 2 hours of free time this evening to catch up. Don't forget your Gym session at 5 PM!
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Goals", value: activeGoals, color: "text-chart-4" },
          { label: "Best Streak", value: `${bestStreak} 🔥`, color: "text-chart-4" },
          { label: "Free Hours", value: "4.5h", color: "text-chart-3" },
          { label: "Weekly Score", value: "85/100", color: "text-primary" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                <p className="text-sm text-muted-foreground font-medium mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Up Next</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {nextBlocks.length > 0 ? (
              <div className="space-y-3">
                {nextBlocks.map((block, i) => (
                  <div key={block.id} className="flex gap-4 items-center group">
                    <div className="text-sm font-medium text-muted-foreground w-12 text-right">
                      {block.startTime}
                    </div>
                    <div className={cn("flex-1 p-3 rounded-md border flex items-center justify-between", getBlockColor(block.type))}>
                      <span className="font-semibold text-foreground">{block.title}</span>
                      <span className="text-xs opacity-70 bg-background/50 px-2 py-1 rounded capitalize">{block.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-8">
                <CalendarDays className="h-10 w-10 mb-2 opacity-20" />
                <p>No more activities scheduled for today.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Habits Snapshot */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Habits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {habits.slice(0, 4).map(habit => {
                const isCompleted = !!habit.history[dateStr];
                return (
                  <div key={habit.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <button 
                        className="text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => toggleHabit.mutate({ habitId: habit.id, dateStr })}
                      >
                        {isCompleted ? <CheckCircle2 className="h-6 w-6 text-success" /> : <Circle className="h-6 w-6" />}
                      </button>
                      <span className={cn("font-medium", isCompleted && "line-through text-muted-foreground")}>{habit.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                      {habit.streak} 🔥
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-20 md:bottom-8 right-4 md:right-8 bg-primary hover:bg-primary/90 text-primary-foreground h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-50">
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}

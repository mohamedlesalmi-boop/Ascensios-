import { useLearningGoals, useHabits, useBlocks } from "@/hooks/use-local-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from "recharts";
import { Sparkles, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, subDays } from "date-fns";

const PIE_COLORS = ['#0052CC', '#36B37E', '#FF8B00', '#626F86', '#6554C0'];

export default function Progress() {
  const { data: goals = [] } = useLearningGoals();
  const { data: habits = [] } = useHabits();
  const { data: blocks = [] } = useBlocks();

  const today = new Date();

  // Build real habit completion data for the past 7 days
  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const completed = habits.filter(h => !!h.history[dateStr]).length;
    const total = habits.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { name: format(d, 'EEE'), completed, total, pct };
  });

  // Learning hours per goal
  const learningData = goals.map(g => ({
    name: g.name.length > 12 ? g.name.slice(0, 12) + "…" : g.name,
    logged: g.hoursLogged,
    target: g.targetHoursPerWeek,
  }));

  // Block type breakdown
  const typeCount: Record<string, number> = {};
  blocks.forEach(b => { typeCount[b.type] = (typeCount[b.type] || 0) + 1; });
  const pieData = Object.entries(typeCount).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  // Insights based on real data
  const insights: { type: 'good' | 'warn' | 'info'; text: string }[] = [];

  // Habit insights
  const todayStr = format(today, 'yyyy-MM-dd');
  const completedToday = habits.filter(h => !!h.history[todayStr]).length;
  const slippingHabits = habits.filter(h => h.streak < 3 && !h.history[todayStr]);
  const strongHabits = habits.filter(h => h.streak >= 7);

  if (strongHabits.length > 0) {
    insights.push({ type: 'good', text: `${strongHabits.map(h => `"${h.name}"`).join(', ')} ${strongHabits.length === 1 ? 'has' : 'have'} a strong streak of ${strongHabits[0].streak}+ days. Keep it up!` });
  }
  if (slippingHabits.length > 0) {
    insights.push({ type: 'warn', text: `"${slippingHabits[0].name}" hasn't been checked today. Try scheduling it in the morning when willpower is highest.` });
  }
  if (habits.length > 0 && completedToday === habits.length) {
    insights.push({ type: 'good', text: "All habits completed today! You're building real momentum." });
  }

  // Learning insights
  const behindGoals = goals.filter(g => g.hoursLogged < g.targetHoursPerWeek * 0.5);
  const onTrackGoals = goals.filter(g => g.hoursLogged >= g.targetHoursPerWeek);
  if (onTrackGoals.length > 0) {
    insights.push({ type: 'good', text: `"${onTrackGoals[0].name}" is at or above its weekly target. Excellent consistency!` });
  }
  if (behindGoals.length > 0) {
    insights.push({ type: 'warn', text: `"${behindGoals[0].name}" is behind this week (${behindGoals[0].hoursLogged}/${behindGoals[0].targetHoursPerWeek}h). Consider adding a daily 30-min block.` });
  }

  // Schedule insights
  const workBlocks = blocks.filter(b => b.type === 'work');
  const learningBlocks = blocks.filter(b => b.type === 'learning' || b.type === 'studies');
  if (workBlocks.length > 0 && learningBlocks.length === 0) {
    insights.push({ type: 'info', text: "Your schedule is heavy on work but has no learning blocks. Add at least 2 learning sessions per week for balanced growth." });
  }
  if (blocks.length === 0) {
    insights.push({ type: 'info', text: "Your schedule is empty. Use Auto-Schedule on the Schedule page to generate a balanced weekly plan." });
  }
  if (insights.length === 0) {
    insights.push({ type: 'info', text: "Keep building your schedule and habits — insights will appear as you log more data." });
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Progress Analytics</h1>
        <p className="text-muted-foreground">Track your growth and identify what needs attention</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Habits Today", value: `${completedToday}/${habits.length}`, good: completedToday === habits.length && habits.length > 0 },
          { label: "Best Streak", value: habits.length > 0 ? `${Math.max(...habits.map(h => h.streak))} 🔥` : "—", good: Math.max(...habits.map(h => h.streak), 0) >= 7 },
          { label: "Learning Hours", value: `${goals.reduce((s, g) => s + g.hoursLogged, 0)}h`, good: goals.some(g => g.hoursLogged >= g.targetHoursPerWeek) },
          { label: "Schedule Blocks", value: blocks.length, good: blocks.length >= 5 },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.good ? 'text-success' : 'text-foreground'}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Habit Completion Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Habit Completion (7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={past7Days} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, 'Completion']}
                />
                <Bar dataKey="pct" fill="#36B37E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Schedule Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Schedule Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="40%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No schedule data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Learning Progress */}
      {learningData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Learning Hours vs Target</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={learningData} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="target" fill="#0052CC" fillOpacity={0.2} radius={[0, 4, 4, 0]} name="Target" />
                <Bar dataKey="logged" fill="#0052CC" radius={[0, 4, 4, 0]} name="Logged" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-purple-400">
            <Sparkles className="h-4 w-4" /> Improvement Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.map((ins, i) => (
            <div key={i} className={cn(
              "flex items-start gap-3 p-3 rounded-lg border text-sm",
              ins.type === 'good' ? "bg-success/10 border-success/20 text-success" :
              ins.type === 'warn' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
              "bg-muted border-border text-foreground/80"
            )}>
              {ins.type === 'good' ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> :
               ins.type === 'warn' ? <TrendingDown className="h-4 w-4 mt-0.5 shrink-0" /> :
               <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
              <p>{ins.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

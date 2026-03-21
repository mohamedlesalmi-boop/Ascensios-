import { useLearningGoals, useHabits } from "@/hooks/use-local-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadialBarChart, RadialBar, Legend, PieChart, Pie, Cell } from "recharts";
import { Sparkles, Trophy } from "lucide-react";
import { motion } from "framer-motion";

const PIE_COLORS = ['#0052CC', '#36B37E', '#FFAB00', '#626F86', '#8777D9'];

export default function Progress() {
  const { data: goals = [] } = useLearningGoals();
  const { data: habits = [] } = useHabits();

  // Mock data for Line Chart
  const lineData = [
    { name: 'Mon', hours: 2 },
    { name: 'Tue', hours: 3.5 },
    { name: 'Wed', hours: 4 },
    { name: 'Thu', hours: 3 },
    { name: 'Fri', hours: 5 },
    { name: 'Sat', hours: 6 },
    { name: 'Sun', hours: 4.5 },
  ];

  // Pie Chart data
  const pieData = [
    { name: 'Work', value: 40 },
    { name: 'Learning', value: 25 },
    { name: 'Habits', value: 15 },
    { name: 'Free', value: 20 },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Progress Analytics</h1>
          <p className="text-muted-foreground">Visualize your growth</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Score Card */}
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
          <Card className="h-full bg-gradient-to-br from-primary/10 to-transparent border-primary/20 flex flex-col items-center justify-center p-6 text-center">
            <Trophy className="h-12 w-12 text-primary mb-4" />
            <h2 className="text-xl font-bold">Ascensios Score</h2>
            <div className="text-6xl font-extrabold text-primary my-4 tracking-tighter">85</div>
            <p className="text-sm text-muted-foreground">Top 15% of all users this week. Great consistency!</p>
          </Card>
        </motion.div>

        {/* Learning Trend */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Productive Hours (Past 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="hours" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* AI Insight */}
        <Card className="border-chart-4/30 bg-chart-4/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-chart-4/10 rounded-bl-full" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-chart-4">
              <Sparkles className="h-5 w-5" /> Weekly Insight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/90 text-lg leading-relaxed">
              You've maintained your Gym habit perfectly, but your "Read Non-Fiction" habit is slipping. Try moving your reading block to the morning before work when your willpower is highest.
            </p>
          </CardContent>
        </Card>

        {/* Time Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Time Allocation</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

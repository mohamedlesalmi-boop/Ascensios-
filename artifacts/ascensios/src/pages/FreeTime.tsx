import { useBlocks, useSettings } from "@/hooks/use-local-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { cn } from "@/lib/utils";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const WORK_HOURS = 8; // 8 hours of work per day
const SLEEP_HOURS = 7.5;
const TOTAL_HOURS = 24;

const COLOR_MAP: Record<string, string> = {
  work: "#0052CC",
  learning: "#5E6C84",
  studies: "#0052CC",
  gym: "#36B37E",
  habits: "#36B37E",
  free: "#B0C4DE",
  sleep: "#161B22",
};

export default function FreeTime() {
  const { data: blocks = [] } = useBlocks();
  const { data: settings } = useSettings();
  const sleepHours = settings?.sleepTarget ?? 7.5;

  const dayData = DAYS.map((day, idx) => {
    const dayBlocks = blocks.filter(b => b.dayOfWeek === idx);
    
    const blockHours = dayBlocks.reduce((sum, b) => {
      const start = parseInt(b.startTime.split(":")[0]) + parseInt(b.startTime.split(":")[1]) / 60;
      const end = parseInt(b.endTime.split(":")[0]) + parseInt(b.endTime.split(":")[1]) / 60;
      return sum + Math.max(0, end - start);
    }, 0);

    const scheduledHours = blockHours;
    const freeHours = Math.max(0, TOTAL_HOURS - sleepHours - scheduledHours);

    const workH = dayBlocks.filter(b => b.type === "work").reduce((s, b) => {
      const start = parseInt(b.startTime.split(":")[0]) + parseInt(b.startTime.split(":")[1]) / 60;
      const end = parseInt(b.endTime.split(":")[0]) + parseInt(b.endTime.split(":")[1]) / 60;
      return s + Math.max(0, end - start);
    }, 0);

    const learningH = dayBlocks.filter(b => b.type === "learning" || b.type === "studies").reduce((s, b) => {
      const start = parseInt(b.startTime.split(":")[0]) + parseInt(b.startTime.split(":")[1]) / 60;
      const end = parseInt(b.endTime.split(":")[0]) + parseInt(b.endTime.split(":")[1]) / 60;
      return s + Math.max(0, end - start);
    }, 0);

    const gymH = dayBlocks.filter(b => b.type === "gym" || b.type === "habits").reduce((s, b) => {
      const start = parseInt(b.startTime.split(":")[0]) + parseInt(b.startTime.split(":")[1]) / 60;
      const end = parseInt(b.endTime.split(":")[0]) + parseInt(b.endTime.split(":")[1]) / 60;
      return s + Math.max(0, end - start);
    }, 0);

    return {
      day: DAY_SHORT[idx],
      fullDay: day,
      work: parseFloat(workH.toFixed(1)),
      learning: parseFloat(learningH.toFixed(1)),
      gym: parseFloat(gymH.toFixed(1)),
      sleep: sleepHours,
      free: parseFloat(freeHours.toFixed(1)),
    };
  });

  const today = new Date().getDay();
  const todayData = dayData[today];
  const totalFreeWeek = dayData.reduce((sum, d) => sum + d.free, 0);

  const suggestions = [
    `Tonight you have ${todayData.free.toFixed(1)}h free — perfect for a deep learning session.`,
    `Your most free day this week is ${dayData.reduce((max, d) => d.free > max.free ? d : max).fullDay} with ${dayData.reduce((max, d) => d.free > max.free ? d : max).free.toFixed(1)} hours.`,
    `You have ${totalFreeWeek.toFixed(1)} total free hours this week — use at least 4 for skill building.`,
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Free Time Optimizer</h1>
        <p className="text-muted-foreground">Maximize your unscheduled hours</p>
      </div>

      {/* AI Suggestion */}
      <Card className="border-primary/20 bg-primary/5 relative overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" /> AI Time Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {suggestions.map((s, i) => (
            <p key={i} className="text-sm text-foreground/80 flex items-start gap-2">
              <span className="text-primary mt-0.5">→</span> {s}
            </p>
          ))}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Free", value: `${todayData.free.toFixed(1)}h`, color: "text-primary" },
          { label: "Weekly Free", value: `${totalFreeWeek.toFixed(1)}h`, color: "text-success" },
          { label: "Sleep/Night", value: `${sleepHours}h`, color: "text-muted-foreground" },
          { label: "Busy Hours/Day", value: `${(TOTAL_HOURS - sleepHours - todayData.free).toFixed(1)}h`, color: "text-chart-4" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Time Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <XAxis dataKey="day" tick={{ fill: "#626F86", fontSize: 12 }} />
                <YAxis tick={{ fill: "#626F86", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "8px" }}
                  labelStyle={{ color: "var(--foreground)" }}
                />
                <Legend />
                <Bar dataKey="work" stackId="a" fill="#0052CC" name="Work" radius={[0, 0, 0, 0]} />
                <Bar dataKey="learning" stackId="a" fill="#5E6C84" name="Learning" />
                <Bar dataKey="gym" stackId="a" fill="#36B37E" name="Gym/Habits" />
                <Bar dataKey="sleep" stackId="a" fill="#2C3E50" name="Sleep" />
                <Bar dataKey="free" stackId="a" fill="#B0C4DE" name="Free" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Daily Free Time List */}
      <Card>
        <CardHeader><CardTitle>Daily Free Time Breakdown</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {dayData.map((d, i) => {
            const isToday = i === today;
            const totalUsed = TOTAL_HOURS - d.free - d.sleep;
            const usedPct = (totalUsed / TOTAL_HOURS) * 100;
            const freePct = (d.free / TOTAL_HOURS) * 100;
            return (
              <div key={d.day} className={cn("p-3 rounded-lg", isToday && "bg-primary/5 border border-primary/20")}>
                <div className="flex justify-between items-center mb-2">
                  <span className={cn("font-medium", isToday && "text-primary")}>{d.fullDay} {isToday && "· Today"}</span>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" /> {d.free.toFixed(1)}h free
                  </span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden w-full">
                  <div className="bg-primary" style={{ width: `${(d.work / TOTAL_HOURS) * 100}%` }} title={`Work: ${d.work}h`} />
                  <div className="bg-[#5E6C84]" style={{ width: `${(d.learning / TOTAL_HOURS) * 100}%` }} title={`Learning: ${d.learning}h`} />
                  <div className="bg-success" style={{ width: `${(d.gym / TOTAL_HOURS) * 100}%` }} title={`Gym: ${d.gym}h`} />
                  <div className="bg-[#2C3E50]" style={{ width: `${(d.sleep / TOTAL_HOURS) * 100}%` }} title={`Sleep: ${d.sleep}h`} />
                  <div className="bg-muted" style={{ width: `${freePct}%` }} title={`Free: ${d.free}h`} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

import { useLearningGoals } from "@/hooks/use-local-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Sparkles, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Learning() {
  const { data: goals = [] } = useLearningGoals();

  const getPriorityColor = (p: string) => {
    if (p === 'High') return 'text-destructive bg-destructive/10 border-destructive/20';
    if (p === 'Medium') return 'text-chart-4 bg-chart-4/10 border-chart-4/20';
    return 'text-success bg-success/10 border-success/20';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Skill & Knowledge</h1>
          <p className="text-muted-foreground">Structured learning paths</p>
        </div>
        <Button className="gap-2 bg-chart-4 hover:bg-chart-4/90 text-chart-4-foreground">
          <Plus className="h-4 w-4" /> Add Goal
        </Button>
      </div>

      {/* AI Roadmap Teaser */}
      <Card className="border-chart-4/30 bg-gradient-to-r from-chart-4/5 to-transparent">
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="h-16 w-16 rounded-full bg-chart-4/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-8 w-8 text-chart-4" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-foreground">AI-Generated Roadmaps</h3>
            <p className="text-muted-foreground mt-1">Let Gemini break down your high-level goals into week-by-week actionable milestones.</p>
          </div>
          <Button variant="outline" className="border-chart-4 text-chart-4 hover:bg-chart-4 hover:text-chart-4-foreground">
            Generate Roadmap
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {goals.map(goal => (
          <Card key={goal.id} className="flex flex-col hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-xl">{goal.name}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-medium px-2 py-1 rounded bg-secondary/20">
                    {goal.level}
                  </span>
                  <span className={cn("text-xs font-medium px-2 py-1 rounded border", getPriorityColor(goal.priority))}>
                    {goal.priority} Priority
                  </span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Weekly Progress</span>
                  <span className="font-bold">{goal.hoursLogged} / {goal.targetHoursPerWeek} hrs</span>
                </div>
                <Progress 
                  value={Math.min(100, (goal.hoursLogged / goal.targetHoursPerWeek) * 100)} 
                  indicatorColor="bg-chart-4"
                  className="h-2"
                />
              </div>
              <div className="mt-6 flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => alert('Log time')}>
                  <BookOpen className="w-4 h-4" /> Log Session
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

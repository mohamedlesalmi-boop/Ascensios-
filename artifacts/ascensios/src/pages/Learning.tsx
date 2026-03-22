import { useState } from "react";
import { useLearningGoals, useSaveLearningGoal, useDeleteLearningGoal, useSettings } from "@/hooks/use-local-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Sparkles, BookOpen, Trash2, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { LearningGoal } from "@/lib/schema";

function AddGoalModal({ onClose, onSave }: { onClose: () => void; onSave: (g: LearningGoal) => void }) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner");
  const [hours, setHours] = useState(3);
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-lg">Add Learning Goal</h2>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Goal / Skill Name</label>
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
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Target hours per week</label>
            <input type="number" min="1" max="40" className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={hours} onChange={e => setHours(Number(e.target.value))} />
          </div>
          <div className="flex gap-2 pt-1">
            <Button className="flex-1" disabled={!name.trim()} onClick={() => name.trim() && onSave({ id: uuidv4(), name: name.trim(), level, targetHoursPerWeek: hours, priority, hoursLogged: 0 })}>Add Goal</Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogSessionModal({ goal, onClose, onSave }: { goal: LearningGoal; onClose: () => void; onSave: (hrs: number) => void }) {
  const [hours, setHours] = useState(1);
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-bold text-lg">Log Session</h2>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">Logging time for: <span className="font-semibold text-foreground">{goal.name}</span></p>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Hours studied</label>
            <input type="number" min="0.25" max="12" step="0.25" className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={hours} onChange={e => setHours(Number(e.target.value))} />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => onSave(hours)}>Log {hours}h</Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Learning() {
  const { data: goals = [] } = useLearningGoals();
  const saveGoal = useSaveLearningGoal();
  const deleteGoal = useDeleteLearningGoal();
  const { data: settings } = useSettings();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [logGoal, setLogGoal] = useState<LearningGoal | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<string | null>(null);

  const getPriorityColor = (p: string) => {
    if (p === 'High') return 'text-destructive bg-destructive/10 border-destructive/20';
    if (p === 'Medium') return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    return 'text-success bg-success/10 border-success/20';
  };

  const handleDelete = async (id: string, name: string) => {
    await deleteGoal.mutateAsync(id);
    toast({ title: `Removed "${name}"` });
  };

  const handleAddGoal = async (g: LearningGoal) => {
    await saveGoal.mutateAsync(g);
    toast({ title: `✅ "${g.name}" added to Learning!` });
    setShowAdd(false);
  };

  const handleLogSession = async (hrs: number) => {
    if (!logGoal) return;
    await saveGoal.mutateAsync({ ...logGoal, hoursLogged: logGoal.hoursLogged + hrs });
    toast({ title: `✅ Logged ${hrs}h for "${logGoal.name}"` });
    setLogGoal(null);
  };

  const generateRoadmap = async () => {
    const key = settings?.geminiApiKey;
    if (!key?.trim()) {
      toast({ title: "API Key Required", description: "Add your Gemini API key in Settings.", variant: "destructive" });
      return;
    }
    if (goals.length === 0) {
      toast({ title: "No goals yet", description: "Add a learning goal first.", variant: "destructive" });
      return;
    }
    setAiLoading(true);
    setRoadmap(null);
    try {
      const goalsList = goals.map(g => `${g.name} (${g.level}, ${g.targetHoursPerWeek}h/week)`).join(", ");
      const prompt = `Create a concise 4-week learning roadmap for: ${goalsList}. Format as plain text bullet points by week. Max 150 words.`;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 300 } }),
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No roadmap generated.";
      setRoadmap(text);
    } catch {
      toast({ title: "AI Error", description: "Could not generate roadmap. Try again.", variant: "destructive" });
    }
    setAiLoading(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Skill & Knowledge</h1>
          <p className="text-muted-foreground">Structured learning paths</p>
        </div>
        <Button className="gap-2" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> Add Goal
        </Button>
      </div>

      {/* AI Roadmap */}
      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-6 w-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground">AI-Generated Roadmaps</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Gemini breaks down your goals into week-by-week milestones.</p>
            {roadmap && (
              <div className="mt-3 p-3 bg-background rounded-lg text-sm text-foreground/80 whitespace-pre-wrap border border-border leading-relaxed">
                {roadmap}
              </div>
            )}
          </div>
          <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 shrink-0 gap-2" onClick={generateRoadmap} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {aiLoading ? "Generating..." : "Generate Roadmap"}
          </Button>
        </CardContent>
      </Card>

      {goals.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No learning goals yet</p>
          <p className="text-sm mt-1">Add a goal to start tracking your progress</p>
          <Button className="mt-4 gap-2" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Add Your First Goal</Button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {goals.map(goal => (
          <Card key={goal.id} className="flex flex-col hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <CardTitle className="text-lg truncate">{goal.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted">{goal.level}</span>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded border", getPriorityColor(goal.priority))}>{goal.priority}</span>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 h-8 w-8"
                onClick={() => handleDelete(goal.id, goal.name)}
                title="Delete goal"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end pt-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Weekly Progress</span>
                  <span className="font-bold">{goal.hoursLogged} / {goal.targetHoursPerWeek} hrs</span>
                </div>
                <Progress value={Math.min(100, (goal.hoursLogged / goal.targetHoursPerWeek) * 100)} className="h-2" />
                <p className="text-xs text-muted-foreground">{goal.targetHoursPerWeek - goal.hoursLogged > 0 ? `${(goal.targetHoursPerWeek - goal.hoursLogged).toFixed(1)}h remaining this week` : "Weekly goal met! 🎉"}</p>
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full gap-2" onClick={() => setLogGoal(goal)}>
                  <BookOpen className="w-4 h-4" /> Log Session
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showAdd && <AddGoalModal onClose={() => setShowAdd(false)} onSave={handleAddGoal} />}
      {logGoal && <LogSessionModal goal={logGoal} onClose={() => setLogGoal(null)} onSave={handleLogSession} />}
    </div>
  );
}

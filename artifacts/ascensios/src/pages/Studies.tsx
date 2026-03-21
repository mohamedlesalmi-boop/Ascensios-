import { useState } from "react";
import { useCourses, useSaveCourse, useDeleteCourse } from "@/hooks/use-local-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, BookOpen, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Course } from "@/lib/schema";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { v4 as uuidv4 } from "uuid";

export default function Studies() {
  const { data: courses = [] } = useCourses();
  const saveCourse = useSaveCourse();
  const deleteCourse = useDeleteCourse();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", deadline: "", weeklyHoursTarget: 5, hoursCompleted: 0 });

  const getDeadlineColor = (deadline: string) => {
    const days = differenceInDays(parseISO(deadline), new Date());
    if (days < 7) return "text-destructive";
    if (days < 21) return "text-yellow-500";
    return "text-success";
  };

  const getDeadlineLabel = (deadline: string) => {
    const days = differenceInDays(parseISO(deadline), new Date());
    if (days < 0) return "Overdue!";
    if (days === 0) return "Due today!";
    return `${days} days left`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "on_track": return <CheckCircle className="h-4 w-4 text-success" />;
      case "at_risk": return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "behind": return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const totalHours = courses.reduce((sum, c) => sum + c.weeklyHoursTarget, 0);
  const pieData = courses.map(c => ({ name: c.name, value: c.weeklyHoursTarget }));
  const COLORS = ["#0052CC", "#36B37E", "#626F86", "#FF8B00", "#6554C0"];

  const handleAdd = () => {
    if (!form.name || !form.deadline) return;
    const days = differenceInDays(parseISO(form.deadline), new Date());
    const status: Course["status"] = days < 7 ? "behind" : days < 21 ? "at_risk" : "on_track";
    saveCourse.mutate({ ...form, id: uuidv4(), status, deadline: new Date(form.deadline).toISOString() });
    setForm({ name: "", deadline: "", weeklyHoursTarget: 5, hoursCompleted: 0 });
    setShowForm(false);
  };

  const overallCompletion = courses.length > 0
    ? Math.round(courses.reduce((sum, c) => sum + Math.min(c.hoursCompleted / Math.max(c.weeklyHoursTarget * 4, 1), 1), 0) / courses.length * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Academic Tracker</h1>
          <p className="text-muted-foreground">Stay on top of your coursework</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Add Course
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle>New Course</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Course Name</label>
                <input
                  className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Data Structures"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Deadline</label>
                <input
                  type="date"
                  className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Target Hours/Week</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.weeklyHoursTarget}
                  onChange={e => setForm(f => ({ ...f, weeklyHoursTarget: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Hours Completed</label>
                <input
                  type="number"
                  min="0"
                  className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.hoursCompleted}
                  onChange={e => setForm(f => ({ ...f, hoursCompleted: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAdd}>Save Course</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {courses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border border-dashed rounded-lg">
              <BookOpen className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium">No courses yet</p>
              <p className="text-sm">Add your first course to start tracking</p>
            </div>
          )}
          {courses.map(course => {
            const progress = Math.min(Math.round(course.hoursCompleted / Math.max(course.weeklyHoursTarget * 4, 1) * 100), 100);
            return (
              <Card key={course.id} className="overflow-hidden hover:border-primary/40 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(course.status)}
                        <h3 className="font-bold text-lg">{course.name}</h3>
                      </div>
                      <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {course.weeklyHoursTarget}h/week
                        </span>
                        <span className={cn("font-medium", getDeadlineColor(course.deadline))}>
                          {getDeadlineLabel(course.deadline)}
                        </span>
                        <span>Due: {format(parseISO(course.deadline), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteCourse.mutate(course.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{course.hoursCompleted}h completed</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Overall Completion</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData.length > 0 ? pieData : [{ name: "No courses", value: 1 }]}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={70}
                      dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-2">
                <p className="text-3xl font-bold text-primary">{overallCompletion}%</p>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Weekly Commitment</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {courses.map((c, i) => (
                <div key={c.id} className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-foreground truncate max-w-[140px]">{c.name}</span>
                  </div>
                  <span className="text-muted-foreground font-medium">{c.weeklyHoursTarget}h</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary">{totalHours}h</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

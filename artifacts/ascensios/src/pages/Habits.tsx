import { useState } from "react";
import { useHabits, useToggleHabit } from "@/hooks/use-local-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Check, Flame, Trophy } from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

export default function Habits() {
  const { data: habits = [] } = useHabits();
  const toggleHabit = useToggleHabit();
  
  const today = new Date();
  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    return { date: d, str: format(d, 'yyyy-MM-dd'), dayName: format(d, 'EE') };
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Discipline</h1>
          <p className="text-muted-foreground">Build consistency, master yourself</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Habit
        </Button>
      </div>

      <div className="grid gap-4">
        {habits.map((habit) => {
          const isDoneToday = !!habit.history[format(today, 'yyyy-MM-dd')];
          
          return (
            <Card key={habit.id} className="overflow-hidden hover:border-primary/50 transition-colors">
              <div className="flex flex-col md:flex-row">
                {/* Main Info */}
                <div className="p-6 flex-1 flex items-center justify-between md:border-r border-border">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{habit.name}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="capitalize bg-muted px-2 py-0.5 rounded">{habit.frequency}</span>
                      {habit.durationMinutes > 0 && <span>{habit.durationMinutes} min</span>}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Button 
                      size="lg"
                      variant={isDoneToday ? "success" : "outline"}
                      className={cn("w-32 rounded-full font-bold", isDoneToday && "shadow-[0_0_15px_rgba(54,179,126,0.4)]")}
                      onClick={() => toggleHabit.mutate({ habitId: habit.id, dateStr: format(today, 'yyyy-MM-dd') })}
                    >
                      {isDoneToday ? (
                        <><Check className="mr-2 h-5 w-5" /> Done</>
                      ) : "Check In"}
                    </Button>
                  </div>
                </div>

                {/* Stats & Heatmap */}
                <div className="bg-muted/30 p-6 md:w-80 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Flame className={cn("h-5 w-5", habit.streak > 0 ? "text-orange-500" : "text-muted-foreground")} />
                      <span className="font-bold text-lg">{habit.streak} Day Streak</span>
                    </div>
                    {habit.streak >= 30 && <Trophy className="h-5 w-5 text-yellow-500" />}
                  </div>
                  
                  {/* Mini Heatmap */}
                  <div className="flex justify-between gap-1">
                    {past7Days.map((day) => {
                      const done = !!habit.history[day.str];
                      return (
                        <div key={day.str} className="flex flex-col items-center gap-1">
                          <button 
                            className={cn(
                              "w-8 h-8 rounded-md flex items-center justify-center transition-all",
                              done ? "bg-success text-success-foreground shadow-sm" : "bg-card border border-border hover:bg-muted"
                            )}
                            onClick={() => toggleHabit.mutate({ habitId: habit.id, dateStr: day.str })}
                            title={day.str}
                          >
                            {done && <Check className="h-4 w-4" />}
                          </button>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase">{day.dayName[0]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

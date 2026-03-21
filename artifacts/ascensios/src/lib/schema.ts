import { z } from "zod";

export const blockSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["work", "learning", "studies", "gym", "habits", "free"]),
  dayOfWeek: z.number().min(0).max(6), // 0 = Sunday, 1 = Monday
  startTime: z.string(), // "09:00"
  endTime: z.string(),   // "10:00"
  notes: z.string().optional(),
});

export const courseSchema = z.object({
  id: z.string(),
  name: z.string(),
  deadline: z.string(), // ISO date
  weeklyHoursTarget: z.number(),
  hoursCompleted: z.number().default(0),
  status: z.enum(["on_track", "at_risk", "behind"]).default("on_track"),
});

export const learningGoalSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  targetHoursPerWeek: z.number(),
  priority: z.enum(["High", "Medium", "Low"]),
  hoursLogged: z.number().default(0),
});

export const habitSchema = z.object({
  id: z.string(),
  name: z.string(),
  frequency: z.enum(["daily", "weekdays", "weekends"]),
  durationMinutes: z.number(),
  streak: z.number().default(0),
  history: z.record(z.string(), z.boolean()).default({}), // YYYY-MM-DD -> completed
});

export const friendSchema = z.object({
  id: z.string(),
  name: z.string(),
  contactNote: z.string(),
});

export const settingsSchema = z.object({
  name: z.string().default("User"),
  geminiApiKey: z.string().default(""),
  sleepTarget: z.number().default(7),
  wakeTime: z.string().default("08:00"),
  theme: z.enum(["dark", "light"]).default("dark"),
  weekStart: z.enum(["monday", "sunday"]).default("monday"),
  notificationsEnabled: z.boolean().default(true),
});

export type Block = z.infer<typeof blockSchema>;
export type Course = z.infer<typeof courseSchema>;
export type LearningGoal = z.infer<typeof learningGoalSchema>;
export type Habit = z.infer<typeof habitSchema>;
export type Friend = z.infer<typeof friendSchema>;
export type Settings = z.infer<typeof settingsSchema>;

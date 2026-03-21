import { Block, Course, LearningGoal, Habit, Friend, Settings } from "./schema";

export const defaultSettings: Settings = {
  name: "Alex",
  geminiApiKey: "",
  sleepTarget: 7.5,
  wakeTime: "07:00",
  theme: "dark",
  weekStart: "monday",
  notificationsEnabled: true,
};

export const defaultBlocks: Block[] = [
  { id: "1", title: "Deep Work", type: "work", dayOfWeek: 1, startTime: "09:00", endTime: "11:30" },
  { id: "2", title: "React Native Course", type: "learning", dayOfWeek: 1, startTime: "13:00", endTime: "14:30" },
  { id: "3", title: "Gym (Push)", type: "gym", dayOfWeek: 1, startTime: "17:00", endTime: "18:30" },
  { id: "4", title: "Read", type: "habits", dayOfWeek: 1, startTime: "21:00", endTime: "22:00" },
  
  { id: "5", title: "Deep Work", type: "work", dayOfWeek: 2, startTime: "09:00", endTime: "11:30" },
  { id: "6", title: "Algorithms", type: "studies", dayOfWeek: 2, startTime: "14:00", endTime: "16:00" },
];

export const defaultCourses: Course[] = [
  { id: "1", name: "Computer Science 101", deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), weeklyHoursTarget: 10, hoursCompleted: 15, status: "on_track" },
  { id: "2", name: "Advanced Mathematics", deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), weeklyHoursTarget: 8, hoursCompleted: 4, status: "behind" },
];

export const defaultLearningGoals: LearningGoal[] = [
  { id: "1", name: "Master React 19", level: "Intermediate", targetHoursPerWeek: 5, priority: "High", hoursLogged: 12 },
  { id: "2", name: "Speak Spanish", level: "Beginner", targetHoursPerWeek: 3, priority: "Medium", hoursLogged: 8 },
];

export const defaultHabits: Habit[] = [
  { id: "1", name: "Morning Meditation", frequency: "daily", durationMinutes: 10, streak: 12, history: { [new Date().toISOString().split('T')[0]]: true } },
  { id: "2", name: "Read Non-Fiction", frequency: "daily", durationMinutes: 30, streak: 4, history: {} },
  { id: "3", name: "Drink 2L Water", frequency: "daily", durationMinutes: 0, streak: 21, history: { [new Date().toISOString().split('T')[0]]: true } },
];

export const defaultFriends: Friend[] = [
  { id: "1", name: "Sarah J.", contactNote: "Study partner for Algorithms" },
  { id: "2", name: "Mike T.", contactNote: "Gym buddy (Mon/Wed)" },
];

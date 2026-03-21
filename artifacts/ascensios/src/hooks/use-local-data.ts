import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { defaultBlocks, defaultCourses, defaultFriends, defaultHabits, defaultLearningGoals, defaultSettings } from "@/lib/mock-data";
import { Block, Course, Friend, Habit, LearningGoal, Settings } from "@/lib/schema";

// Helper to simulate network delay for realism
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

const getStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(`ascensios_${key}`);
    if (item) return JSON.parse(item);
    // Initialize if empty
    localStorage.setItem(`ascensios_${key}`, JSON.stringify(defaultValue));
    return defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStorage = <T>(key: string, value: T) => {
  localStorage.setItem(`ascensios_${key}`, JSON.stringify(value));
};

// --- SETTINGS ---
export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      await delay(100);
      return getStorage<Settings>("settings", defaultSettings);
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newSettings: Partial<Settings>) => {
      await delay(200);
      const current = getStorage<Settings>("settings", defaultSettings);
      const updated = { ...current, ...newSettings };
      setStorage("settings", updated);
      
      // Apply theme class to HTML body
      if (updated.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      return updated;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });
}

// --- BLOCKS (SCHEDULE) ---
export function useBlocks() {
  return useQuery({
    queryKey: ["blocks"],
    queryFn: async () => {
      await delay(300);
      return getStorage<Block[]>("blocks", defaultBlocks);
    },
  });
}

export function useSaveBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (block: Block) => {
      await delay(200);
      const blocks = getStorage<Block[]>("blocks", defaultBlocks);
      const existingIdx = blocks.findIndex(b => b.id === block.id);
      
      if (existingIdx >= 0) {
        blocks[existingIdx] = block;
      } else {
        blocks.push(block);
      }
      
      setStorage("blocks", blocks);
      return block;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blocks"] }),
  });
}

// Generates generic hooks for lists
function createListHooks<T extends { id: string }>(key: string, defaultData: T[]) {
  const useList = () => useQuery({
    queryKey: [key],
    queryFn: async () => {
      await delay(200);
      return getStorage<T[]>(key, defaultData);
    },
  });

  const useSave = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (item: T) => {
        await delay(200);
        const list = getStorage<T[]>(key, defaultData);
        const idx = list.findIndex(i => i.id === item.id);
        if (idx >= 0) list[idx] = item;
        else list.push(item);
        setStorage(key, list);
        return item;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
    });
  };

  const useDelete = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        await delay(200);
        const list = getStorage<T[]>(key, defaultData);
        setStorage(key, list.filter(i => i.id !== id));
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [key] }),
    });
  };

  return { useList, useSave, useDelete };
}

export const { useList: useCourses, useSave: useSaveCourse, useDelete: useDeleteCourse } = createListHooks<Course>("courses", defaultCourses);
export const { useList: useLearningGoals, useSave: useSaveLearningGoal, useDelete: useDeleteLearningGoal } = createListHooks<LearningGoal>("learningGoals", defaultLearningGoals);
export const { useList: useHabits, useSave: useSaveHabit, useDelete: useDeleteHabit } = createListHooks<Habit>("habits", defaultHabits);
export const { useList: useFriends, useSave: useSaveFriend, useDelete: useDeleteFriend } = createListHooks<Friend>("friends", defaultFriends);

// Custom Habit toggle
export function useToggleHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ habitId, dateStr }: { habitId: string, dateStr: string }) => {
      const habits = getStorage<Habit[]>("habits", defaultHabits);
      const habit = habits.find(h => h.id === habitId);
      if (!habit) throw new Error("Habit not found");
      
      const current = !!habit.history[dateStr];
      habit.history[dateStr] = !current;
      
      // Basic streak logic update
      if (!current) habit.streak += 1;
      else habit.streak = Math.max(0, habit.streak - 1);
      
      setStorage("habits", habits);
      return habit;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habits"] }),
  });
}

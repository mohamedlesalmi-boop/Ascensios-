import { Block } from "./schema";

let notifTimers: ReturnType<typeof setTimeout>[] = [];

export function clearScheduledNotifications() {
  notifTimers.forEach(t => clearTimeout(t));
  notifTimers = [];
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function scheduleActivityNotifications(blocks: Block[], minutesBefore = 15) {
  clearScheduledNotifications();
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const now = new Date();
  const dayOfWeek = now.getDay();
  const todaysBlocks = blocks.filter(b => b.dayOfWeek === dayOfWeek);

  todaysBlocks.forEach(block => {
    const [startH, startM] = block.startTime.split(":").map(Number);
    const activityTime = new Date();
    activityTime.setHours(startH, startM, 0, 0);

    const notifyAt = new Date(activityTime.getTime() - minutesBefore * 60 * 1000);
    const msUntilNotify = notifyAt.getTime() - now.getTime();

    if (msUntilNotify > 0 && msUntilNotify < 24 * 60 * 60 * 1000) {
      const timer = setTimeout(() => {
        try {
          new Notification(`⏰ Starting in ${minutesBefore} min: ${block.title}`, {
            body: `${block.startTime} – ${block.endTime} · ${block.type}`,
            icon: "/favicon.svg",
            badge: "/favicon.svg",
            tag: `block-${block.id}`,
          });
        } catch {}
      }, msUntilNotify);
      notifTimers.push(timer);
    }
  });
}

import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { useEffect } from "react";
import { useBlocks, useSettings } from "@/hooks/use-local-data";
import { scheduleActivityNotifications } from "@/lib/notifications";

import Dashboard from "@/pages/Dashboard";
import Schedule from "@/pages/Schedule";
import Studies from "@/pages/Studies";
import Learning from "@/pages/Learning";
import Habits from "@/pages/Habits";
import Progress from "@/pages/Progress";
import FreeTime from "@/pages/FreeTime";
import Community from "@/pages/Community";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function ThemeInitializer() {
  useEffect(() => {
    try {
      const settingsStr = localStorage.getItem('ascensios_settings');
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        if (settings.theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
        }
      } else {
        document.documentElement.classList.add('dark');
      }
    } catch {
      document.documentElement.classList.add('dark');
    }
  }, []);
  return null;
}

function NotificationInitializer() {
  const { data: blocks = [] } = useBlocks();
  const { data: settings } = useSettings();
  useEffect(() => {
    if (!settings?.notificationsEnabled || blocks.length === 0) return;
    if (Notification.permission !== "granted") return;
    const leadTime = settings.notificationLeadTime ?? 15;
    scheduleActivityNotifications(blocks, leadTime);
  }, [blocks, settings?.notificationsEnabled, settings?.notificationLeadTime]);
  return null;
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/schedule" component={Schedule} />
        <Route path="/studies" component={Studies} />
        <Route path="/learning" component={Learning} />
        <Route path="/habits" component={Habits} />
        <Route path="/progress" component={Progress} />
        <Route path="/freetime" component={FreeTime} />
        <Route path="/community" component={Community} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer />
      <NotificationInitializer />
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

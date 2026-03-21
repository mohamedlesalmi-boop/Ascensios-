import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  CalendarDays, 
  BookOpen, 
  Target, 
  Dumbbell, 
  BarChart3, 
  Clock, 
  Users, 
  Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard", color: "text-primary" },
  { href: "/schedule", icon: CalendarDays, label: "Schedule", color: "text-primary" },
  { href: "/studies", icon: BookOpen, label: "Studies", color: "text-primary" },
  { href: "/learning", icon: Target, label: "Learning", color: "text-chart-4" },
  { href: "/habits", icon: Dumbbell, label: "Habits", color: "text-success" },
  { href: "/progress", icon: BarChart3, label: "Progress", color: "text-chart-5" },
  { href: "/freetime", icon: Clock, label: "Free Time", color: "text-chart-3" },
  { href: "/community", icon: Users, label: "Community", color: "text-primary" },
  { href: "/settings", icon: Settings, label: "Settings", color: "text-muted-foreground" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <span className="text-3xl">▲</span> Ascensios
          </h1>
        </div>
        
        <nav className="flex-1 space-y-1 px-4 py-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-foreground/80 hover:bg-muted jira-interactive"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? item.color : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary font-medium rounded-md hover:bg-primary/20 transition-colors">
            📲 Install PWA
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-50">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = location === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1",
                isActive ? item.color : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "scale-110 transition-transform" : "")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

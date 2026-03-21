import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, CalendarDays, BookOpen, Target,
  Dumbbell, BarChart3, Clock, Users, Settings as SettingsIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/schedule", icon: CalendarDays, label: "Schedule" },
  { href: "/studies", icon: BookOpen, label: "Studies" },
  { href: "/learning", icon: Target, label: "Learning" },
  { href: "/habits", icon: Dumbbell, label: "Habits" },
  { href: "/progress", icon: BarChart3, label: "Progress" },
  { href: "/freetime", icon: Clock, label: "Free Time" },
  { href: "/community", icon: Users, label: "Community" },
  { href: "/settings", icon: SettingsIcon, label: "Settings" },
];

function AscensiosLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="90,8 158,47 158,125 90,164 22,125 22,47" fill="none" stroke="#0052CC" strokeWidth="8" strokeLinejoin="round"/>
      <polygon points="90,32 134,57 134,107 90,132 46,107 46,57" fill="#0052CC" fillOpacity="0.08" stroke="#0052CC" strokeWidth="5" strokeLinejoin="round"/>
      <ellipse cx="90" cy="82" rx="22" ry="14" fill="none" stroke="white" strokeWidth="4"/>
      <circle cx="90" cy="82" r="7" fill="white"/>
      <circle cx="90" cy="82" r="3.5" fill="#0052CC"/>
      <circle cx="93" cy="79" r="1.5" fill="white"/>
      <line x1="90" y1="26" x2="90" y2="14" stroke="#0052CC" strokeWidth="4" strokeLinecap="round"/>
      <line x1="72" y1="31" x2="65" y2="21" stroke="#0052CC" strokeWidth="3" strokeLinecap="round"/>
      <line x1="108" y1="31" x2="115" y2="21" stroke="#0052CC" strokeWidth="3" strokeLinecap="round"/>
      <line x1="57" y1="44" x2="46" y2="37" stroke="#0052CC" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="123" y1="44" x2="134" y2="37" stroke="#0052CC" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const handleInstall = () => {
    const prompt = (window as any).deferredInstallPrompt;
    if (prompt) {
      prompt.prompt();
      prompt.userChoice.then(() => { (window as any).deferredInstallPrompt = null; });
    } else {
      alert("To install: tap the browser menu → 'Add to Home Screen'");
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <AscensiosLogo size={36} />
          <div>
            <h1 className="text-lg font-bold text-primary leading-none">Ascensios</h1>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Productivity Command Center</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-0.5 px-3 py-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm",
                  isActive 
                    ? "bg-primary/10 text-primary font-semibold" 
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-3 border-t border-border">
          <button 
            onClick={handleInstall}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/10 text-primary text-sm font-medium rounded-md hover:bg-primary/20 transition-colors"
          >
            📲 Install App
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-12 bg-card border-b border-border flex items-center px-4 z-40">
        <div className="flex items-center gap-2">
          <AscensiosLogo size={24} />
          <span className="font-bold text-primary text-sm">Ascensios</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 pt-16 md:pt-4">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-1 z-50">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = location === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1 h-full gap-1 transition-colors touch-manipulation",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "scale-110")} />
              <span className="text-[9px] font-medium leading-none truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

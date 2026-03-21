import { useBlocks } from "@/hooks/use-local-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Calendar as CalIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 10 PM

export default function Schedule() {
  const { data: blocks = [] } = useBlocks();
  const currentDay = new Date().getDay();

  const getBlockColor = (type: string) => {
    switch(type) {
      case 'work': return 'bg-primary/20 border-primary/40 text-primary-foreground';
      case 'learning': return 'bg-chart-4/20 border-chart-4/40 text-chart-4-foreground';
      case 'studies': return 'bg-primary/30 border-primary/50 text-primary-foreground';
      case 'gym': return 'bg-success/20 border-success/40 text-success-foreground';
      case 'habits': return 'bg-chart-2/20 border-chart-2/40 text-chart-2-foreground';
      default: return 'bg-secondary border-border text-foreground';
    }
  };

  const renderBlock = (day: number, hour: number) => {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    const block = blocks.find(b => b.dayOfWeek === day && b.startTime.startsWith(hour.toString().padStart(2, '0')));
    
    if (!block) return null;

    // Calculate height based on duration (simplified)
    const startMins = parseInt(block.startTime.split(':')[1] || '0');
    const endHour = parseInt(block.endTime.split(':')[0]);
    const endMins = parseInt(block.endTime.split(':')[1] || '0');
    
    const durationHours = (endHour + endMins/60) - (hour + startMins/60);
    const heightPercentage = durationHours * 100;
    
    return (
      <div 
        className={cn(
          "absolute w-full p-2 border rounded-md shadow-sm overflow-hidden text-xs z-10 cursor-pointer hover:brightness-110 transition-all",
          getBlockColor(block.type)
        )}
        style={{ 
          top: `${(startMins / 60) * 100}%`, 
          height: `calc(${heightPercentage}% - 4px)`,
          left: '2px',
          width: 'calc(100% - 4px)'
        }}
        onClick={() => alert(`Edit ${block.title}`)}
      >
        <div className="font-semibold truncate">{block.title}</div>
        <div className="opacity-80 hidden md:block">{block.startTime} - {block.endTime}</div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Smart Schedule</h1>
          <p className="text-muted-foreground">Time blocking + spaced repetition</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <CalIcon className="h-4 w-4" /> Today
          </Button>
          <Button variant="default" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" /> Auto-Schedule
          </Button>
        </div>
      </div>

      {/* Grid Container */}
      <Card className="flex-1 overflow-auto bg-card border shadow-sm flex flex-col">
        {/* Header Row */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-muted/50 sticky top-0 z-20">
          <div className="p-3 border-r flex items-center justify-center text-xs text-muted-foreground">
            UTC
          </div>
          {DAYS.map((day, i) => (
            <div 
              key={day} 
              className={cn(
                "p-3 text-center font-medium border-r last:border-r-0",
                i === currentDay ? "bg-primary/10 text-primary border-b-2 border-b-primary" : ""
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="flex-1 overflow-y-auto min-w-[600px]">
          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] group">
              {/* Time Label */}
              <div className="p-2 border-r border-b text-xs text-muted-foreground text-right relative bg-background">
                <span className="absolute -top-3 right-2 bg-background px-1">
                  {hour > 12 ? `${hour-12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                </span>
              </div>
              
              {/* Day Cells */}
              {DAYS.map((_, dayIdx) => (
                <div 
                  key={`${dayIdx}-${hour}`} 
                  className={cn(
                    "border-r border-b relative h-16 transition-colors hover:bg-muted/30 cursor-pointer",
                    dayIdx === currentDay ? "bg-primary/5" : ""
                  )}
                >
                  {renderBlock(dayIdx, hour)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

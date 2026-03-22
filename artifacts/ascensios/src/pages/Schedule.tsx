import { useState, useRef, useCallback } from "react";
import { useBlocks, useSaveBlock, useSettings } from "@/hooks/use-local-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Calendar as CalIcon, Download, Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Block } from "@/lib/schema";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 7); // 7 AM to 11 PM (23:00)

const BLOCK_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  work:     { bg: "#0052CC", text: "#FFFFFF", border: "#003DB3", label: "Work" },
  learning: { bg: "#6554C0", text: "#FFFFFF", border: "#4C3F9F", label: "Learning" },
  studies:  { bg: "#0065FF", text: "#FFFFFF", border: "#0050CC", label: "Studies" },
  gym:      { bg: "#36B37E", text: "#FFFFFF", border: "#2A9165", label: "Gym" },
  habits:   { bg: "#FF8B00", text: "#FFFFFF", border: "#CC6F00", label: "Habits" },
  free:     { bg: "#626F86", text: "#FFFFFF", border: "#4D5A6F", label: "Free" },
};

// Auto-schedule algorithm: distribute learning/free blocks into gaps
function generateAutoSchedule(existingBlocks: Block[]): Block[] {
  const WORK_DAYS = [1, 2, 3, 4, 5]; // Mon–Fri
  const newBlocks: Block[] = [];

  // Add work blocks Mon-Fri 9-17 if not set
  WORK_DAYS.forEach(day => {
    const hasWork = existingBlocks.some(b => b.type === "work" && b.dayOfWeek === day);
    if (!hasWork) {
      newBlocks.push({ id: uuidv4(), title: "Deep Work", type: "work", dayOfWeek: day, startTime: "09:00", endTime: "17:00" });
    }
  });

  // Add gym Mon/Wed/Fri 18-19
  [1, 3, 5].forEach(day => {
    const hasGym = existingBlocks.some(b => b.type === "gym" && b.dayOfWeek === day);
    if (!hasGym) {
      newBlocks.push({ id: uuidv4(), title: "Gym Session", type: "gym", dayOfWeek: day, startTime: "18:00", endTime: "19:00" });
    }
  });

  // Add learning blocks using spaced repetition (Tue, Thu, Sat, Sun)
  [2, 4, 6, 0].forEach((day, i) => {
    const hasLearning = existingBlocks.some(b => (b.type === "learning" || b.type === "studies") && b.dayOfWeek === day);
    if (!hasLearning) {
      newBlocks.push({ id: uuidv4(), title: "Learning Session", type: "learning", dayOfWeek: day, startTime: "19:00", endTime: "21:00" });
    }
  });

  // Morning routine every day
  [0, 1, 2, 3, 4, 5, 6].forEach(day => {
    const hasMorning = existingBlocks.some(b => b.dayOfWeek === day && b.startTime === "07:00");
    if (!hasMorning) {
      newBlocks.push({ id: uuidv4(), title: "Morning Routine", type: "habits", dayOfWeek: day, startTime: "07:00", endTime: "08:00" });
    }
  });

  return newBlocks;
}

async function downloadSchedulePDF(blocks: Block[]) {
  // @ts-ignore
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const today = new Date();
  const weekStr = `Week of ${today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
  const fileName = `Ascensios-Schedule-${today.toISOString().split("T")[0]}.pdf`;

  // Title
  doc.setFillColor(0, 82, 204);
  doc.rect(0, 0, 297, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Ascensios — Weekly Schedule", 10, 13);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(weekStr, 200, 13);

  // Grid setup
  const startX = 15, startY = 28;
  const dayW = 36, timeW = 20, rowH = 8;
  const timeSlots = ["6AM","7AM","8AM","9AM","10AM","11AM","12PM","1PM","2PM","3PM","4PM","5PM","6PM","7PM","8PM","9PM"];

  // Day headers
  doc.setFillColor(247, 248, 250);
  doc.rect(startX, startY, timeW + dayW * 7, rowH, "F");
  doc.setTextColor(98, 111, 134);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("TIME", startX + 2, startY + 5.5);
  FULL_DAYS.forEach((d, i) => {
    doc.text(d.toUpperCase(), startX + timeW + dayW * i + 2, startY + 5.5);
  });

  // Time rows
  timeSlots.forEach((slot, rowIdx) => {
    const y = startY + rowH * (rowIdx + 1);
    doc.setDrawColor(225, 228, 232);
    doc.setLineWidth(0.1);
    doc.rect(startX, y, timeW + dayW * 7, rowH);
    doc.setTextColor(130, 140, 160);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(slot, startX + 1, y + 5.5);

    // Day cells
    DAYS.forEach((_, dayIdx) => {
      doc.rect(startX + timeW + dayW * dayIdx, y, dayW, rowH);
    });
  });

  // Fill blocks
  const COLOR_MAP: Record<string, [number, number, number]> = {
    work: [0, 82, 204], learning: [101, 84, 192], studies: [0, 101, 255],
    gym: [54, 179, 126], habits: [255, 139, 0], free: [98, 111, 134],
  };

  blocks.forEach(b => {
    const startHour = parseInt(b.startTime.split(":")[0]);
    const endHour = parseInt(b.endTime.split(":")[0]);
    const startMin = parseInt(b.startTime.split(":")[1]) || 0;
    const endMin = parseInt(b.endTime.split(":")[1]) || 0;

    const rowStart = startHour - 6;
    const rowEnd = endHour - 6 + (endMin > 0 ? 1 : 0);
    if (rowStart < 0 || rowStart >= 16) return;

    const x = startX + timeW + dayW * b.dayOfWeek;
    const y = startY + rowH * (rowStart + 1) + 1;
    const h = Math.max(rowH * (rowEnd - rowStart) - 2, rowH - 2);

    const [r, g, bl] = COLOR_MAP[b.type] || [98, 111, 134];
    doc.setFillColor(r, g, bl);
    doc.setDrawColor(r * 0.8, g * 0.8, bl * 0.8);
    doc.roundedRect(x + 1, y, dayW - 2, h, 1, 1, "FD");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    const lines = doc.splitTextToSize(b.title, dayW - 4);
    doc.text(lines[0] || b.title, x + 2.5, y + 4.5);
    if (lines.length > 1 && h > 10) {
      doc.setFont("helvetica", "normal");
      doc.text(`${b.startTime}–${b.endTime}`, x + 2.5, y + 9);
    }
  });

  // Legend
  const legendY = startY + rowH * 17 + 4;
  doc.setFontSize(7);
  let lx = startX;
  Object.entries(BLOCK_STYLES).forEach(([type, style]) => {
    const [r, g, b] = COLOR_MAP[type] || [98, 111, 134];
    doc.setFillColor(r, g, b);
    doc.rect(lx, legendY, 4, 4, "F");
    doc.setTextColor(80, 80, 80);
    doc.text(style.label, lx + 5, legendY + 3.5);
    lx += 25;
  });

  doc.save(fileName);
}

type EditState = Partial<Block> & { open: boolean };

export default function Schedule() {
  const { data: blocks = [] } = useBlocks();
  const saveBlock = useSaveBlock();
  const { data: settings } = useSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentDay = new Date().getDay();
  const todayColRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [autoScheduling, setAutoScheduling] = useState(false);
  const [edit, setEdit] = useState<EditState>({ open: false });

  const getBlockStyle = (type: string) => BLOCK_STYLES[type] || BLOCK_STYLES.free;

  const scrollToToday = () => {
    if (todayColRef.current && gridRef.current) {
      const colLeft = todayColRef.current.offsetLeft;
      gridRef.current.scrollTo({ left: colLeft - 60, behavior: "smooth" });
    }
    toast({ title: "📅 Jumped to today", description: FULL_DAYS[currentDay] });
  };

  const autoSchedule = async () => {
    setAutoScheduling(true);
    const newBlocks = generateAutoSchedule(blocks);
    for (const b of newBlocks) await saveBlock.mutateAsync(b);
    setAutoScheduling(false);
    toast({ title: "✅ Schedule generated!", description: `Added ${newBlocks.length} time blocks based on your goals.` });
  };

  const downloadPDF = async () => {
    toast({ title: "📥 Generating PDF...", description: "Your schedule PDF is being created." });
    try {
      await downloadSchedulePDF(blocks);
    } catch (e) {
      toast({ title: "PDF Error", description: "Could not generate PDF. Try again.", variant: "destructive" });
    }
  };

  const openEdit = (b: Block) => {
    setEdit({ open: true, ...b });
  };

  const openNew = (dayOfWeek: number, hour: number) => {
    setEdit({
      open: true, id: uuidv4(), title: "", type: "work", dayOfWeek,
      startTime: `${hour.toString().padStart(2, "0")}:00`,
      endTime: `${(hour + 1).toString().padStart(2, "0")}:00`,
    });
  };

  const saveEdit = async () => {
    if (!edit.title?.trim() || !edit.id) return;
    await saveBlock.mutateAsync({
      id: edit.id, title: edit.title, type: edit.type || "work",
      dayOfWeek: edit.dayOfWeek ?? 0, startTime: edit.startTime || "09:00", endTime: edit.endTime || "10:00",
    });
    toast({ title: "✅ Block saved!" });
    setEdit({ open: false });
  };

  const deleteBlock = async (id: string) => {
    const all = blocks.filter(b => b.id !== id);
    localStorage.setItem("ascensios_blocks", JSON.stringify(all));
    queryClient.invalidateQueries({ queryKey: ["blocks"] });
    toast({ title: "Block removed" });
    setEdit({ open: false });
  };

  const renderBlock = (day: number, hour: number) => {
    const block = blocks.find(b => b.dayOfWeek === day && parseInt(b.startTime.split(":")[0]) === hour);
    if (!block) return null;
    const style = getBlockStyle(block.type);
    const startMin = parseInt(block.startTime.split(":")[1]) || 0;
    const endH = parseInt(block.endTime.split(":")[0]);
    const endM = parseInt(block.endTime.split(":")[1]) || 0;
    const duration = (endH + endM / 60) - (hour + startMin / 60);

    return (
      <div
        className="absolute rounded-md overflow-hidden cursor-pointer text-xs font-medium shadow-sm hover:opacity-90 active:opacity-80 transition-opacity"
        style={{
          top: `${(startMin / 60) * 100}%`,
          height: `calc(${duration * 100}% - 3px)`,
          left: "2px", width: "calc(100% - 4px)",
          backgroundColor: style.bg, color: style.text,
          borderLeft: `3px solid ${style.border}`,
          zIndex: 10,
        }}
        onClick={() => openEdit(block)}
      >
        <div className="p-1.5">
          <div className="font-bold leading-tight truncate" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>{block.title}</div>
          <div className="opacity-90 text-[10px] leading-tight mt-0.5" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>{block.startTime}–{block.endTime}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Smart Schedule</h1>
          <p className="text-muted-foreground text-sm">Time blocking + spaced repetition</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={scrollToToday}>
            <CalIcon className="h-3.5 w-3.5" /> Today
          </Button>
          <Button variant="default" size="sm" className="gap-1.5" onClick={autoSchedule} disabled={autoScheduling}>
            {autoScheduling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Auto-Schedule
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadPDF}>
            <Download className="h-3.5 w-3.5" /> PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openNew(currentDay, 9)}>
            <Plus className="h-3.5 w-3.5" /> Add Block
          </Button>
        </div>
      </div>

      {/* Grid */}
      <Card className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div ref={gridRef} className="flex-1 overflow-auto">
          <div className="min-w-[640px]">
            {/* Day Header */}
            <div className="grid border-b bg-muted/30 sticky top-0 z-20" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
              <div className="p-2 border-r text-[10px] text-muted-foreground text-center" />
              {DAYS.map((day, i) => (
                <div
                  key={day}
                  ref={i === currentDay ? todayColRef : undefined}
                  className={cn("p-2 text-center text-xs font-semibold border-r last:border-r-0",
                    i === currentDay && "bg-primary/10 text-primary"
                  )}
                >
                  <div>{day}</div>
                  {i === currentDay && <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-0.5" />}
                </div>
              ))}
            </div>

            {/* Time Rows */}
            {HOURS.map(hour => (
              <div key={hour} className="grid" style={{ gridTemplateColumns: "52px repeat(7, 1fr)" }}>
                <div className="border-r border-b text-[10px] text-muted-foreground text-right pr-2 relative bg-background h-16 flex-shrink-0">
                  <span className="absolute top-1 right-2">
                    {hour > 12 ? `${hour - 12}PM` : hour === 12 ? "12PM" : `${hour}AM`}
                  </span>
                </div>
                {DAYS.map((_, dayIdx) => (
                  <div
                    key={dayIdx}
                    className={cn(
                      "border-r border-b last:border-r-0 relative h-16 hover:bg-muted/20 cursor-pointer transition-colors",
                      dayIdx === currentDay && "bg-primary/3"
                    )}
                    onClick={(e) => {
                      if (e.target === e.currentTarget) openNew(dayIdx, hour);
                    }}
                  >
                    {renderBlock(dayIdx, hour)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground flex-shrink-0">
        {Object.entries(BLOCK_STYLES).map(([type, s]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.bg }} />
            <span>{s.label}</span>
          </div>
        ))}
        <span className="ml-2 opacity-50">· Click any empty cell to add a block</span>
      </div>

      {/* Edit Modal */}
      {edit.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-bold text-lg">{blocks.find(b => b.id === edit.id) ? "Edit Block" : "New Block"}</h2>
              <Button size="icon" variant="ghost" onClick={() => setEdit({ open: false })}><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Title</label>
                <input
                  autoFocus
                  className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={edit.title || ""}
                  onChange={e => setEdit(s => ({ ...s, title: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && saveEdit()}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(BLOCK_STYLES).map(([type, s]) => (
                    <button
                      key={type}
                      onClick={() => setEdit(st => ({ ...st, type: type as Block["type"] }))}
                      className={cn("px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                        edit.type === type ? "text-white border-transparent" : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                      )}
                      style={edit.type === type ? { backgroundColor: s.bg, borderColor: s.border } : {}}
                    >{s.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Day</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((d, i) => (
                    <button key={d} onClick={() => setEdit(s => ({ ...s, dayOfWeek: i }))}
                      className={cn("px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                        edit.dayOfWeek === i ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                      )}>{d}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Start</label>
                  <input type="time" className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={edit.startTime || "09:00"} onChange={e => setEdit(s => ({ ...s, startTime: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">End</label>
                  <input type="time" className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" value={edit.endTime || "10:00"} onChange={e => setEdit(s => ({ ...s, endTime: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button className="flex-1" onClick={saveEdit} disabled={!edit.title?.trim()}>Save Block</Button>
                {blocks.find(b => b.id === edit.id) && (
                  <Button variant="destructive" onClick={() => edit.id && deleteBlock(edit.id)}>Delete</Button>
                )}
                <Button variant="outline" onClick={() => setEdit({ open: false })}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

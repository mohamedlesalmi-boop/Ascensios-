import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Sparkles, X, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSaveBlock, useSettings } from "@/hooks/use-local-data";
import { useToast } from "@/hooks/use-toast";
import { Block } from "@/lib/schema";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    deferredInstallPrompt: any;
  }
}

type Phase = "idle" | "listening" | "processing" | "done" | "error" | "no-key";

const DAY_MAP: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

async function callGemini(apiKey: string, text: string): Promise<Block[]> {
  const prompt = `Parse this user input and extract schedule activities. Input: "${text}"
  
Return ONLY a valid JSON array of schedule blocks (no markdown, no explanation). Each block:
{
  "title": "activity name",
  "type": "work"|"learning"|"studies"|"gym"|"habits"|"free",
  "dayOfWeek": 0-6 (0=Sunday),
  "startTime": "HH:MM",
  "endTime": "HH:MM"
}

Examples:
- "I work Monday to Friday 9am to 5pm" → 5 work blocks Mon-Fri
- "gym Tuesday Thursday 6pm to 7pm" → 2 gym blocks
- "study Python every weekday 8pm to 9pm" → 5 learning blocks

Return [] if nothing can be parsed.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  return parsed.map((b: any) => ({ ...b, id: uuidv4(), notes: "" }));
}

export default function VoiceAssistant({ className }: { className?: string }) {
  const { data: settings } = useSettings();
  const saveBlock = useSaveBlock();
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [parsedBlocks, setParsedBlocks] = useState<Block[]>([]);
  const [open, setOpen] = useState(false);
  const recRef = useRef<any>(null);

  const startListening = useCallback(() => {
    if (!settings?.geminiApiKey) {
      setPhase("no-key");
      setOpen(true);
      return;
    }

    const SRClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SRClass) {
      toast({ title: "Voice not supported", description: "Your browser doesn't support voice input.", variant: "destructive" });
      return;
    }

    setOpen(true);
    setPhase("listening");
    setTranscript("");
    setParsedBlocks([]);

    const rec = new SRClass();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    recRef.current = rec;

    rec.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join(" ");
      setTranscript(t);
    };

    rec.onend = async () => {
      if (!transcript && recRef.current?.finalTranscript) {
        setTranscript(recRef.current.finalTranscript);
      }
      setPhase("processing");
      try {
        const finalText = recRef.current?.finalTranscript || transcript;
        if (!finalText.trim()) throw new Error("No speech detected");
        const blocks = await callGemini(settings!.geminiApiKey, finalText);
        setParsedBlocks(blocks);
        setPhase("done");
      } catch (err: any) {
        setPhase("error");
        toast({ title: "AI Error", description: err.message, variant: "destructive" });
      }
    };

    rec.onerror = () => {
      setPhase("error");
    };

    rec.start();
    
    // Store final transcript
    rec.addEventListener('result', (e: any) => {
      const isFinal = e.results[e.results.length - 1].isFinal;
      if (isFinal) {
        recRef.current.finalTranscript = Array.from(e.results).map((r: any) => r[0].transcript).join(" ");
      }
    });
  }, [settings, toast, transcript]);

  const stopListening = () => {
    recRef.current?.stop();
  };

  const applySchedule = async () => {
    for (const block of parsedBlocks) {
      await saveBlock.mutateAsync(block);
    }
    toast({ title: "✅ Schedule updated!", description: `Added ${parsedBlocks.length} activities from voice input.` });
    setOpen(false);
    setPhase("idle");
  };

  const close = () => {
    recRef.current?.stop();
    setOpen(false);
    setPhase("idle");
    setTranscript("");
    setParsedBlocks([]);
  };

  const TYPE_LABELS: Record<string, string> = {
    work: "Work", learning: "Learning", studies: "Studies",
    gym: "Gym", habits: "Habits", free: "Free Time"
  };
  const TYPE_COLORS: Record<string, string> = {
    work: "bg-primary/20 text-primary border-primary/30",
    learning: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    studies: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    gym: "bg-success/20 text-success border-success/30",
    habits: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    free: "bg-muted text-muted-foreground border-border",
  };
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <>
      <Button
        size="icon"
        className={cn("rounded-full h-12 w-12 shadow-lg hover:scale-105 transition-transform", className,
          phase === "listening" && "animate-pulse bg-destructive hover:bg-destructive"
        )}
        onClick={phase === "listening" ? stopListening : startListening}
        title="Voice Assistant"
      >
        {phase === "listening" ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Voice Assistant
              </h2>
              <Button size="icon" variant="ghost" onClick={close}><X className="h-4 w-4" /></Button>
            </div>

            <div className="p-6 space-y-4">
              {/* No API Key */}
              {phase === "no-key" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-destructive">API Key Required</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Voice Assistant requires a Gemini API key. Get one for free at{" "}
                        <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-primary underline">aistudio.google.com</a>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">Then add it in Settings → AI Integration.</p>
                    </div>
                  </div>
                  <Button className="w-full" onClick={close}>Go to Settings</Button>
                </div>
              )}

              {/* Listening */}
              {phase === "listening" && (
                <div className="text-center space-y-6">
                  <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-destructive/20 rounded-full animate-ping" />
                    <div className="relative w-24 h-24 bg-destructive rounded-full flex items-center justify-center">
                      <Mic className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Listening...</p>
                    <p className="text-sm text-muted-foreground mt-1">Speak clearly, then pause to stop</p>
                  </div>
                  {transcript && (
                    <div className="p-3 bg-muted rounded-lg text-sm text-left italic text-foreground/80">
                      "{transcript}"
                    </div>
                  )}
                  <Button variant="outline" onClick={stopListening}>Stop Recording</Button>
                </div>
              )}

              {/* Processing */}
              {phase === "processing" && (
                <div className="text-center space-y-4 py-4">
                  <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                  <div>
                    <p className="font-semibold">Parsing with Gemini AI...</p>
                    <p className="text-sm text-muted-foreground mt-1">Extracting schedule from your input</p>
                  </div>
                  {transcript && (
                    <div className="p-3 bg-muted rounded-lg text-sm text-left italic text-foreground/80">
                      "{transcript}"
                    </div>
                  )}
                </div>
              )}

              {/* Done */}
              {phase === "done" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Found {parsedBlocks.length} activities</span>
                  </div>
                  {transcript && (
                    <div className="p-3 bg-muted rounded-lg text-sm italic text-foreground/70">
                      "{transcript}"
                    </div>
                  )}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {parsedBlocks.map((b) => (
                      <div key={b.id} className={cn("flex items-center justify-between p-3 rounded-lg border text-sm", TYPE_COLORS[b.type])}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{b.title}</span>
                          <span className="opacity-60 text-xs">{TYPE_LABELS[b.type]}</span>
                        </div>
                        <div className="text-xs opacity-70 shrink-0 ml-2">
                          {DAYS[b.dayOfWeek]} {b.startTime}–{b.endTime}
                        </div>
                      </div>
                    ))}
                  </div>
                  {parsedBlocks.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm">No activities could be parsed. Try being more specific.</p>
                  )}
                  <div className="flex gap-2 pt-2">
                    {parsedBlocks.length > 0 && (
                      <Button className="flex-1" onClick={applySchedule}>
                        Apply to Schedule
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => { setPhase("idle"); close(); startListening(); }}>Try Again</Button>
                    <Button variant="ghost" onClick={close}>Cancel</Button>
                  </div>
                </div>
              )}

              {/* Error */}
              {phase === "error" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <p className="font-semibold text-destructive">Something went wrong</p>
                      <p className="text-sm text-muted-foreground mt-1">Check your API key in Settings and try again.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => { close(); setTimeout(startListening, 100); }}>Try Again</Button>
                    <Button variant="ghost" onClick={close}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

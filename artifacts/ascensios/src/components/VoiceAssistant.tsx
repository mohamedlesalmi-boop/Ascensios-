import { useState, useRef } from "react";
import { Mic, MicOff, Sparkles, X, AlertTriangle, CheckCircle2, Loader2, Keyboard } from "lucide-react";
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

type Phase = "idle" | "listening" | "processing" | "done" | "error" | "no-key" | "text-input";

async function callGemini(apiKey: string, text: string): Promise<Block[]> {
  const prompt = `Parse this user input and extract schedule activities. Input: "${text}"

Return ONLY a valid JSON array (no markdown code blocks, no explanation, just raw JSON).
Each object in the array must have exactly these fields:
{
  "title": "activity name",
  "type": "work" or "learning" or "studies" or "gym" or "habits" or "free",
  "dayOfWeek": number 0-6 where 0=Sunday 1=Monday 2=Tuesday 3=Wednesday 4=Thursday 5=Friday 6=Saturday,
  "startTime": "HH:MM" in 24hr format,
  "endTime": "HH:MM" in 24hr format
}

Rules:
- "Monday to Friday" = dayOfWeek 1,2,3,4,5
- "weekdays" = Monday to Friday
- "9am" = "09:00", "5pm" = "17:00", "6:30pm" = "18:30"
- If multiple days, create one object per day
- gym/workout/exercise → type "gym"
- study/course/class → type "studies"  
- code/learn/practice → type "learning"
- work/job/shift → type "work"

Example input: "I work Monday to Friday 9am to 5pm and gym Tuesday Thursday 6pm to 7pm"
Example output: [{"title":"Work","type":"work","dayOfWeek":1,"startTime":"09:00","endTime":"17:00"},{"title":"Work","type":"work","dayOfWeek":2,"startTime":"09:00","endTime":"17:00"},{"title":"Work","type":"work","dayOfWeek":3,"startTime":"09:00","endTime":"17:00"},{"title":"Work","type":"work","dayOfWeek":4,"startTime":"09:00","endTime":"17:00"},{"title":"Work","type":"work","dayOfWeek":5,"startTime":"09:00","endTime":"17:00"},{"title":"Gym","type":"gym","dayOfWeek":2,"startTime":"18:00","endTime":"19:00"},{"title":"Gym","type":"gym","dayOfWeek":4,"startTime":"18:00","endTime":"19:00"}]

Return [] if nothing can be parsed from the input.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 2048 },
      }),
    }
  );

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = errBody?.error?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

  // Strip any markdown code fences if Gemini adds them
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  let parsed: any[];
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Try to extract JSON array from the response
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error("Gemini returned invalid JSON. Try again.");
    }
  }

  if (!Array.isArray(parsed)) throw new Error("Unexpected response format. Try again.");

  return parsed
    .filter(b => b && typeof b === "object" && b.title && b.type && b.dayOfWeek !== undefined)
    .map((b: any) => ({
      id: uuidv4(),
      title: String(b.title),
      type: b.type as Block["type"],
      dayOfWeek: Number(b.dayOfWeek),
      startTime: String(b.startTime || "09:00"),
      endTime: String(b.endTime || "10:00"),
      notes: "",
    }));
}

const TYPE_LABELS: Record<string, string> = {
  work: "Work", learning: "Learning", studies: "Studies",
  gym: "Gym", habits: "Habits", free: "Free Time",
};
const TYPE_COLORS: Record<string, string> = {
  work: "bg-primary/20 text-primary border-primary/30",
  learning: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  studies: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  gym: "bg-green-500/20 text-green-400 border-green-500/30",
  habits: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  free: "bg-muted text-muted-foreground border-border",
};
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function VoiceAssistant({ className }: { className?: string }) {
  const { data: settings } = useSettings();
  const saveBlock = useSaveBlock();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [parsedBlocks, setParsedBlocks] = useState<Block[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [open, setOpen] = useState(false);

  // Refs hold the live values — no stale closure issues
  const transcriptRef = useRef("");
  const recRef = useRef<any>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const processWithGemini = async (text: string) => {
    const apiKey = settingsRef.current?.geminiApiKey;
    if (!text.trim()) {
      setErrorMsg("No text detected. Please speak or type your schedule.");
      setPhase("error");
      return;
    }
    if (!apiKey?.trim()) {
      setPhase("no-key");
      return;
    }
    setPhase("processing");
    setTranscript(text);
    try {
      const blocks = await callGemini(apiKey, text);
      setParsedBlocks(blocks);
      setPhase("done");
    } catch (err: any) {
      setErrorMsg(err.message || "Unknown error");
      setPhase("error");
    }
  };

  // Detect if we're inside a restricted iframe where Web Speech API won't work
  const isRestrictedContext = () => {
    try {
      return window.self !== window.top;
    } catch {
      return true; // cross-origin iframe
    }
  };

  const startListening = () => {
    const apiKey = settingsRef.current?.geminiApiKey;
    if (!apiKey?.trim()) {
      setPhase("no-key");
      setOpen(true);
      return;
    }

    const SRClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    // No speech API, or running inside an iframe — go straight to text input
    if (!SRClass || isRestrictedContext()) {
      setPhase("text-input");
      setOpen(true);
      return;
    }

    setOpen(true);
    setPhase("listening");
    setTranscript("");
    setTextInput("");
    setParsedBlocks([]);
    setErrorMsg("");
    transcriptRef.current = "";

    const rec = new SRClass();
    rec.continuous = true;       // Keep listening until stopped
    rec.interimResults = true;
    rec.lang = "en-US";
    recRef.current = rec;

    rec.onresult = (e: any) => {
      // Combine all results (final + interim) — write to ref immediately
      let full = "";
      for (let i = 0; i < e.results.length; i++) {
        full += e.results[i][0].transcript + " ";
      }
      const trimmed = full.trim();
      transcriptRef.current = trimmed;
      setTranscript(trimmed); // Update UI display
    };

    rec.onerror = (e: any) => {
      // "no-speech" is not a real error, just no input yet
      if (e.error === "no-speech") return;
      // "aborted" happens when we call .stop() ourselves — ignore it
      if (e.error === "aborted") return;
      // "network" error happens inside iframes/restricted environments —
      // silently fall through to text input instead of showing an error
      if (e.error === "network" || e.error === "service-not-allowed" || e.error === "not-allowed") {
        setPhase("text-input");
        return;
      }
      setErrorMsg(`Microphone error: ${e.error}.`);
      setPhase("error");
    };

    rec.onend = () => {
      // Only process if we're still in listening phase (not manually cancelled)
      setPhase(prev => {
        if (prev === "listening") {
          // Read from ref — never stale
          processWithGemini(transcriptRef.current);
          return "processing";
        }
        return prev;
      });
    };

    rec.start();
  };

  const stopListening = () => {
    // onend will fire after stop() and processWithGemini will be called
    recRef.current?.stop();
  };

  const applySchedule = async () => {
    for (const block of parsedBlocks) {
      await saveBlock.mutateAsync(block);
    }
    toast({ title: "✅ Schedule updated!", description: `Added ${parsedBlocks.length} activities from your input.` });
    close();
  };

  const close = () => {
    try { recRef.current?.stop(); } catch {}
    setOpen(false);
    setPhase("idle");
    setTranscript("");
    setTextInput("");
    setParsedBlocks([]);
    setErrorMsg("");
    transcriptRef.current = "";
  };

  const tryAgain = () => {
    setPhase("idle");
    setTranscript("");
    setTextInput("");
    setParsedBlocks([]);
    setErrorMsg("");
    transcriptRef.current = "";
    setTimeout(startListening, 100);
  };

  return (
    <>
      <Button
        size="icon"
        className={cn(
          "rounded-full h-12 w-12 shadow-lg hover:scale-105 transition-transform",
          className,
          phase === "listening" && "animate-pulse bg-red-500 hover:bg-red-500 border-red-400"
        )}
        onClick={phase === "listening" ? stopListening : startListening}
        title="Voice Assistant — speak your schedule"
      >
        {phase === "listening" ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> AI Schedule Assistant
              </h2>
              <Button size="icon" variant="ghost" onClick={close}><X className="h-4 w-4" /></Button>
            </div>

            <div className="p-6 space-y-4">

              {/* No API Key */}
              {phase === "no-key" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="font-semibold text-destructive">Gemini API Key Required</p>
                      <p className="text-sm text-muted-foreground">
                        Get a free key at{" "}
                        <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-primary underline font-medium">
                          aistudio.google.com
                        </a>
                        , then add it in <strong>Settings → AI Integration</strong>.
                      </p>
                    </div>
                  </div>
                  <Button className="w-full" onClick={close}>Got it</Button>
                </div>
              )}

              {/* Listening */}
              {phase === "listening" && (
                <div className="text-center space-y-5">
                  <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                    <div className="relative w-24 h-24 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                      <Mic className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-lg">Listening...</p>
                    <p className="text-sm text-muted-foreground mt-1">Speak your schedule, then tap Stop</p>
                    <p className="text-xs text-muted-foreground mt-1 italic">e.g. "I work Monday to Friday 9am to 5pm, gym Tuesday 6pm"</p>
                  </div>
                  {transcript && (
                    <div className="p-3 bg-muted rounded-lg text-sm text-left italic text-foreground/80 border border-border">
                      "{transcript}"
                    </div>
                  )}
                  <div className="flex gap-2 justify-center">
                    <Button onClick={stopListening} className="gap-2">
                      <MicOff className="h-4 w-4" /> Stop &amp; Parse
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => setPhase("text-input")}>
                      <Keyboard className="h-4 w-4" /> Type instead
                    </Button>
                  </div>
                </div>
              )}

              {/* Text Input Fallback */}
              {phase === "text-input" && (
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold mb-1">Describe your schedule</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Type naturally — Gemini AI will extract your schedule automatically.
                    </p>
                    <textarea
                      autoFocus
                      className="w-full h-28 p-3 bg-background border border-input rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder={`Examples:\n"I work Monday to Friday 9am to 5pm"\n"Gym Tuesday and Thursday at 6pm to 7pm"\n"Study Python every evening 8pm to 10pm"`}
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 gap-2" onClick={() => processWithGemini(textInput)} disabled={!textInput.trim()}>
                      <Sparkles className="h-4 w-4" /> Parse with AI
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => { setPhase("listening"); startListening(); }}>
                      <Mic className="h-4 w-4" /> Use Voice
                    </Button>
                  </div>
                </div>
              )}

              {/* Processing */}
              {phase === "processing" && (
                <div className="text-center space-y-4 py-6">
                  <Loader2 className="h-14 w-14 text-primary animate-spin mx-auto" />
                  <div>
                    <p className="font-bold text-lg">Parsing with Gemini AI...</p>
                    <p className="text-sm text-muted-foreground mt-1">Extracting your schedule activities</p>
                  </div>
                  {transcript && (
                    <div className="p-3 bg-muted rounded-lg text-sm text-left italic text-foreground/70 border border-border">
                      "{transcript}"
                    </div>
                  )}
                </div>
              )}

              {/* Done */}
              {phase === "done" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Found {parsedBlocks.length} {parsedBlocks.length === 1 ? "activity" : "activities"}</span>
                  </div>
                  {transcript && (
                    <div className="p-2.5 bg-muted rounded-lg text-xs italic text-foreground/60 border border-border">
                      "{transcript}"
                    </div>
                  )}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {parsedBlocks.map((b) => (
                      <div key={b.id} className={cn("flex items-center justify-between p-3 rounded-lg border text-sm", TYPE_COLORS[b.type])}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold truncate">{b.title}</span>
                          <span className="opacity-60 text-xs shrink-0">{TYPE_LABELS[b.type]}</span>
                        </div>
                        <span className="text-xs opacity-75 shrink-0 ml-2 font-medium">
                          {DAYS[b.dayOfWeek]} · {b.startTime}–{b.endTime}
                        </span>
                      </div>
                    ))}
                    {parsedBlocks.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-4">
                        No activities could be parsed. Try being more specific about days and times.
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    {parsedBlocks.length > 0 && (
                      <Button className="flex-1" onClick={applySchedule}>Apply to Schedule</Button>
                    )}
                    <Button variant="outline" onClick={tryAgain}>Try Again</Button>
                    <Button variant="ghost" onClick={close}>Cancel</Button>
                  </div>
                </div>
              )}

              {/* Error */}
              {phase === "error" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                    <div className="space-y-1 min-w-0">
                      <p className="font-semibold text-destructive">Something went wrong</p>
                      {errorMsg && (
                        <p className="text-xs text-muted-foreground font-mono break-all bg-black/20 rounded px-2 py-1 mt-1">
                          {errorMsg}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Make sure your Gemini API key is correct in Settings, or try typing your schedule instead.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 gap-2" onClick={() => setPhase("text-input")}>
                      <Keyboard className="h-4 w-4" /> Type Schedule
                    </Button>
                    <Button variant="outline" onClick={tryAgain} className="gap-2">
                      <Mic className="h-4 w-4" /> Try Again
                    </Button>
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

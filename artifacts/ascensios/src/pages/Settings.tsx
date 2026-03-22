import { useSettings, useUpdateSettings } from "@/hooks/use-local-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Save, Download, Trash2, Key, Upload, Archive, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const LS_KEYS = ["settings", "blocks", "courses", "learningGoals", "habits", "friends"] as const;

function exportData(): string {
  const data: Record<string, any> = {};
  LS_KEYS.forEach(key => {
    try { data[key] = JSON.parse(localStorage.getItem(`ascensios_${key}`) || "null"); } catch {}
  });
  data._exportedAt = new Date().toISOString();
  data._version = "1.0";
  return JSON.stringify(data, null, 2);
}

function downloadJSON(content: string, filename: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function archiveOldData() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  // Archive old habit history
  try {
    const habits = JSON.parse(localStorage.getItem("ascensios_habits") || "[]");
    const updated = habits.map((h: any) => ({
      ...h,
      history: Object.fromEntries(
        Object.entries(h.history || {}).filter(([d]) => d >= cutoffStr)
      )
    }));
    localStorage.setItem("ascensios_habits", JSON.stringify(updated));
  } catch {}
}

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Record<string, any>>(settings || {});
  const [clearConfirm, setClearConfirm] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateSettings.mutate(formData, {
      onSuccess: () => {
        toast({ title: "✅ Settings saved", description: "Your preferences have been updated." });
      }
    });
  };

  const handleExport = () => {
    const data = exportData();
    const date = new Date().toISOString().split("T")[0];
    downloadJSON(data, `ascensios-backup-${date}.json`);
    toast({ title: "✅ Data exported", description: "Your backup file has been downloaded." });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        LS_KEYS.forEach(key => {
          if (data[key] !== undefined && data[key] !== null) {
            localStorage.setItem(`ascensios_${key}`, JSON.stringify(data[key]));
          }
        });
        queryClient.invalidateQueries();
        toast({ title: "✅ Data imported", description: "All data has been restored from backup." });
      } catch {
        toast({ title: "Import failed", description: "Invalid backup file format.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleClearAll = () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      return;
    }
    LS_KEYS.forEach(key => localStorage.removeItem(`ascensios_${key}`));
    queryClient.invalidateQueries();
    setClearConfirm(false);
    toast({ title: "Data cleared", description: "All data has been permanently deleted.", variant: "destructive" });
  };

  const handleArchive = () => {
    archiveOldData();
    queryClient.invalidateQueries();
    toast({ title: "✅ Data archived", description: "Entries older than 30 days have been archived." });
  };

  if (isLoading) return (
    <div className="flex justify-center p-8">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your Ascensios experience</p>
      </div>

      {/* Profile & Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile & Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" value={formData.name || ""} onChange={e => handleChange("name", e.target.value)} className="max-w-sm bg-background" placeholder="Your name" />
          </div>
          <div className="flex items-center justify-between max-w-sm">
            <div>
              <Label>Dark Mode</Label>
              <p className="text-xs text-muted-foreground">Jira-inspired dark theme</p>
            </div>
            <Switch checked={formData.theme === "dark"} onCheckedChange={c => handleChange("theme", c ? "dark" : "light")} />
          </div>
        </CardContent>
      </Card>

      {/* AI Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Key className="w-4 h-4" /> AI Integration</CardTitle>
          <CardDescription>
            Ascensios uses Gemini 2.0 Flash for voice scheduling, roadmaps, and insights.
            Your key is stored only in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="apiKey">Gemini API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="AIzaSy..."
              value={formData.geminiApiKey || ""}
              onChange={e => handleChange("geminiApiKey", e.target.value)}
              className="max-w-sm font-mono bg-background"
            />
            <p className="text-xs text-muted-foreground">
              Get one free at{" "}
              <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">
                aistudio.google.com
              </a>
              {" "}→ Used for Voice Assistant, AI Briefing, and Smart Scheduling.
            </p>
          </div>
          {formData.geminiApiKey && (
            <div className="flex items-center gap-2 text-xs text-success">
              <span className="w-2 h-2 rounded-full bg-success inline-block" />
              API key configured
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div className="space-y-1.5">
              <Label>Wake Time</Label>
              <Input type="time" value={formData.wakeTime || "07:00"} onChange={e => handleChange("wakeTime", e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label>Sleep Target (hrs)</Label>
              <Input type="number" step="0.5" min="4" max="12" value={formData.sleepTarget || 7.5} onChange={e => handleChange("sleepTarget", parseFloat(e.target.value))} className="bg-background" />
            </div>
          </div>
          <div className="flex items-center justify-between max-w-sm">
            <div>
              <Label>Notifications</Label>
              <p className="text-xs text-muted-foreground">Activity reminders</p>
            </div>
            <Switch checked={!!formData.notificationsEnabled} onCheckedChange={c => handleChange("notificationsEnabled", c)} />
          </div>
          {formData.notificationsEnabled && (
            <div className="space-y-1.5 max-w-sm">
              <Label>Remind me before activity</Label>
              <div className="flex gap-2 flex-wrap">
                {[5, 10, 15, 30].map(mins => (
                  <button
                    key={mins}
                    onClick={() => handleChange("notificationLeadTime", mins)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium border transition-colors",
                      (formData.notificationLeadTime ?? 15) === mins
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                    )}
                  >{mins} min</button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                You'll get notified {formData.notificationLeadTime ?? 15} minutes before each scheduled activity
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save */}
      <Button onClick={handleSave} className="gap-2 w-full sm:w-auto" disabled={updateSettings.isPending}>
        <Save className="w-4 h-4" /> {updateSettings.isPending ? "Saving..." : "Save Changes"}
      </Button>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Management</CardTitle>
          <CardDescription>Your data never leaves your device — all stored in your browser's localStorage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export */}
          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
            <div>
              <p className="text-sm font-medium">Export Data</p>
              <p className="text-xs text-muted-foreground">Download a full JSON backup of all your data</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>

          {/* Import */}
          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
            <div>
              <p className="text-sm font-medium">Import Data</p>
              <p className="text-xs text-muted-foreground">Restore from a previous JSON backup</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => importRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" /> Import
            </Button>
            <input ref={importRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImport} />
          </div>

          {/* Archive */}
          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
            <div>
              <p className="text-sm font-medium">Archive Old Data</p>
              <p className="text-xs text-muted-foreground">Remove habit history older than 30 days to free space</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={handleArchive}>
              <Archive className="h-3.5 w-3.5" /> Archive
            </Button>
          </div>

          {/* Clear All */}
          <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${clearConfirm ? "bg-destructive/10 border-destructive/30" : "bg-muted/40 border-transparent"}`}>
            <div>
              <p className="text-sm font-medium text-destructive">Clear All Data</p>
              {clearConfirm
                ? <p className="text-xs text-destructive font-medium">⚠️ This will delete EVERYTHING permanently. Click again to confirm.</p>
                : <p className="text-xs text-muted-foreground">Permanently delete all schedules, habits, goals and settings</p>
              }
            </div>
            <div className="flex gap-2 shrink-0">
              {clearConfirm && (
                <Button variant="outline" size="sm" onClick={() => setClearConfirm(false)}>Cancel</Button>
              )}
              <Button variant="destructive" size="sm" className="gap-1.5" onClick={handleClearAll}>
                <Trash2 className="h-3.5 w-3.5" />
                {clearConfirm ? "Confirm Delete" : "Clear All"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Ascensios</span>
            <span>Version 1.0.0</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Productivity Command Center · Built with React + Gemini AI</p>
        </CardContent>
      </Card>
    </div>
  );
}

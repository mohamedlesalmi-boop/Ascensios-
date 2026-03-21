import { useSettings, useUpdateSettings } from "@/hooks/use-local-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Save, Download, Trash2, Key } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<Record<string, any>>(settings || {});

  useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateSettings.mutate(formData, {
      onSuccess: () => {
        toast({ title: "Settings saved", description: "Your preferences have been updated." });
      }
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your Ascensios experience</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile & Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input 
              id="name" 
              value={formData.name || ""} 
              onChange={e => handleChange('name', e.target.value)} 
              className="max-w-md bg-background"
            />
          </div>
          
          <div className="flex items-center justify-between max-w-md pt-4">
            <div className="space-y-0.5">
              <Label>Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Jira-inspired dark theme</p>
            </div>
            <Switch 
              checked={formData.theme === 'dark'} 
              onCheckedChange={c => handleChange('theme', c ? 'dark' : 'light')} 
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="w-5 h-5" /> AI Integration</CardTitle>
          <CardDescription>
            Ascensios uses Gemini 1.5 Flash for smart scheduling and insights. 
            Your key is stored locally in your browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Gemini API Key</Label>
            <Input 
              id="apiKey" 
              type="password"
              placeholder="AIzaSy..."
              value={formData.geminiApiKey || ""} 
              onChange={e => handleChange('geminiApiKey', e.target.value)} 
              className="max-w-md font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Get one for free at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">aistudio.google.com</a>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="space-y-2">
              <Label>Wake Time</Label>
              <Input 
                type="time" 
                value={formData.wakeTime || "07:00"} 
                onChange={e => handleChange('wakeTime', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sleep Target (hrs)</Label>
              <Input 
                type="number" 
                step="0.5"
                value={formData.sleepTarget || 7.5} 
                onChange={e => handleChange('sleepTarget', parseFloat(e.target.value))}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between max-w-md pt-4">
            <div className="space-y-0.5">
              <Label>Notifications</Label>
              <p className="text-sm text-muted-foreground">Activity reminders</p>
            </div>
            <Switch 
              checked={formData.notificationsEnabled} 
              onCheckedChange={c => handleChange('notificationsEnabled', c)} 
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button onClick={handleSave} className="gap-2 flex-1 md:flex-none">
          <Save className="w-4 h-4" /> Save Changes
        </Button>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export Data
        </Button>
        <Button variant="destructive" className="gap-2 ml-auto">
          <Trash2 className="w-4 h-4" /> Reset All
        </Button>
      </div>
    </div>
  );
}

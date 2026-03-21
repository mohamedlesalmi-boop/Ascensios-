import { useState } from "react";
import { useFriends, useSaveFriend, useDeleteFriend } from "@/hooks/use-local-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Users, MessageCircle, Calendar, User } from "lucide-react";
import { Friend } from "@/lib/schema";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-primary/20 text-primary",
  "bg-success/20 text-success",
  "bg-chart-4/20 text-chart-4",
  "bg-destructive/20 text-destructive",
  "bg-chart-3/20 text-chart-3",
];

export default function Community() {
  const { data: friends = [] } = useFriends();
  const saveFriend = useSaveFriend();
  const deleteFriend = useDeleteFriend();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", contactNote: "" });
  const [socialGoals, setSocialGoals] = useState<string[]>([
    "Weekly study session with Sarah",
    "Gym buddy check-in on Mon/Wed",
    "Monthly progress review with team",
  ]);
  const [newGoal, setNewGoal] = useState("");

  const handleAdd = () => {
    if (!form.name) return;
    saveFriend.mutate({ ...form, id: uuidv4() });
    setForm({ name: "", contactNote: "" });
    setShowForm(false);
  };

  const handleAddGoal = () => {
    if (!newGoal.trim()) return;
    setSocialGoals(g => [...g, newGoal.trim()]);
    setNewGoal("");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Community</h1>
          <p className="text-muted-foreground">Study partners &amp; social connections</p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Add Contact
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader><CardTitle>Add Study Partner</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Name</label>
                <input
                  className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Sarah Johnson"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Contact Note</label>
                <input
                  className="w-full h-10 px-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Study partner for Algorithms"
                  value={form.contactNote}
                  onChange={e => setForm(f => ({ ...f, contactNote: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAdd}>Add Contact</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Contacts ({friends.length})
          </h2>
          
          {friends.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border border-dashed rounded-lg">
              <Users className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium">No contacts yet</p>
              <p className="text-sm">Add study partners and friends</p>
            </div>
          )}

          {friends.map((friend, i) => (
            <Card key={friend.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0",
                    AVATAR_COLORS[i % AVATAR_COLORS.length]
                  )}>
                    {friend.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground">{friend.name}</h3>
                    {friend.contactNote && (
                      <p className="text-sm text-muted-foreground truncate">{friend.contactNote}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs hidden sm:flex"
                    >
                      <Calendar className="h-3 w-3" /> Schedule
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteFriend.mutate(friend.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" /> Social Goals
            </CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {socialGoals.map((goal, i) => (
                <div key={i} className="flex items-start gap-2 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm text-foreground/80 flex-1">{goal}</span>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                    onClick={() => setSocialGoals(g => g.filter((_, j) => j !== i))}
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <input
                  className="flex-1 h-8 px-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Add goal..."
                  value={newGoal}
                  onChange={e => setNewGoal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddGoal()}
                />
                <Button size="sm" onClick={handleAddGoal}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Quick Stats</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Study Partners", value: friends.length, icon: User },
                { label: "Social Goals", value: socialGoals.length, icon: MessageCircle },
                { label: "Meetups/week", value: 2, icon: Calendar },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                  <span className="font-bold text-primary">{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

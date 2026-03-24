import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { HardDrive, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

export default function ProfileSetup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !actor) return;
    setSaving(true);
    try {
      await actor.saveCallerUserProfile({ name: name.trim() });
      await queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      toast.success("Profile created!");
    } catch {
      toast.error("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
            <HardDrive className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">
            My Files
          </span>
        </div>

        <h2 className="font-display text-2xl font-bold mb-1 text-foreground">
          Set your name
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          How should we address you?
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm text-muted-foreground">
              Display name
            </Label>
            <Input
              data-ocid="profile.input"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Chen"
              className="bg-card border-border"
              autoFocus
            />
          </div>
          <Button
            data-ocid="profile.submit_button"
            type="submit"
            className="w-full"
            disabled={!name.trim() || saving}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {saving ? "Saving..." : "Get started"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

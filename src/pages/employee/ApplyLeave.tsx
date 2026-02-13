import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function ApplyLeave() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    type: "" as string,
    from_date: "",
    to_date: "",
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (form.to_date < form.from_date) {
      toast({ title: "Invalid dates", description: "End date cannot be before start date.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("leaves").insert({
      employee_id: user.id,
      leave_type: form.type, // Map form.type to leave_type
      start_date: form.from_date, // Map form.from_date to start_date
      end_date: form.to_date, // Map form.to_date to end_date
      reason: form.reason,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Leave Applied", description: "Your leave request has been submitted." });
      navigate("/my-leaves");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Apply Leave</h1>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Leave Type *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full">Full Day</SelectItem>
                  <SelectItem value="Half">Half Day</SelectItem>
                  <SelectItem value="Permission">Permission</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date *</Label>
                <Input type="date" required value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>To Date *</Label>
                <Input type="date" required value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Explain your reason..." />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Leave Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

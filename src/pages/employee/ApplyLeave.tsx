import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
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
    type: "Full",
    date: "", // Single date for all types as per requirement
    start_time: "",
    end_time: "",
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const payload: any = {
      employee_id: user.id,
      leave_type: form.type,
      start_date: form.date,
      end_date: form.date, // Single date logic
      reason: form.reason,
    };

    if (form.type !== "Full") {
        if (!form.start_time || !form.end_time) {
            toast({ title: "Time Required", description: "Please select start and end time.", variant: "destructive" });
            setLoading(false);
            return;
        }
        payload.start_time = form.start_time;
        payload.end_time = form.end_time;
    }

    const { error } = await supabase.from("leaves").insert(payload);

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

            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>

            {form.type !== "Full" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time *</Label>
                    <Input type="time" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time *</Label>
                    <Input type="time" required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                  </div>
                </div>
            )}

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

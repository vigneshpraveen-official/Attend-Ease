import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Clock, LogIn, LogOut } from "lucide-react";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [weekRecords, setWeekRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const fetchToday = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", user.id)
      .eq("date", today)
      .maybeSingle();
    setTodayRecord(data);
  };

  const fetchWeek = async () => {
    if (!user) return;
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", user.id)
      .in("date", days)
      .order("date", { ascending: false });
    setWeekRecords(data ?? []);
  };

  useEffect(() => {
    fetchToday();
    fetchWeek();
  }, [user]);

  const handlePunchIn = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("attendance").insert({
      employee_id: user.id,
      date: today,
      check_in: new Date().toISOString(),
      status: "present",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Punched In", description: "Your attendance has been recorded." });
      fetchToday();
      fetchWeek();
    }
    setLoading(false);
  };

  const handlePunchOut = async () => {
    if (!user || !todayRecord) return;
    setLoading(true);
    const punchOut = new Date();
    const punchIn = new Date(todayRecord.check_in);
    const hours = Math.round(((punchOut.getTime() - punchIn.getTime()) / 3600000) * 100) / 100;

    const { error } = await supabase
      .from("attendance")
      .update({
        check_out: punchOut.toISOString(),
        // total_hours: hours, // Database doesn't have total_hours column in schema provided, assuming it might be calculated or missing. 
        // Wait, schema didn't show total_hours. Let's check schema again.
        // Schema: id, employee_id, date, check_in, check_out, status, created_at.
        // So total_hours is NOT in DB. We should probably not try to update it or add it to schema.
        // For now, I will remove total_hours from update to avoid error, or just update status.
        status: hours < 4 ? "half-day" : "present",
      })
      .eq("id", todayRecord.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Punched Out", description: `Total hours: ${hours}h` });
      fetchToday();
      fetchWeek();
    }
    setLoading(false);
  };

  const hasPunchedIn = !!todayRecord?.check_in;
  const hasPunchedOut = !!todayRecord?.check_out;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Today's Attendance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasPunchedIn && (
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Punch In:</span> {new Date(todayRecord.check_in).toLocaleTimeString()}</p>
                {hasPunchedOut && (
                  <>
                    <p><span className="text-muted-foreground">Punch Out:</span> {new Date(todayRecord.check_out).toLocaleTimeString()}</p>
                    {/* Calculate hours on the fly since DB doesn't store it */}
                    <p><span className="text-muted-foreground">Total Hours:</span> {
                        (Math.round(((new Date(todayRecord.check_out).getTime() - new Date(todayRecord.check_in).getTime()) / 3600000) * 100) / 100)
                    }h</p>
                  </>
                )}
              </div>
            )}
            {!hasPunchedIn ? (
              <Button onClick={handlePunchIn} disabled={loading} className="w-full">
                <LogIn className="h-4 w-4 mr-2" />
                Punch In
              </Button>
            ) : !hasPunchedOut ? (
              <Button onClick={handlePunchOut} disabled={loading} variant="destructive" className="w-full">
                <LogOut className="h-4 w-4 mr-2" />
                Punch Out
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground text-center">You're done for today ✓</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Week</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weekRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-4">No records</TableCell>
                  </TableRow>
                ) : (
                  weekRecords.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.date).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}</TableCell>
                      <TableCell>{r.total_hours ? `${r.total_hours}h` : "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          r.status === "Present" ? "bg-success/10 text-success border-success/20" :
                          r.status === "Absent" ? "bg-destructive/10 text-destructive border-destructive/20" :
                          "bg-warning/10 text-warning border-warning/20"
                        }>{r.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

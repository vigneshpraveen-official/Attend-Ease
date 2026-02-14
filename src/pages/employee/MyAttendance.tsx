import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function MyAttendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .eq("employee_id", user.id)
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false });
      setRecords(data ?? []);
    };
    fetch();
  }, [user, from, to]);

  const statusColor = (s: string) => {
    if (s === "Present") return "bg-success/10 text-success border-success/20";
    if (s === "Absent") return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-warning/10 text-warning border-warning/20";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Attendance</h1>

      <div className="flex gap-4 max-w-md">
        <div className="space-y-2 flex-1">
          <Label>From</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-2 flex-1">
          <Label>To</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Punch In</TableHead>
                <TableHead>Punch Out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No records found</TableCell>
                </TableRow>
              ) : (
                records.map((r) => {
                  let hours = r.total_hours;
                  if (!hours && r.check_in && r.check_out) {
                      hours = Math.round(((new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / 3600000) * 100) / 100;
                  }
                  return (
                  <TableRow key={r.id}>
                    <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                    <TableCell>{r.check_in ? new Date(r.check_in).toLocaleTimeString() : "—"}</TableCell>
                    <TableCell>{r.check_out ? new Date(r.check_out).toLocaleTimeString() : "—"}</TableCell>
                    <TableCell>{hours ? `${hours}h` : "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor(r.status)}>{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                )})
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

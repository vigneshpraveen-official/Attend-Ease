import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AttendanceRow {
  id: string;
  date: string;
  punch_in: string | null;
  punch_out: string | null;
  total_hours: number | null;
  status: string;
  employee_name: string;
}

export default function AttendanceView() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [rows, setRows] = useState<AttendanceRow[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data: attendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", date)
        .order("punch_in", { ascending: true });

      if (!attendance?.length) {
        setRows([]);
        return;
      }

      const employeeIds = [...new Set(attendance.map((a) => a.employee_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", employeeIds);

      const nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p.full_name]));

      setRows(
        attendance.map((a) => ({
          ...a,
          employee_name: nameMap[a.employee_id] || "Unknown",
        }))
      );
    };
    fetch();
  }, [date]);

  const statusColor = (s: string) => {
    if (s === "Present") return "bg-success/10 text-success border-success/20";
    if (s === "Absent") return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-warning/10 text-warning border-warning/20";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Attendance</h1>

      <div className="max-w-xs space-y-2">
        <Label>Select Date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Punch In</TableHead>
                <TableHead>Punch Out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No attendance records for this date
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.employee_name}</TableCell>
                    <TableCell>{r.punch_in ? new Date(r.punch_in).toLocaleTimeString() : "—"}</TableCell>
                    <TableCell>{r.punch_out ? new Date(r.punch_out).toLocaleTimeString() : "—"}</TableCell>
                    <TableCell>{r.total_hours ? `${r.total_hours}h` : "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor(r.status)}>{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

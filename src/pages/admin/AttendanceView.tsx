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
  check_in: string | null;
  check_out: string | null;
  // total_hours: number | null; // Not in DB, calculate on fly
  status: string;
  employee_name: string;
}

export default function AttendanceView() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [rows, setRows] = useState<AttendanceRow[]>([]);

  useEffect(() => {
    const fetch = async () => {
      // Fetch attendance for the date
      const { data: attendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", date)
        .order("check_in", { ascending: true });

      if (!attendance?.length) {
        setRows([]);
        return;
      }

      // Fetch employee names
      const employeeIds = [...new Set(attendance.map((a) => a.employee_id))];
      const { data: employees } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .in("id", employeeIds);

      const nameMap = Object.fromEntries((employees ?? []).map((e) => [e.id, `${e.first_name} ${e.last_name}`]));

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
    const status = s?.toLowerCase();
    if (status === "present") return "bg-success/10 text-success border-success/20";
    if (status === "absent") return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-warning/10 text-warning border-warning/20";
  };

  const calculateHours = (inTime: string | null, outTime: string | null) => {
      if (!inTime || !outTime) return "—";
      const hours = Math.round(((new Date(outTime).getTime() - new Date(inTime).getTime()) / 3600000) * 100) / 100;
      return `${hours}h`;
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
                    <TableCell>{r.check_in ? new Date(r.check_in).toLocaleTimeString() : "—"}</TableCell>
                    <TableCell>{r.check_out ? new Date(r.check_out).toLocaleTimeString() : "—"}</TableCell>
                    <TableCell>{calculateHours(r.check_in, r.check_out)}</TableCell>
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

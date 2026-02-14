import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, CalendarOff, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Stats {
  totalEmployees: number;
  presentToday: number;
  onLeaveToday: number;
  pendingLeaves: number;
}

interface ChartData {
  date: string;
  present: number;
  absent: number;
  leave: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    presentToday: 0,
    onLeaveToday: 0,
    pendingLeaves: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [range, setRange] = useState<"week" | "month">("week");

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split("T")[0];

      const [employees, attendance, leaves, pendingLeaves] = await Promise.all([
        supabase.from("employees").select("id", { count: "exact", head: true }),
        supabase.from("attendance").select("id", { count: "exact", head: true }).eq("date", today).eq("status", "present"),
        supabase.from("leaves").select("id", { count: "exact", head: true }).eq("status", "approved").lte("start_date", today).gte("end_date", today),
        supabase.from("leaves").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      setStats({
        totalEmployees: employees.count ?? 0,
        presentToday: attendance.count ?? 0,
        onLeaveToday: leaves.count ?? 0,
        pendingLeaves: pendingLeaves.count ?? 0,
      });
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchChart = async () => {
      const daysCount = range === "week" ? 7 : 30;
      const days: string[] = [];
      const today = new Date();
      
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        days.push(d.toISOString().split("T")[0]);
      }

      // Fetch Attendance
      const { data: attendance } = await supabase
        .from("attendance")
        .select("date, status")
        .in("date", days);

      // Fetch Leaves
      const { data: leaves } = await supabase
        .from("leaves")
        .select("start_date, end_date")
        .eq("status", "approved")
        .or(`start_date.lte.${days[days.length-1]},end_date.gte.${days[0]}`);

      // Process Data
      const { count: totalEmployees } = await supabase.from("employees").select("id", { count: "exact", head: true });
      const total = totalEmployees ?? 0;

      const dataMap: Record<string, { present: number; absent: number; leave: number }> = {};
      days.forEach(d => dataMap[d] = { present: 0, absent: 0, leave: 0 });

      attendance?.forEach(r => {
        if (dataMap[r.date]) {
            const s = r.status?.toLowerCase();
            if (s === "present" || s === "late" || s === "half-day") dataMap[r.date].present++;
            // Explicit absent records are rare if we calculate implied, but keep counting them if they exist
            // Actually, if we calculate implied, we shouldn't double count. 
            // Strategy: Count explicit present/leave. Derive absent.
        }
      });

      days.forEach(day => {
          leaves?.forEach(l => {
              if (day >= l.start_date && day <= l.end_date) {
                  dataMap[day].leave++;
              }
          });
          
          // Calculate Absent
          const presentOrLeave = dataMap[day].present + dataMap[day].leave;
          // Absent is remainder. Ensure non-negative.
          // Note: This assumes total employees is constant.
          dataMap[day].absent = Math.max(0, total - presentOrLeave);
      });

      setChartData(days.map(date => ({
          date: new Date(date).toLocaleDateString("en", { day: "numeric", month: "short" }),
          ...dataMap[date]
      })));
    };

    fetchChart();
  }, [range]);

  const cards = [
    { title: "Total Employees", value: stats.totalEmployees, icon: Users, color: "text-primary" },
    { title: "Present Today", value: stats.presentToday, icon: UserCheck, color: "text-success" },
    { title: "On Leave Today", value: stats.onLeaveToday, icon: CalendarOff, color: "text-warning" },
    { title: "Pending Requests", value: stats.pendingLeaves, icon: FileText, color: "text-info" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Attendance Overview</CardTitle>
          <Select value={range} onValueChange={(v: any) => setRange(v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" name="Present" fill="#22c55e" stackId="a" radius={[0, 0, 4, 4]} />
                <Bar dataKey="absent" name="Absent" fill="#ef4444" stackId="a" />
                <Bar dataKey="leave" name="On Leave" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

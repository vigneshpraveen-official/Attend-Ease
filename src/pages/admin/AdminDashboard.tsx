import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, CalendarOff, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Stats {
  totalEmployees: number;
  presentToday: number;
  onLeaveToday: number;
  pendingLeaves: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    presentToday: 0,
    onLeaveToday: 0,
    pendingLeaves: 0,
  });
  const [weeklyData, setWeeklyData] = useState<{ day: string; present: number }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split("T")[0];

      const [employees, attendance, leaves, pendingLeaves] = await Promise.all([
        supabase.from("employees").select("id", { count: "exact", head: true }),
        supabase.from("attendance").select("id", { count: "exact", head: true }).eq("date", today).eq("status", "Present"),
        supabase.from("leaves").select("id", { count: "exact", head: true }).eq("status", "Approved").lte("from_date", today).gte("to_date", today),
        supabase.from("leaves").select("id", { count: "exact", head: true }).eq("status", "Pending"),
      ]);

      setStats({
        totalEmployees: employees.count ?? 0,
        presentToday: attendance.count ?? 0,
        onLeaveToday: leaves.count ?? 0,
        pendingLeaves: pendingLeaves.count ?? 0,
      });
    };

    const fetchWeekly = async () => {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split("T")[0]);
      }

      const { data } = await supabase
        .from("attendance")
        .select("date, status")
        .in("date", days)
        .eq("status", "Present");

      const counts: Record<string, number> = {};
      days.forEach((d) => (counts[d] = 0));
      data?.forEach((r) => {
        counts[r.date] = (counts[r.date] || 0) + 1;
      });

      setWeeklyData(
        days.map((d) => ({
          day: new Date(d).toLocaleDateString("en", { weekday: "short" }),
          present: counts[d],
        }))
      );
    };

    fetchStats();
    fetchWeekly();
  }, []);

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
        <CardHeader>
          <CardTitle className="text-lg">Weekly Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="present" fill="hsl(220, 70%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ["#22c55e", "#ef4444", "#f59e0b", "#3b82f6", "#a855f7"]; // Green, Red, Orange, Blue, Purple

export default function Reports() {
  const [deptData, setDeptData] = useState<{ department: string; count: number }[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("daily");

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Employees & Dept Data (Static)
      const { data: employees, count: totalCount } = await supabase.from("employees").select("department", { count: "exact" });
      const totalEmployees = totalCount || 0;
      
      const deptCounts: Record<string, number> = {};
      employees?.forEach((e) => {
        const dept = e.department || "Unassigned";
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });
      setDeptData(Object.entries(deptCounts).map(([department, count]) => ({ department, count })));

      // 2. Calculate Date Range
      const today = new Date();
      const startDate = new Date(today);
      let daysCount = 1;

      if (range === "weekly") {
          startDate.setDate(today.getDate() - 6);
          daysCount = 7;
      } else if (range === "monthly") {
          startDate.setDate(today.getDate() - 29);
          daysCount = 30;
      }
      
      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = today.toISOString().split("T")[0];

      // 3. Fetch Attendance & Leaves
      let attendanceQuery = supabase
        .from("attendance")
        .select("status, date")
        .lte("date", endDateStr);
        
      if (range === "daily") attendanceQuery = attendanceQuery.eq("date", endDateStr);
      else attendanceQuery = attendanceQuery.gte("date", startDateStr);

      const { data: attendance } = await attendanceQuery;

      const { data: leaves } = await supabase
        .from("leaves")
        .select("start_date, end_date")
        .eq("status", "approved")
        .or(`start_date.lte.${endDateStr},end_date.gte.${startDateStr}`);

      // 4. Process Counts
      const sCounts: Record<string, number> = { Present: 0, Absent: 0, "Half Day": 0, Late: 0, Leave: 0 };
      
      // Count Present/Late/Half-Day
      let totalPresentDays = 0;
      attendance?.forEach((a) => {
        const s = a.status?.toLowerCase();
        if (s === "present") sCounts["Present"]++;
        else if (s === "half-day" || s === "half day") sCounts["Half Day"]++;
        else if (s === "late") sCounts["Late"]++;
        
        if (s === "present" || s === "half-day" || s === "half day" || s === "late") {
            totalPresentDays++;
        }
      });

      // Count Leaves (Man-Days in Range)
      let totalLeaveDays = 0;
      leaves?.forEach(l => {
          // Calculate overlap between [start, end] and [rangeStart, rangeEnd]
          const lStart = new Date(l.start_date);
          const lEnd = new Date(l.end_date);
          
          // Clamp to range
          const effectiveStart = new Date(Math.max(lStart.getTime(), startDate.getTime()));
          const effectiveEnd = new Date(Math.min(lEnd.getTime(), today.getTime()));
          
          if (effectiveEnd >= effectiveStart) {
              const days = Math.floor((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 3600 * 24)) + 1;
              totalLeaveDays += days;
          }
      });
      sCounts["Leave"] = totalLeaveDays;

      // 5. Calculate Implied Absent
      // Total Potential Man-Days = Total Employees * Days in Range
      const totalPotential = totalEmployees * daysCount;
      const totalRecorded = totalPresentDays + totalLeaveDays;
      sCounts["Absent"] = Math.max(0, totalPotential - totalRecorded);

      // Filter out zero values
      setStatusData(Object.entries(sCounts)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({ name, value }))
      );
    };

    fetchData();
  }, [range]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Employees by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="department" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(220, 70%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Attendance Status</CardTitle>
            <Select value={range} onValueChange={(v: any) => setRange(v)}>
                <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Range" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="daily">Today</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

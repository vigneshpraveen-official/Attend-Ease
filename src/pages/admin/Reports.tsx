import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["hsl(160, 60%, 45%)", "hsl(0, 72%, 51%)", "hsl(38, 92%, 50%)"];

export default function Reports() {
  const [deptData, setDeptData] = useState<{ department: string; count: number }[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: profiles } = await supabase.from("profiles").select("department");
      const deptCounts: Record<string, number> = {};
      profiles?.forEach((p) => {
        const dept = p.department || "Unassigned";
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });
      setDeptData(Object.entries(deptCounts).map(([department, count]) => ({ department, count })));

      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: attendance } = await supabase
        .from("attendance")
        .select("status")
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

      const sCounts: Record<string, number> = { Present: 0, Absent: 0, "Half Day": 0 };
      attendance?.forEach((a) => {
        sCounts[a.status] = (sCounts[a.status] || 0) + 1;
      });
      setStatusData(Object.entries(sCounts).map(([name, value]) => ({ name, value })));
    };

    fetchData();
  }, []);

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
          <CardHeader>
            <CardTitle className="text-lg">Attendance Status (Last 30 Days)</CardTitle>
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

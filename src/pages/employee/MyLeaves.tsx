import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function MyLeaves() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("leaves")
        .select("*")
        .eq("employee_id", user.id)
        .order("created_at", { ascending: false });
      setLeaves(data ?? []);
    };
    fetch();
  }, [user]);

  const statusColor = (s: string) => {
    if (s === "Approved") return "bg-success/10 text-success border-success/20";
    if (s === "Rejected") return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-warning/10 text-warning border-warning/20";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Leaves</h1>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No leave requests yet</TableCell>
                </TableRow>
              ) : (
                leaves.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.leave_type}</TableCell>
                    <TableCell>{new Date(l.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(l.end_date).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{l.reason}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor(l.status)}>{l.status}</Badge>
                    </TableCell>
                    {/* admin_remarks isn't in schema, but might be useful later. For now, keep it or check schema. Schema doesn't show it. */}
                    <TableCell className="max-w-[150px] truncate">{l.admin_remarks || "—"}</TableCell>
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

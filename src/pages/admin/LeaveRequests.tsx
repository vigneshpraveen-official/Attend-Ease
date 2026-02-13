import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle } from "lucide-react";

interface LeaveRow {
  id: string;
  type: string;
  reason: string;
  from_date: string;
  to_date: string;
  status: string;
  admin_remarks: string | null;
  employee_id: string;
  employee_name: string;
  created_at: string;
}

export default function LeaveRequests() {
  const [rows, setRows] = useState<LeaveRow[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<LeaveRow | null>(null);
  const [remarks, setRemarks] = useState("");
  const [action, setAction] = useState<"Approved" | "Rejected" | null>(null);
  const { toast } = useToast();

  const fetchLeaves = async () => {
    let query = supabase.from("leaves").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter as "Pending" | "Approved" | "Rejected");
    const { data: leaves } = await query;

    if (!leaves?.length) {
      setRows([]);
      return;
    }

    const ids = [...new Set(leaves.map((l) => l.employee_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
    const nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p.full_name]));

    setRows(leaves.map((l) => ({ ...l, employee_name: nameMap[l.employee_id] || "Unknown" })));
  };

  useEffect(() => {
    fetchLeaves();
  }, [filter]);

  const handleAction = async () => {
    if (!selected || !action) return;
    await supabase.from("leaves").update({ status: action, admin_remarks: remarks || null }).eq("id", selected.id);
    toast({ title: `Leave ${action.toLowerCase()}`, description: `${selected.employee_name}'s leave has been ${action.toLowerCase()}.` });
    setSelected(null);
    setRemarks("");
    setAction(null);
    fetchLeaves();
  };

  const statusColor = (s: string) => {
    if (s === "Approved") return "bg-success/10 text-success border-success/20";
    if (s === "Rejected") return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-warning/10 text-warning border-warning/20";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Leave Requests</h1>

      <div className="max-w-xs">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No leave requests found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.employee_name}</TableCell>
                    <TableCell>{r.type}</TableCell>
                    <TableCell>{new Date(r.from_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(r.to_date).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{r.reason}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor(r.status)}>{r.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {r.status === "Pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="text-success" onClick={() => { setSelected(r); setAction("Approved"); }}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setSelected(r); setAction("Rejected"); }}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setRemarks(""); setAction(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "Approved" ? "Approve" : "Reject"} Leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {action === "Approved" ? "Approve" : "Reject"} leave for <strong>{selected?.employee_name}</strong>?
            </p>
            <div className="space-y-2">
              <Label>Remarks (optional)</Label>
              <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add remarks..." />
            </div>
            <Button onClick={handleAction} className="w-full" variant={action === "Rejected" ? "destructive" : "default"}>
              Confirm {action}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

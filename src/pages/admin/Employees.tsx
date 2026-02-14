import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  designation: string;
  employee_code: string | null;
  joining_date: string;
  profiles: {
    email: string;
    role: string;
  } | null;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { getToken } = useAuth();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    department: "",
    designation: "",
    employee_code: "",
    role: "employee",
  });

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select(`
        *,
        profiles (email, role)
      `)
      .order("created_at", { ascending: false });
    
    if (error) {
        toast({ title: "Fetch Error", description: error.message, variant: "destructive" });
    } else {
        setEmployees((data as any) || []);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const resetForm = () => {
      setForm({
          email: "",
          password: "",
          first_name: "",
          last_name: "",
          department: "",
          designation: "",
          employee_code: "",
          role: "employee"
      });
      setEditingId(null);
  };

  const handleEdit = (e: Employee) => {
      setEditingId(e.id);
      setForm({
          email: e.profiles?.email || "",
          password: "", // Password not editable directly here usually, keep empty
          first_name: e.first_name,
          last_name: e.last_name,
          department: e.department,
          designation: e.designation,
          employee_code: e.employee_code || "",
          role: e.profiles?.role || "employee"
      });
      setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_URL}/api/employees/${editingId}` : `${API_URL}/api/employees`;

      // Remove password if editing and empty (optional check, dependent on backend handling)
      // Our backend create needs password. Update doesn't touch password in current implementation.
      
      const res = await fetch(url, {
          method,
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(form)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || result.message || "Failed to save employee");

      toast({ title: "Success", description: `Employee ${editingId ? 'updated' : 'created'} successfully.` });
      setOpen(false);
      resetForm();
      fetchEmployees();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = employees.filter(
    (e) =>
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      (e.department ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.employee_code ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Employee</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Employee" : "Add New Employee"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <Input value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} placeholder="EMP001" />
                </div>
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })} required>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" required disabled={!!editingId} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                {!editingId && (
                    <div className="space-y-2">
                    <Label>Password *</Label>
                    <Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    </div>
                )}
                
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : (editingId ? "Update Employee" : "Create Employee")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, ID or department..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs">{e.employee_code || "—"}</TableCell>
                    <TableCell className="font-medium">{e.first_name} {e.last_name}</TableCell>
                    <TableCell>{e.profiles?.email || "—"}</TableCell>
                    <TableCell className="capitalize">{e.profiles?.role || "—"}</TableCell>
                    <TableCell>{e.department || "—"}</TableCell>
                    <TableCell>{e.designation || "—"}</TableCell>
                    <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(e)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
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

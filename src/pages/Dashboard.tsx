import { useAuth } from "@/hooks/useAuth";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import EmployeeDashboard from "@/pages/employee/EmployeeDashboard";

export default function Dashboard() {
  const { role } = useAuth();
  return role === "admin" ? <AdminDashboard /> : <EmployeeDashboard />;
}

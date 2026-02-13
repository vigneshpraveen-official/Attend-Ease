import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/admin/Employees";
import AttendanceView from "@/pages/admin/AttendanceView";
import LeaveRequests from "@/pages/admin/LeaveRequests";
import Reports from "@/pages/admin/Reports";
import MyAttendance from "@/pages/employee/MyAttendance";
import ApplyLeave from "@/pages/employee/ApplyLeave";
import MyLeaves from "@/pages/employee/MyLeaves";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/employees" element={<AppLayout requiredRole="admin"><Employees /></AppLayout>} />
            <Route path="/attendance" element={<AppLayout requiredRole="admin"><AttendanceView /></AppLayout>} />
            <Route path="/leave-requests" element={<AppLayout requiredRole="admin"><LeaveRequests /></AppLayout>} />
            <Route path="/reports" element={<AppLayout requiredRole="admin"><Reports /></AppLayout>} />
            <Route path="/my-attendance" element={<AppLayout requiredRole="employee"><MyAttendance /></AppLayout>} />
            <Route path="/apply-leave" element={<AppLayout requiredRole="employee"><ApplyLeave /></AppLayout>} />
            <Route path="/my-leaves" element={<AppLayout requiredRole="employee"><MyLeaves /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

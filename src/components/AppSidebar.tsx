import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileText,
  BarChart3,
  Clock,
  CalendarPlus,
  List,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const adminItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Employees", url: "/employees", icon: Users },
  { title: "Attendance", url: "/attendance", icon: CalendarCheck },
  { title: "Leave Requests", url: "/leave-requests", icon: FileText },
  { title: "Reports", url: "/reports", icon: BarChart3 },
];

const employeeItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "My Attendance", url: "/my-attendance", icon: Clock },
  { title: "Apply Leave", url: "/apply-leave", icon: CalendarPlus },
  { title: "My Leaves", url: "/my-leaves", icon: List },
];

export function AppSidebar() {
  const { role, signOut, user } = useAuth();
  const items = role === "admin" ? adminItems : employeeItems;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center overflow-hidden">
             <img src="/icon.png" alt="Logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-semibold text-sidebar-foreground">AttendEase</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{role} Panel</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/60 truncate mb-2 px-1">
          {user?.email}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

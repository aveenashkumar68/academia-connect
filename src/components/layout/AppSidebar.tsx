import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Building2,
  GraduationCap,
  Briefcase,
  BarChart3,
  LogOut,
  Globe,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navByRole: Record<string, { label: string; icon: any; path: string }[]> = {
  super_admin: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/admin" },
    { label: "Departments", icon: Building2, path: "/dashboard/admin/departments" },
    { label: "Users", icon: Users, path: "/dashboard/admin/users" },
    { label: "Analytics", icon: BarChart3, path: "/dashboard/admin/analytics" },
    { label: "Chat", icon: MessageSquare, path: "/chat" },
  ],
  faculty: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/faculty" },
    { label: "Students", icon: GraduationCap, path: "/dashboard/faculty/students" },
    { label: "Chat", icon: MessageSquare, path: "/chat" },
  ],
  student: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/student" },
    { label: "Industry Posts", icon: Briefcase, path: "/dashboard/student/posts" },
    { label: "Chat", icon: MessageSquare, path: "/chat" },
  ],
  industry_partner: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard/industry" },
    { label: "My Posts", icon: Globe, path: "/dashboard/industry/posts" },
    { label: "Chat", icon: MessageSquare, path: "/chat" },
  ],
};

export function AppSidebar() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = navByRole[role ?? "student"] ?? navByRole.student;

  const initials = user?.user_metadata?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-sidebar-foreground">MAYAA</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">
              {role?.replace("_", " ") ?? "Loading..."}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.path}
                    onClick={() => navigate(item.path)}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {user?.user_metadata?.full_name ?? "User"}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/60">{user?.email}</p>
          </div>
          <button
            onClick={() => { signOut(); navigate("/login"); }}
            className="rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

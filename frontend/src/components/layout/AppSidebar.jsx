import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import api from "@/lib/api";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { LayoutDashboard, MessageSquare, Users, Building2, GraduationCap, Briefcase, LogOut, Globe, Newspaper } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
const navByRole = {
  "super-admin": [{
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard/admin"
  }, {
    label: "Departments",
    icon: Building2,
    path: "/dashboard/admin/departments"
  }, {
    label: "Students",
    icon: GraduationCap,
    path: "/dashboard/admin/users"
  }, {
    label: "Faculty",
    icon: Users,
    path: "/dashboard/admin/faculty"
  }, {
    label: "Community",
    icon: Newspaper,
    path: "/community"
  }, {
    label: "Chat",
    icon: MessageSquare,
    path: "/chat"
  }],
  admin: [{
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard/faculty"
  }, {
    label: "Students",
    icon: GraduationCap,
    path: "/dashboard/faculty/students"
  }, {
    label: "Community",
    icon: Newspaper,
    path: "/community"
  }, {
    label: "Chat",
    icon: MessageSquare,
    path: "/chat"
  }],
  student: [{
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard/student"
  }, {
    label: "Achievements",
    icon: GraduationCap,
    path: "/dashboard/student/achievements"
  }, {
    label: "Community",
    icon: Newspaper,
    path: "/community"
  }, {
    label: "Chat",
    icon: MessageSquare,
    path: "/chat"
  }],
  industry_partner: [{
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard/industry"
  }, {
    label: "My Posts",
    icon: Globe,
    path: "/community"
  }, {
    label: "Community",
    icon: Newspaper,
    path: "/community"
  }, {
    label: "Chat",
    icon: MessageSquare,
    path: "/chat"
  }]
};
export function AppSidebar() {
  const {
    user,
    role,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = navByRole[role ?? "student"] ?? navByRole.student;
  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "U";

  const [chatUnread, setChatUnread] = useState(0);
  const [communityUnread, setCommunityUnread] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        if (user) {
          const [chatRes, communityRes] = await Promise.all([
            api.get("/chat/unread-count"),
            api.get("/notifications/community-unread")
          ]);
          setChatUnread(chatRes.data.count);
          setCommunityUnread(communityRes.data.count);
        }
      } catch (err) {
        console.error("Error fetching unread counts:", err);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (location.pathname === "/community") {
      api.put("/notifications/mark-community-read").catch(console.error);
      setCommunityUnread(0);
    } else if (location.pathname === "/chat") {
      api.get("/chat/unread-count").then(res => setChatUnread(res.data.count)).catch(console.error);
    }
  }, [location.pathname]);

  return <Sidebar>
    <SidebarHeader className="p-4 border-b border-sidebar-border">
      <div className="flex items-center gap-3">
        {/* Green map icon — matches landing & login navbar */}
        <div style={{
          width: '38px',
          height: '38px',
          background: '#10B981',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.1rem',
          color: '#ffffff',
          flexShrink: 0,
          transition: 'transform 0.3s ease',
        }}
          className="sidebar-logo-icon"
        >
          <i className="fas fa-map"></i>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            lineHeight: 1.2,
            color: 'var(--sidebar-foreground)',
            letterSpacing: '-0.01em',
          }}>
            Project<span style={{ color: '#10B981', marginLeft: '0.15rem' }}>Mayaa</span>
          </span>
          <span style={{
            fontSize: '0.6rem',
            color: 'rgba(255,255,255,0.55)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginTop: '1px',
          }}>
            Engineering • Business • Innovation
          </span>
        </div>
      </div>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map(item => {
              const showBadge = (item.label === "Chat" && chatUnread > 0) || (item.label === "Community" && communityUnread > 0);
              const badgeCount = item.label === "Chat" ? chatUnread : communityUnread;
              
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton isActive={location.pathname === item.path} onClick={() => navigate(item.path)} tooltip={item.label}>
                    <div className="relative inline-flex items-center justify-center">
                      <item.icon className="h-4 w-4" />
                      {showBadge && (
                        <span className="absolute -top-1.5 -right-1.5 flex min-h-[14px] min-w-[14px] items-center justify-center rounded-full bg-destructive px-1 text-[8px] font-bold text-white">
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      )}
                    </div>
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup className="mt-auto">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => {
                signOut();
                navigate("/login");
              }} tooltip="Logout" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>;
}
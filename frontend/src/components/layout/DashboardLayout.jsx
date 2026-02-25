import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Separator } from "@/components/ui/separator";
import { Bell, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function DashboardLayout({
  children,
  title,
  description
}) {
  const { user, role } = useAuth();

  return <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header className="flex h-16 items-center justify-between border-b border-border/50 px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <div className="hidden sm:flex flex-col">
            <h1 className="font-display text-lg font-bold text-foreground leading-none">Welcome {user?.name || "User"}!</h1>
            <p className="text-xs text-muted-foreground mt-1">Mayaa Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive border-2 border-background" />
          </button>
          <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-border/50">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-sm font-semibold text-foreground leading-none">{user?.name || "User"}</p>
              {role !== 'super-admin' && (
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{role?.replace("_", " ") || "Loading..."}</p>
              )}
            </div>
            <div className="h-10 w-10 shrink-0 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground border border-border/50">
              <span className="font-bold text-sm">
                {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
              </span>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-6 lg:px-8 lg:py-8 bg-background animate-fade-in">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {children}
        </div>
      </main>
    </SidebarInset>
  </SidebarProvider>;
}
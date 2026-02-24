import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Building2, Users, GraduationCap, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ departments: 0, domains: 0, students: 0, posts: 0 });

  useEffect(() => {
    const load = async () => {
      const [d, dom, s, p] = await Promise.all([
        supabase.from("departments").select("id", { count: "exact", head: true }),
        supabase.from("domains").select("id", { count: "exact", head: true }),
        supabase.from("student_profiles").select("id", { count: "exact", head: true }),
        supabase.from("industry_posts").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        departments: d.count ?? 0,
        domains: dom.count ?? 0,
        students: s.count ?? 0,
        posts: p.count ?? 0,
      });
    };
    load();
  }, []);

  return (
    <DashboardLayout title="Admin Dashboard" description="Platform overview and management">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Departments" value={stats.departments} icon={Building2} trend={{ value: 12, label: "this semester" }} />
        <StatCard title="Domains" value={stats.domains} icon={Globe} />
        <StatCard title="Students" value={stats.students} icon={GraduationCap} trend={{ value: 8, label: "growth" }} />
        <StatCard title="Industry Posts" value={stats.posts} icon={Users} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Activity feed will appear here as the platform grows.</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-success" />
              <span className="text-sm text-foreground">All systems operational</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

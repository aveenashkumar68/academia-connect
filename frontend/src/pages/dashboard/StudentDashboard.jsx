import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { BarChart3, Calendar, Briefcase, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
export default function StudentDashboard() {
  const {
    user
  } = useAuth();
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    if (!user) return;
    supabase.from("student_profiles").select("*").eq("user_id", user.id).maybeSingle().then(({
      data
    }) => setProfile(data));
  }, [user]);
  return <DashboardLayout title="My Dashboard" description="Track your academic progress">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Performance" value={profile?.performance_score ?? 0} icon={Trophy} description="Overall score" />
        <StatCard title="Attendance" value={`${profile?.attendance_percentage ?? 0}%`} icon={Calendar} />
        <StatCard title="Projects" value={profile?.project_count ?? 0} icon={Briefcase} />
        <StatCard title="Industry Score" value={profile?.industry_engagement_score ?? 0} icon={BarChart3} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-base">Progress Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-muted-foreground">Performance</span>
                <span className="font-medium">{profile?.performance_score ?? 0}/100</span>
              </div>
              <Progress value={profile?.performance_score ?? 0} className="h-2" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-muted-foreground">Attendance</span>
                <span className="font-medium">{profile?.attendance_percentage ?? 0}%</span>
              </div>
              <Progress value={profile?.attendance_percentage ?? 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Browse industry posts and connect with mentors via Chat.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>;
}
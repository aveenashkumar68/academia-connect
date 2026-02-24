import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { GraduationCap, BarChart3, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    supabase
      .from("student_profiles")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => setStudentCount(count ?? 0));
  }, []);

  return (
    <DashboardLayout title="Faculty Dashboard" description="Monitor student performance and engagement">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Students" value={studentCount} icon={GraduationCap} />
        <StatCard title="Avg Performance" value="—" icon={BarChart3} description="Across all students" />
        <StatCard title="Active Cohorts" value="—" icon={Users} />
      </div>

      <div className="mt-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-base">Student Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Detailed student performance tracking coming soon. Use the Chat to connect with students directly.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

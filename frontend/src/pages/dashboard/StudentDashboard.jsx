import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { BarChart3, Calendar, Briefcase, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user?._id) return;
    (async () => {
      try {
        const { data } = await api.get(`/users/${user._id}`);
        setProfile(data);
      } catch {
        console.error("Failed to load student profile");
      }
    })();
  }, [user]);

  return (
    <DashboardLayout title="My Dashboard" description="Track your academic progress">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Department" value={profile?.department || "—"} icon={Trophy} />
        <StatCard title="Year" value={profile?.year || "—"} icon={Calendar} />
        <StatCard title="Domain" value={profile?.domain || "—"} icon={Briefcase} />
        <StatCard title="Reg. No." value={profile?.regNo || "—"} icon={BarChart3} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-base">My Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{profile?.name || "—"}</span>
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{profile?.email || "—"}</span>
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{profile?.phone || "—"}</span>
              </div>
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
    </DashboardLayout>
  );
}
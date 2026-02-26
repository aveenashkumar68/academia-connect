import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Briefcase, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function IndustryDashboard() {
  const { user } = useAuth();
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    if (!user?._id) return;
    (async () => {
      try {
        const { data } = await api.get("/posts");
        // Count posts authored by this user
        const myPosts = data.filter(p => p.author === user._id);
        setPostCount(myPosts.length);
      } catch {
        console.error("Failed to fetch post count");
      }
    })();
  }, [user]);

  return (
    <DashboardLayout title="Industry Dashboard" description="Manage collaborations and postings">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="My Posts" value={postCount} icon={Briefcase} />
        <StatCard title="Total Visibility" value="—" icon={Eye} description="Across departments" />
      </div>

      <div className="mt-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-base">Your Industry Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Post management and analytics coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
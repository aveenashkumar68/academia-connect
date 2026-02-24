import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Briefcase, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function IndustryDashboard() {
  const { user } = useAuth();
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("industry_posts")
      .select("id", { count: "exact", head: true })
      .eq("created_by", user.id)
      .then(({ count }) => setPostCount(count ?? 0));
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

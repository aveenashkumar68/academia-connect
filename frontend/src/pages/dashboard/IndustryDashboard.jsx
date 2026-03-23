import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Briefcase, Eye, UserPlus, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function IndustryDashboard() {
  const { user } = useAuth();
  const [postCount, setPostCount] = useState(0);
  const [connections, setConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    (async () => {
      try {
        const { data } = await api.get("/posts");
        // Count posts authored by this user
        const myPosts = data.filter(p => p.author === user._id);
        setPostCount(myPosts.length);

        fetchConnections();
      } catch {
        console.error("Failed to fetch post count");
      }
    })();
  }, [user]);

  const fetchConnections = async () => {
    try {
      setLoadingConnections(true);
      const { data } = await api.get('/connections/industry');
      setConnections(data);
    } catch (error) {
      console.error("Failed to fetch connections", error);
      toast.error("Failed to load connection requests");
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleConnectionResponse = async (id, status) => {
    try {
      await api.put(`/connections/${id}`, { status });
      // Update local state after successful API call
      setConnections(prev => prev.map(c => c._id === id ? { ...c, status } : c));
      toast.success(`Connection ${status === 'accepted' ? 'accepted' : 'declined'}`);
    } catch (error) {
      toast.error("Failed to update connection");
    }
  };

  const pendingConnections = connections.filter(c => c.status === 'contacted');

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

      <div className="mt-6">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex justify-between items-center">
              Student Connection Requests
              {pendingConnections.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">{pendingConnections.length} new</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingConnections ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading requests...</p>
            ) : connections.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No connection requests yet.</p>
            ) : (
              <div className="space-y-4">
                {connections.map((conn) => (
                  <div key={conn._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div className="flex items-center gap-4 mb-3 sm:mb-0">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground">
                        {conn.student?.name ? conn.student.name.substring(0, 2).toUpperCase() : 'ST'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{conn.student?.name || 'Student'}</h4>
                        <p className="text-xs text-muted-foreground">
                          {conn.student?.department || 'Department'} • {conn.student?.year || 'Year'}
                        </p>
                        <p className="text-xs text-muted-foreground italic mt-0.5">"{conn.message}"</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {conn.status === 'contacted' ? (
                        <>
                          <button onClick={() => handleConnectionResponse(conn._id, 'accepted')} className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-md transition-colors">
                            <Check className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button onClick={() => handleConnectionResponse(conn._id, 'declined')} className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors">
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </>
                      ) : (
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${conn.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                          {conn.status.charAt(0).toUpperCase() + conn.status.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </DashboardLayout>
  );
}
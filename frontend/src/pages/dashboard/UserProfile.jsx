import { useState, useEffect } from "react";
import api from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Building2, GraduationCap, ArrowLeft, Calendar, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function UserProfile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get(`/users/${id}`);
        setUser(response.data);
      } catch (error) {
        toast.error("Failed to fetch user profile");
        navigate("/dashboard/admin/users");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, navigate]);

  if (loading) return <DashboardLayout><div className="text-center py-20">Loading...</div></DashboardLayout>;
  if (!user) return <DashboardLayout><div className="text-center py-20">User not found</div></DashboardLayout>;

  const displayName = user.name || user.email?.split('@')[0] || 'User';
  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email?.charAt(0).toUpperCase() || 'U';

  return <DashboardLayout>
    <div className="space-y-6">
      <Button
        variant="ghost"
        className="flex items-center gap-2 hover:bg-transparent pl-0"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Sidebar */}
        <Card className="shadow-sm border border-border/50 bg-card lg:col-span-1 h-fit">
          <CardContent className="p-8 flex flex-col items-center">
            <Avatar className="h-32 w-32 border-4 border-background mb-4 shadow-sm">
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold text-foreground mb-1">{displayName}</h3>
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-4">
              {user.role.replace('_', ' ')}
            </p>

            <div className="w-full space-y-4 pt-6 border-t border-slate-100 mt-6">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{user.phone || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Info */}
        <Card className="shadow-sm border border-border/50 bg-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserRound className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold">Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Department</Label>
                <div className="flex items-center gap-2 font-medium">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  {user.department || 'N/A'}
                </div>
              </div>

              {user.role === 'student' && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Registration Number</Label>
                    <div className="flex items-center gap-2 font-medium">
                      <User className="h-4 w-4 text-slate-400" />
                      {user.regNo || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Current Year</Label>
                    <div className="flex items-center gap-2 font-medium">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {user.year || 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Expert Domain</Label>
                    <div className="flex items-center gap-2 font-medium">
                      <GraduationCap className="h-4 w-4 text-slate-400" />
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/10">
                        {user.domain || 'N/A'}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </DashboardLayout>;
}
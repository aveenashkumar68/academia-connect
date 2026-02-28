import { useState, useEffect } from "react";
import api from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Building2, Users, GraduationCap, Activity, LineChart as LineChartIcon, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useNavigate } from "react-router-dom";

const dailyActivityData = [];

const departmentPerformanceData = [];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    departments: 0,
    activities: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/users/stats");
        setStats(response.data);
      } catch (error) {
        toast.error("Failed to fetch dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return <DashboardLayout>
    <div className="space-y-2 mb-6 sm:mb-8">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Super Admin Dashboard</h2>
      <p className="text-sm text-muted-foreground">Welcome to the institutional management portal</p>
    </div>

    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        className="shadow-sm border-none bg-white cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate("/dashboard/admin/users")}
      >
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Students</p>
            <p className="text-2xl font-bold text-foreground">{loading ? "..." : stats.students}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
        </CardContent>
      </Card>
      <Card
        className="shadow-sm border-none bg-white cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate("/dashboard/admin/faculty")}
      >
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Faculty</p>
            <p className="text-2xl font-bold text-foreground">{loading ? "..." : stats.faculty}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
        </CardContent>
      </Card>
      <Card
        className="shadow-sm border-none bg-white cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate("/dashboard/admin/departments")}
      >
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Departments</p>
            <p className="text-2xl font-bold text-foreground">{loading ? "..." : stats.departments}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-sm border-none bg-white">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
            <p className="text-2xl font-bold text-foreground">{loading ? "..." : stats.activities}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="h-6 w-6 text-primary" />
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="grid gap-6 mt-8 lg:grid-cols-2">
      <Card className="shadow-sm border-none bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Daily Activity Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] sm:h-[300px] p-0 pb-4 flex items-center justify-center">
          {dailyActivityData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyActivityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
              <Activity className="h-8 w-8 opacity-20" />
              No activity data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-none bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Department Performance</CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] sm:h-[300px] p-0 pb-4 flex items-center justify-center">
          {departmentPerformanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={departmentPerformanceData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {departmentPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
              <BarChart3 className="h-8 w-8 opacity-20" />
              No performance data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  </DashboardLayout>;
}
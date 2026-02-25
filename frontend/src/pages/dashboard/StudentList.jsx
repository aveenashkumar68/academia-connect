import { useState, useEffect } from "react";
import api from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GraduationCap, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStudents = async () => {
    try {
      const response = await api.get("/users/role/student");
      setStudents(response.data);
    } catch (error) {
      toast.error("Failed to fetch student list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return <DashboardLayout>
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Student Management</h2>
        <p className="text-muted-foreground">View and manage student profiles</p>
      </div>

      <Card className="shadow-sm border border-border/50 bg-card">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold">Student Directory</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Registration No.</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Domain</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : students.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No students found</TableCell></TableRow>
              ) : (
                students.map((s) => (
                  <TableRow
                    key={s._id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/dashboard/admin/user/${s._id}`)}
                  >
                    <TableCell className="font-medium flex items-center gap-3 text-foreground">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                          {s.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <span>{s.name || 'N/A'}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.regNo || 'N/A'}</TableCell>
                    <TableCell>{s.department || 'N/A'}</TableCell>
                    <TableCell>{s.year || 'N/A'}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/10">
                        {s.domain || 'N/A'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </DashboardLayout>;
}
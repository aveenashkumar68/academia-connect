import { useState, useEffect } from "react";
import api from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserPlus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useNavigate } from "react-router-dom";

export default function FacultyList() {
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    phone: ""
  });

  const fetchFaculty = async () => {
    try {
      const response = await api.get("/users/role/admin");
      setFaculty(response.data);
    } catch (error) {
      toast.error("Failed to fetch faculty list");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      setDepartments(response.data);
    } catch (error) {
      console.error("Failed to fetch departments");
    }
  };

  useEffect(() => {
    fetchFaculty();
    fetchDepartments();
  }, []);

  const handleCreateAdmin = async e => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/users/admin", formData);
      toast.success("Admin account created and credentials sent via email.");
      setFormData({
        name: "",
        email: "",
        department: "",
        phone: ""
      });
      fetchFaculty();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create admin");
    } finally {
      setCreating(false);
    }
  };

  return <DashboardLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Faculty Management</h2>
          <p className="text-muted-foreground">Manage and create institutional administrators</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create Admin Form */}
        <Card className="shadow-sm border border-border/50 bg-card lg:col-span-1 h-fit">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold">Create New Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Dr. John Doe" value={formData.name} onChange={e => setFormData({
                  ...formData,
                  name: e.target.value
                })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="john.doe@institution.edu" value={formData.email} onChange={e => setFormData({
                  ...formData,
                  email: e.target.value
                })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept._id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+1234567890" value={formData.phone} onChange={e => setFormData({
                  ...formData,
                  phone: e.target.value
                })} required />
              </div>
              <Button type="submit" className="w-full mt-2" disabled={creating}>
                {creating ? "Creating..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Faculty List Table */}
        <Card className="shadow-sm border border-border/50 bg-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold">Faculty Members</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : faculty.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No faculty members found</TableCell></TableRow>
                ) : (
                  faculty.map((f) => (
                    <TableRow
                      key={f._id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/dashboard/admin/user/${f._id}`)}
                    >
                      <TableCell className="font-medium text-foreground">{f.name}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs font-medium">
                          {f.department}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{f.email}</TableCell>
                      <TableCell className="text-muted-foreground">{f.phone}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  </DashboardLayout>;
}
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { GraduationCap, BarChart3, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FacultyDashboard() {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    year: "",
    regNo: "",
    domain: ""
  });

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      setDepartments(response.data);
    } catch (error) {
      console.error("Failed to fetch departments");
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleDeptChange = (value) => {
    const dept = departments.find(d => d.name === value);
    setSelectedDept(dept);
    setFormData({ ...formData, department: value, domain: "" });
  };

  const handleCreateStudent = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/users/student", formData);
      toast.success("Student account created and credentials sent via email.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        department: "",
        year: "",
        regNo: "",
        domain: ""
      });
      setSelectedDept(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create student");
    } finally {
      setLoading(false);
    }
  };
  return <DashboardLayout title="Admin (Faculty) Dashboard" description="Manage students and cohorts">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard title="Total Students" value={0} icon={GraduationCap} />
      <StatCard title="Avg Performance" value="—" icon={BarChart3} description="Across all students" />
      <StatCard title="Active Cohorts" value="—" icon={Users} />
    </div>

    <div className="mt-6">
      <Card className="border-border/50 max-w-2xl">
        <CardHeader>
          <CardTitle className="font-display text-base">Create Student Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateStudent} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Student Name</Label>
                <Input id="name" placeholder="Full Name" value={formData.name} onChange={e => setFormData({
                  ...formData,
                  name: e.target.value
                })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="student@institution.edu" value={formData.email} onChange={e => setFormData({
                  ...formData,
                  email: e.target.value
                })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+1234567890" value={formData.phone} onChange={e => setFormData({
                  ...formData,
                  phone: e.target.value
                })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={handleDeptChange}
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
                <Label htmlFor="year">Year</Label>
                <Input id="year" placeholder="2nd Year" value={formData.year} onChange={e => setFormData({
                  ...formData,
                  year: e.target.value
                })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regNo">Registration Number</Label>
                <Input id="regNo" placeholder="REG12345" value={formData.regNo} onChange={e => setFormData({
                  ...formData,
                  regNo: e.target.value
                })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain (Business)</Label>
                <Select
                  value={formData.domain}
                  onValueChange={(value) => setFormData({ ...formData, domain: value })}
                  disabled={!selectedDept}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedDept ? "Select Domain" : "Select Dept First"} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedDept?.domains.map((domain) => (
                      <SelectItem key={domain} value={domain}>
                        {domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
              {loading ? "Creating..." : "Create Student Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  </DashboardLayout>;
}
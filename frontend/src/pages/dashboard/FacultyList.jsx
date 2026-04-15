import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Skeleton from "react-loading-skeleton";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import {
  Users, UserPlus, Building2, CheckCircle2, Search, RefreshCw,
  Download, Trash2, Eye, Edit2, ArrowLeftRight, AlertTriangle, X,
  Plus, Settings2, Info
} from "lucide-react";

export default function FacultyList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === "super-admin";
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  // Add Dialog
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", department: "", phone: "", domain: "" });
  const [existingFacultyInfo, setExistingFacultyInfo] = useState(null);

  // Replace Dialog
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [replacingFaculty, setReplacingFaculty] = useState(null);
  const [replaceSelectedDept, setReplaceSelectedDept] = useState(null);
  const [replaceForm, setReplaceForm] = useState({ name: "", email: "", department: "", phone: "", domain: "" });

  // Manage Assignments Dialog
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [managingFaculty, setManagingFaculty] = useState(null);
  const [managingAssignments, setManagingAssignments] = useState([]);
  const [addAssignmentDept, setAddAssignmentDept] = useState(null);
  const [newAssignment, setNewAssignment] = useState({ department: "", domain: "" });
  const [addingAssignment, setAddingAssignment] = useState(false);

  const { data: faculty = [], isLoading: facultyLoading, isError: facultyError, refetch: fetchFaculty } = useQuery({
    queryKey: ['faculty'],
    queryFn: async () => {
      const response = await api.get("/users/role/admin");
      return response.data;
    }
  });

  const { data: departments = [], isLoading: deptsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get("/departments");
      return response.data;
    }
  });

  const loading = facultyLoading || deptsLoading;

  if (facultyError) {
    toast.error("Failed to fetch faculty list");
  }

  // Filtered faculty
  const filteredFaculty = useMemo(() => {
    let list = faculty;
    if (deptFilter !== "all") {
      // Filter by assignment department, not just primary department
      list = list.filter(f => {
        if (f.assignments?.length > 0) {
          return f.assignments.some(a => a.department === deptFilter);
        }
        return f.department === deptFilter;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(f => {
        const assignmentText = (f.assignments || []).map(a => `${a.department} ${a.domain}`).join(' ').toLowerCase();
        return (
          (f.name || "").toLowerCase().includes(q) ||
          (f.email || "").toLowerCase().includes(q) ||
          (f.department || "").toLowerCase().includes(q) ||
          (f.domain || "").toLowerCase().includes(q) ||
          assignmentText.includes(q)
        );
      });
    }
    return list;
  }, [faculty, deptFilter, searchQuery]);

  // Unique departments from faculty assignments for filter
  const uniqueDepts = useMemo(() => {
    const set = new Set();
    faculty.forEach(f => {
      if (f.assignments?.length > 0) {
        f.assignments.forEach(a => { if (a.department) set.add(a.department); });
      } else if (f.department) {
        set.add(f.department);
      }
    });
    return Array.from(set).sort();
  }, [faculty]);

  // Dept change for add form
  const handleDeptChange = (value) => {
    const dept = departments.find(d => d.name === value);
    setSelectedDept(dept);
    setFormData({ ...formData, department: value, domain: "" });
  };

  const handleReplaceDeptChange = (value) => {
    const dept = departments.find(d => d.name === value);
    setReplaceSelectedDept(dept);
    setReplaceForm({ ...replaceForm, department: value, domain: "" });
  };

  // Check if email already exists when email field loses focus
  const handleEmailBlur = async () => {
    const email = formData.email.trim().toLowerCase();
    if (!email) {
      setExistingFacultyInfo(null);
      return;
    }

    // Check if this email belongs to an existing faculty
    const existingFac = faculty.find(f => f.email.toLowerCase() === email);
    if (existingFac) {
      setExistingFacultyInfo(existingFac);
      // Auto-fill name and phone from existing (disabled)
      setFormData(prev => ({
        ...prev,
        name: existingFac.name || prev.name,
        phone: existingFac.phone || prev.phone,
      }));
    } else {
      setExistingFacultyInfo(null);
    }
  };

  // Create faculty or add assignment
  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.department) {
      toast.error("Please fill in email and department");
      return;
    }
    // If this is a new user, name and phone are required
    if (!existingFacultyInfo && (!formData.name || !formData.phone)) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCreating(true);
    try {
      const response = await api.post("/users/admin", formData);
      if (response.data.isNewAssignment) {
        toast.success(`New assignment added for ${existingFacultyInfo?.name || formData.email}. No duplicate account created.`);
      } else {
        toast.success("Faculty account created and credentials sent via email.");
      }
      setFormData({ name: "", email: "", department: "", phone: "", domain: "" });
      setSelectedDept(null);
      setExistingFacultyInfo(null);
      setIsAddOpen(false);
      fetchFaculty();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create faculty");
    } finally {
      setCreating(false);
    }
  };

  // Delete faculty
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name || 'this faculty member'}? This will also delete their assignments and assigned students.`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("Faculty deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete faculty");
    }
  };

  // Open replace dialog
  const openReplace = (f) => {
    setReplacingFaculty(f);
    setReplaceForm({ name: "", email: "", department: f.department || "", phone: "", domain: "" });
    const dept = departments.find(d => d.name === f.department);
    setReplaceSelectedDept(dept || null);
    setIsReplaceOpen(true);
  };

  // Replace faculty
  const handleReplace = async (e) => {
    e.preventDefault();
    if (!replaceForm.name || !replaceForm.email || !replaceForm.department || !replaceForm.phone) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCreating(true);
    try {
      await api.post(`/users/admin/${replacingFaculty._id}/replace`, replaceForm);
      toast.success("Faculty replaced successfully! Credentials sent to new member.");
      setIsReplaceOpen(false);
      setReplacingFaculty(null);
      setReplaceForm({ name: "", email: "", department: "", phone: "", domain: "" });
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to replace faculty");
    } finally {
      setCreating(false);
    }
  };

  // ── Manage Assignments ──
  const openManageAssignments = async (f) => {
    setManagingFaculty(f);
    setManagingAssignments(f.assignments || []);
    setNewAssignment({ department: "", domain: "" });
    setAddAssignmentDept(null);
    setIsManageOpen(true);
  };

  const handleAddAssignment = async () => {
    if (!newAssignment.department) {
      toast.error("Please select a department");
      return;
    }
    setAddingAssignment(true);
    try {
      const res = await api.post(`/users/admin/${managingFaculty._id}/assignments`, newAssignment);
      toast.success("Assignment added");
      setManagingAssignments(res.data.allAssignments);
      setNewAssignment({ department: "", domain: "" });
      setAddAssignmentDept(null);
      fetchFaculty();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add assignment");
    } finally {
      setAddingAssignment(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm("Remove this assignment?")) return;
    try {
      const res = await api.delete(`/users/admin/${managingFaculty._id}/assignments/${assignmentId}`);
      toast.success("Assignment removed");
      setManagingAssignments(res.data.remainingAssignments);
      fetchFaculty();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove assignment");
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  // Render assignment pills for a faculty member
  const renderAssignmentPills = (f) => {
    const assignments = f.assignments || [];
    if (assignments.length === 0) {
      // Fallback to legacy single domain/department
      if (f.domain) {
        return (
          <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
            {f.department ? `${f.department} → ` : ""}{f.domain}
          </span>
        );
      }
      return <span className="text-muted-foreground text-xs">—</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {assignments.map((a, i) => (
          <span key={a._id || i} className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium border border-blue-100">
            {a.department}{a.domain ? ` → ${a.domain}` : ""}
          </span>
        ))}
      </div>
    );
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Assignments (Dept → Domain)"];
    const rows = filteredFaculty.map(f => {
      const assignmentsStr = (f.assignments || []).map(a => `${a.department}${a.domain ? ' → ' + a.domain : ''}`).join('; ') || `${f.department || ''} → ${f.domain || ''}`;
      return [f.name || "", f.email || "", f.phone || "", assignmentsStr];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "faculty_list.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Faculty list exported!");
  };

  return <DashboardLayout>
    <div className="space-y-5">

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-xl p-5 shadow-sm border border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Faculty Management</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {isSuperAdmin && (
            <Button onClick={() => { setIsAddOpen(true); setExistingFacultyInfo(null); setFormData({ name: "", email: "", department: "", phone: "", domain: "" }); setSelectedDept(null); }} className="bg-[#1e3c72] hover:bg-[#2a5298] text-white text-xs sm:text-sm flex-1 sm:flex-none">
              <UserPlus className="h-4 w-4 mr-1.5 sm:mr-2" /> Add / Assign Faculty
            </Button>
          )}
          <Button variant="outline" onClick={() => fetchFaculty()} className="text-xs sm:text-sm flex-1 sm:flex-none">
            <RefreshCw className="h-4 w-4 mr-1.5 sm:mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Faculty Table */}
      <Card className="shadow-sm border border-border/50 bg-card">
        <CardContent className="p-5">
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search faculty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {uniqueDepts.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="space-y-4">
                <Skeleton height={140} className="w-full rounded-xl" count={3} />
              </div>
            ) : filteredFaculty.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">No faculty members found</div>
            ) : (
              filteredFaculty.map((f) => (
                <div key={f._id} className="bg-white border border-border/50 rounded-xl p-4 space-y-3">
                  {/* Top: Avatar + Name */}
                  <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => navigate(`/dashboard/admin/user/${f._id}`)}
                  >
                    <Avatar className="h-10 w-10 shrink-0 group-hover:ring-2 ring-blue-100 transition-all">
                      {f.profilePicture && <AvatarImage src={f.profilePicture} alt={f.name} />}
                      <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
                        {getInitials(f.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate group-hover:text-blue-600 transition-colors">{f.name || "N/A"}</p>
                      <p className="text-xs text-muted-foreground truncate">{f.email}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{f.phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Assignments</p>
                      <p className="font-medium">{(f.assignments || []).length || 1}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Departments & Domains</p>
                      {renderAssignmentPills(f)}
                    </div>
                  </div>

                  {/* Actions */}
                  {isSuperAdmin && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
                      <Button variant="outline" size="sm" className="min-h-[40px] text-xs justify-start px-3"
                        onClick={() => navigate(`/dashboard/admin/user/${f._id}`)}>
                        <Eye className="h-3.5 w-3.5 mr-2" /> View
                      </Button>
                      <Button variant="outline" size="sm" className="min-h-[40px] text-xs text-blue-600 border-blue-200 hover:bg-blue-50 justify-start px-3"
                        onClick={() => openManageAssignments(f)}>
                        <Settings2 className="h-3.5 w-3.5 mr-2" /> Manage
                      </Button>
                      <Button variant="outline" size="sm" className="min-h-[40px] text-xs text-amber-600 border-amber-200 hover:bg-amber-50 justify-start px-3"
                        onClick={() => openReplace(f)}>
                        <ArrowLeftRight className="h-3.5 w-3.5 mr-2" /> Replace
                      </Button>
                      <Button variant="outline" size="sm" className="min-h-[40px] text-xs text-destructive border-destructive/30 hover:bg-destructive/10 justify-start px-3"
                        onClick={() => handleDelete(f._id, f.name)}>
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faculty Member</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Departments & Domains</TableHead>
                  {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="py-10"><Skeleton height={40} count={5} /></TableCell></TableRow>
                ) : filteredFaculty.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No faculty members found</TableCell></TableRow>
                ) : (
                  filteredFaculty.map((f) => (
                    <TableRow key={f._id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell>
                        <div
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => navigate(`/dashboard/admin/user/${f._id}`)}
                        >
                          <Avatar className="h-9 w-9 group-hover:ring-2 ring-blue-100 transition-all">
                            {f.profilePicture && <AvatarImage src={f.profilePicture} alt={f.name} />}
                            <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
                              {getInitials(f.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate group-hover:text-blue-600 transition-colors">{f.name || "N/A"}</p>
                            <p className="text-xs text-muted-foreground truncate">{f.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{f.phone || "N/A"}</TableCell>
                      <TableCell className="max-w-[350px]">
                        {renderAssignmentPills(f)}
                      </TableCell>
                      {isSuperAdmin && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => navigate(`/dashboard/admin/user/${f._id}`)} title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => openManageAssignments(f)} title="Manage Assignments">
                              <Settings2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                              onClick={() => openReplace(f)} title="Replace">
                              <ArrowLeftRight className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(f._id, f.name)} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* ── Add / Assign Faculty Dialog ── */}
    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
      <DialogContent className="w-[95vw] max-w-[550px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <UserPlus className="h-5 w-5 text-blue-600" /> Add / Assign Faculty
          </DialogTitle>
        </DialogHeader>

        {/* Existing faculty info banner */}
        {existingFacultyInfo && (
          <div className="flex items-start gap-2 sm:gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs sm:text-sm">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-800">Faculty already exists: {existingFacultyInfo.name}</p>
              <p className="text-blue-700 mt-0.5">
                Adding a new department/domain assignment to this existing account. <strong>No new credentials will be generated.</strong>
              </p>
              {existingFacultyInfo.assignments?.length > 0 && (
                <div className="mt-2">
                  <p className="text-blue-600 text-xs font-medium mb-1">Current assignments:</p>
                  <div className="flex flex-wrap gap-1">
                    {existingFacultyInfo.assignments.map((a, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-medium">
                        {a.department}{a.domain ? ` → ${a.domain}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleCreateFaculty} className="space-y-4 py-2">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-sm">Email Address *</Label>
              <Input type="email" placeholder="Enter faculty email" value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                onBlur={handleEmailBlur}
                required className="h-10" />
              <p className="text-[11px] text-muted-foreground">If this email already exists, a new assignment will be added instead of creating a duplicate account.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Full Name {existingFacultyInfo ? "" : "*"}</Label>
              <Input placeholder="Enter Faculty Name" value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required={!existingFacultyInfo}
                disabled={!!existingFacultyInfo}
                className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Phone Number {existingFacultyInfo ? "" : "*"}</Label>
              <Input placeholder="+91" maxLength={10} value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                required={!existingFacultyInfo}
                disabled={!!existingFacultyInfo}
                className="h-10" />
            </div>
            <div className="space-y-1.5 w-full">
              <Label className="text-sm">Department *</Label>
              <Select value={formData.department} onValueChange={handleDeptChange}>
                <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Select Department" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d._id} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 w-full">
              <Label className="text-sm">Domain / Expertise</Label>
              <Select value={formData.domain} onValueChange={(v) => setFormData({ ...formData, domain: v })} disabled={!selectedDept}>
                <SelectTrigger className="h-10 w-full"><SelectValue placeholder={selectedDept ? "Select Domain" : "Select Dept First"} /></SelectTrigger>
                <SelectContent>
                  {selectedDept?.domains.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsAddOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" disabled={creating} className="w-full sm:w-auto bg-[#16a34a] hover:bg-[#15803d] text-white">
              {creating ? "Saving..." : existingFacultyInfo ? "Add Assignment" : "Create Faculty"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* ── Manage Assignments Dialog ── */}
    <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Settings2 className="h-5 w-5 text-blue-600" /> Manage Assignments
          </DialogTitle>
        </DialogHeader>

        {managingFaculty && (
          <div className="space-y-5">
            {/* Faculty info */}
            <div className="flex items-center gap-3 py-3 px-4 bg-slate-50 rounded-xl border">
              <Avatar className="h-10 w-10 shrink-0">
                {managingFaculty.profilePicture && <AvatarImage src={managingFaculty.profilePicture} />}
                <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
                  {getInitials(managingFaculty.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">{managingFaculty.name}</p>
                <p className="text-xs text-muted-foreground">{managingFaculty.email}</p>
              </div>
            </div>

            {/* Current assignments */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Current Assignments ({managingAssignments.length})</p>
              {managingAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No assignments. Add one below.</p>
              ) : (
                <div className="space-y-2">
                  {managingAssignments.map((a) => (
                    <div key={a._id} className="flex items-center justify-between gap-3 px-4 py-3 bg-blue-50/70 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="font-medium text-sm text-foreground truncate">
                          {a.department}{a.domain ? ` → ${a.domain}` : ""}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                        onClick={() => handleRemoveAssignment(a._id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add new assignment */}
            <div className="pt-3 border-t">
              <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> Add New Assignment
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select value={newAssignment.department} onValueChange={(v) => {
                  const dept = departments.find(d => d.name === v);
                  setAddAssignmentDept(dept);
                  setNewAssignment({ department: v, domain: "" });
                }}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select Department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d._id} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newAssignment.domain} onValueChange={(v) => setNewAssignment({ ...newAssignment, domain: v })} disabled={!addAssignmentDept}>
                  <SelectTrigger className="h-10"><SelectValue placeholder={addAssignmentDept ? "Select Domain" : "Dept First"} /></SelectTrigger>
                  <SelectContent>
                    {addAssignmentDept?.domains.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddAssignment} disabled={addingAssignment || !newAssignment.department}
                className="mt-3 bg-[#1e3c72] hover:bg-[#2a5298] text-white text-sm">
                <Plus className="h-4 w-4 mr-1.5" /> {addingAssignment ? "Adding..." : "Add Assignment"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* ── Replace Faculty Dialog ── */}
    <Dialog open={isReplaceOpen} onOpenChange={setIsReplaceOpen}>
      <DialogContent className="w-[95vw] max-w-[550px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ArrowLeftRight className="h-5 w-5 text-amber-500" /> Replace Faculty Member
          </DialogTitle>
        </DialogHeader>

        {/* Warning notice */}
        <div className="flex items-start gap-2 sm:gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs sm:text-sm">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            You are about to replace <strong>{replacingFaculty?.name || replacingFaculty?.email}</strong>.
            This will remove their account and create a new one. All existing assignments will be transferred to the new member.
          </p>
        </div>

        <form onSubmit={handleReplace} className="space-y-4 py-2">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">New Faculty Name *</Label>
              <Input placeholder="Dr. Jane Smith" value={replaceForm.name}
                onChange={e => setReplaceForm({ ...replaceForm, name: e.target.value })} required className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">New Email *</Label>
              <Input type="email" placeholder="new.faculty@institution.edu" value={replaceForm.email}
                onChange={e => setReplaceForm({ ...replaceForm, email: e.target.value })} required className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Phone Number *</Label>
              <Input placeholder="1234567890" maxLength={10} value={replaceForm.phone}
                onChange={e => setReplaceForm({ ...replaceForm, phone: e.target.value.replace(/\D/g, '') })} required className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Department *</Label>
              <Select value={replaceForm.department} onValueChange={handleReplaceDeptChange}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Select Department" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d._id} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-sm">Domain / Expertise</Label>
              <Select value={replaceForm.domain} onValueChange={(v) => setReplaceForm({ ...replaceForm, domain: v })} disabled={!replaceSelectedDept}>
                <SelectTrigger className="h-10"><SelectValue placeholder={replaceSelectedDept ? "Select Domain" : "Select Dept First"} /></SelectTrigger>
                <SelectContent>
                  {replaceSelectedDept?.domains.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setIsReplaceOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" disabled={creating} className="w-full sm:w-auto bg-[#1e3c72] hover:bg-[#2a5298] text-white">
              {creating ? "Replacing..." : "Replace & Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </DashboardLayout>;
}
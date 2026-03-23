import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GraduationCap, Users, UserSquare2, BookOpen, Trophy, Mail, Phone, Building2, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [assignedFaculty, setAssignedFaculty] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  useEffect(() => {
    if (!user?._id) return;
    (async () => {
      try {
        const [profileRes, facultyRes, groupsRes] = await Promise.all([
          api.get(`/users/${user._id}`),
          api.get('/users/role/admin'),
          api.get('/groups'),
        ]);
        setProfile(profileRes.data);

        const stProfile = profileRes.data;
        const allFaculty = facultyRes.data;
        const stDomains = (stProfile.domain || "").split(',').map(d => d.trim()).filter(Boolean);

        const assigned = allFaculty.filter(f => {
          if (stProfile.addedBy && f._id === stProfile.addedBy._id) return true;
          if (f.department !== stProfile.department && !f.department) return false;
          const fDomains = (f.domain || "").split(',').map(d => d.trim()).filter(Boolean);
          if (stDomains.length > 0 && fDomains.length > 0) {
            return fDomains.some(d => stDomains.includes(d));
          }
          return f.department === stProfile.department;
        });
        setAssignedFaculty(assigned);

        const groups = groupsRes.data.map(g => ({
          _id: g._id,
          name: g.name,
          members: g.members?.length || 0,
          role: g.creator?._id === user._id ? "Creator" : "Member",
        }));
        setUserGroups(groups);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const groupsCreated = userGroups.filter(g => g.role === "Creator").length;
  const groupsEnrolled = userGroups.length;

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center py-20">Loading dashboard...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="max-w-[1200px] mx-auto pb-8">

        {/* Header / Welcome Banner */}
        {profile?.addedBy && (
          <div className="bg-white rounded-2xl p-5 md:p-6 mb-6 md:mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-slate-200 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Welcome, {profile.name || user?.name || "Student"}!</h2>
              <p className="text-slate-500 mt-2 text-sm md:text-base flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600">
                  <UserSquare2 className="w-3.5 h-3.5" />
                </span>
                Added by Faculty: <span className="font-medium text-blue-600">{profile.addedBy.name || profile.addedBy.email}</span>
              </p>
            </div>
            <div className="hidden sm:flex h-12 w-12 rounded-xl bg-blue-50 items-center justify-center text-blue-600 border border-blue-100">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>
        )}

        {/* Achievements Quick Card → links to full page */}


        {/* Two Box Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 lg:gap-8 mb-8">

          {/* Box 1: Assigned Faculty */}
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-slate-200 transition-transform active:scale-[0.98] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-[45px] h-[45px] rounded-xl flex items-center justify-center bg-blue-100 text-blue-600 shrink-0">
                <UserSquare2 className="w-[22px] h-[22px]" />
              </div>
              <span className="font-semibold text-slate-800 text-base">Assigned Faculty</span>
            </div>
            <div className="flex flex-col">
              {assignedFaculty.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center bg-slate-50 rounded-lg">No faculty assigned to your domain.</p>
              ) : (
                assignedFaculty.map((faculty, idx) => (
                  <div key={faculty._id || idx} onClick={() => setSelectedFaculty(faculty)} className="flex items-center justify-between py-3 border-b border-slate-200 last:border-0 hover:bg-slate-50 transition-colors px-2 -mx-2 rounded-lg cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-[35px] h-[35px] rounded-full bg-slate-100 flex items-center justify-center text-blue-600 font-semibold text-sm shrink-0 overflow-hidden border border-slate-200">
                        {faculty.profilePicture ? (
                          <img src={faculty.profilePicture} alt={faculty.name} className="w-full h-full object-cover" />
                        ) : (
                          getInitials(faculty.name || faculty.email)
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800 text-[0.95rem]">{faculty.name || faculty.email}</div>
                        <div className="text-[0.8rem] text-slate-500">{faculty.department || "General"}</div>
                      </div>
                    </div>
                    <span className="text-[0.75rem] px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium whitespace-nowrap">Active</span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 text-right border-t border-slate-100 pt-3">
              <span className="text-blue-600 text-[0.9rem] font-medium">{assignedFaculty.length} faculty assigned</span>
            </div>
          </div>

          {/* Box 2: Groups Information */}
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-slate-200 transition-transform active:scale-[0.98] animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-[45px] h-[45px] rounded-xl flex items-center justify-center bg-green-100 text-green-600 shrink-0">
                <Users className="w-[22px] h-[22px]" />
              </div>
              <span className="font-semibold text-slate-800 text-base">My Groups</span>
            </div>
            <div className="flex flex-col gap-3.5 mb-5 space-y-1">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                <span className="text-slate-500 text-[0.95rem] font-medium">Groups Created</span>
                <span className="font-bold text-[1.3rem] text-blue-600">{groupsCreated}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                <span className="text-slate-500 text-[0.95rem] font-medium">Groups Enrolled</span>
                <span className="font-bold text-[1.3rem] text-green-600">{groupsEnrolled}</span>
              </div>
            </div>
            <div className="flex flex-col mt-2">
              {userGroups.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center bg-slate-50 rounded-lg">No groups yet. Create one from Chat!</p>
              ) : (
                userGroups.map((group, idx) => (
                  <div key={group._id || idx} className="flex justify-between items-center py-2.5 border-b border-slate-200 last:border-0 hover:bg-slate-50 transition-colors px-2 -mx-2 rounded-lg cursor-pointer">
                    <div>
                      <div className="font-medium text-slate-800 text-[0.95rem] flex items-center gap-1.5 pl-1">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        {group.name}
                      </div>
                      <div className="text-[0.82rem] text-slate-500 ml-5">{group.members} members</div>
                    </div>
                    <span className={`text-[0.75rem] px-2.5 py-1 rounded-full whitespace-nowrap font-medium ${group.role === 'Creator' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                      {group.role}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 text-right border-t border-slate-100 pt-3">
              <span className="text-green-600 text-[0.9rem] font-medium">{userGroups.length} total groups</span>
            </div>
          </div>

        </div>
      </div>

      <Dialog open={!!selectedFaculty} onOpenChange={(open) => !open && setSelectedFaculty(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Faculty Profile</DialogTitle>
          </DialogHeader>
          {selectedFaculty && (
            <div className="flex flex-col gap-4 py-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center text-xl font-bold text-blue-600 shrink-0">
                  {selectedFaculty.profilePicture ? (
                    <img src={selectedFaculty.profilePicture} alt={selectedFaculty.name} className="h-full w-full object-cover" />
                  ) : (
                    getInitials(selectedFaculty.name || selectedFaculty.email)
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{selectedFaculty.name || selectedFaculty.email}</h3>
                  <p className="text-sm text-slate-500 capitalize px-2 py-0.5 bg-slate-100 rounded-full inline-block mt-1">
                    Faculty Member
                  </p>
                </div>
              </div>
              <div className="grid gap-3 mt-2">
                <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>{selectedFaculty.email}</span>
                </div>
                {selectedFaculty.phone && (
                  <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{selectedFaculty.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span>{selectedFaculty.department || "General Department"}</span>
                </div>
                {selectedFaculty.domain && (
                  <div className="flex items-start gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{selectedFaculty.domain}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
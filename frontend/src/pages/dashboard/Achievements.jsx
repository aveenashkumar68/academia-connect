import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import {
    Trophy, Star, Flame, Target, Zap, Award,
    FolderKanban, ExternalLink, Briefcase, Mail,
    Sparkles, Medal, TrendingUp, Users, Plus, Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

/* ─── Projects ─── */
const PROJECTS = [];

const statusColor = (s) =>
    s === "Completed" ? "bg-green-100 text-green-700"
        : s === "In Progress" ? "bg-amber-100 text-amber-700"
            : "bg-slate-100 text-slate-600";

const progressGradient = (p) =>
    p === 100
        ? "bg-gradient-to-r from-green-400 to-emerald-500"
        : p > 50
            ? "bg-gradient-to-r from-blue-400 to-violet-500"
            : "bg-gradient-to-r from-amber-400 to-orange-500";

export default function Achievements() {
    const { user } = useAuth();
    const [industryContacts, setIndustryContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state for exploring industry professionals
    const [exploreModalOpen, setExploreModalOpen] = useState(false);
    const [allIndustryProfessionals, setAllIndustryProfessionals] = useState([]);
    const [connectingId, setConnectingId] = useState(null);

    useEffect(() => {
        if (!user?._id) return;
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            // Fetch student's current connections
            const { data: connections } = await api.get('/connections/student');

            // Format connections for UI
            const formattedContacts = connections.map(conn => ({
                id: conn.industryPartner._id,
                name: conn.industryPartner.name || conn.industryPartner.email,
                role: conn.industryPartner.industryName || 'Industry Professional',
                company: conn.industryPartner.companyName || 'Unknown Company',
                contacted: true,
                status: conn.status
            }));

            setIndustryContacts(formattedContacts);
        } catch (error) {
            console.error("Failed to fetch achievements data", error);
            toast.error("Failed to load industry connections");
        } finally {
            setLoading(false);
        }
    };

    const handleExploreProfessionals = async () => {
        try {
            setExploreModalOpen(true);
            const { data: professionals } = await api.get('/users/role/industry_partner');
            setAllIndustryProfessionals(professionals);
        } catch (error) {
            toast.error("Failed to load industry professionals");
        }
    };

    const handleConnect = async (industryId) => {
        setConnectingId(industryId);
        try {
            await api.post('/connections', { industryId, message: "I would like to connect and learn more about your industry experience." });
            toast.success("Connection request sent!");
            // Refresh data
            await fetchData();
            setExploreModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send connection request");
        } finally {
            setConnectingId(null);
        }
    };

    const contactedCount = industryContacts.filter(c => c.contacted).length;

    return (
        <DashboardLayout title="Achievements">
            <div className="max-w-[1200px] mx-auto pb-8 space-y-6 md:space-y-8">

                {/* ═══ Projects ═══ */}
                <div className="bg-white rounded-2xl p-5 md:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-[45px] h-[45px] rounded-xl flex items-center justify-center bg-violet-100 text-violet-600 shrink-0">
                            <FolderKanban className="w-[22px] h-[22px]" />
                        </div>
                        <div>
                            <span className="font-semibold text-slate-800 text-base block">My Projects</span>
                            <span className="text-xs text-slate-500">{PROJECTS.filter(p => p.status === "Completed").length} completed, {PROJECTS.filter(p => p.status !== "Completed").length} in progress</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {PROJECTS.length > 0 ? (
                            PROJECTS.map((project, idx) => (
                                <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all duration-200">
                                    <div className="flex items-center justify-between mb-2.5">
                                        <h4 className="font-semibold text-slate-800 text-[0.95rem] flex items-center gap-1.5">
                                            <ExternalLink className="w-4 h-4 text-violet-400" />
                                            {project.name}
                                        </h4>
                                        <span className={`text-[0.72rem] px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap ${statusColor(project.status)}`}>
                                            {project.status}
                                        </span>
                                    </div>
                                    <p className="text-[0.82rem] text-slate-500 mb-3">Tech: {project.tech}</p>
                                    {/* Progress bar */}
                                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ease-out ${progressGradient(project.progress)}`}
                                            style={{ width: `${project.progress}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1.5">
                                        <span className="text-[0.72rem] text-slate-400">Progress</span>
                                        <span className="text-[0.72rem] font-medium text-slate-600">{project.progress}%</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full p-8 text-center bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                                <p className="text-slate-500 font-medium">No projects yet. Start building to see your projects here!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══ Industry Contacts ═══ */}
                <div className="bg-white rounded-2xl p-5 md:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-[45px] h-[45px] rounded-xl flex items-center justify-center bg-indigo-100 text-indigo-600 shrink-0">
                            <Briefcase className="w-[22px] h-[22px]" />
                        </div>
                        <div>
                            <span className="font-semibold text-slate-800 text-base block">Industry Persons Contacted</span>
                            <span className="text-xs text-slate-500">{contactedCount} contacted</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <button
                            onClick={handleExploreProfessionals}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-indigo-200"
                        >
                            <Users className="w-4 h-4" />
                            Explore Professionals
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {industryContacts.length > 0 ? (
                            industryContacts.map((contact, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all duration-200">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-[40px] h-[40px] rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${contact.contacted
                                            ? "bg-indigo-100 text-indigo-600"
                                            : "bg-slate-100 text-slate-500"
                                            }`}>
                                            {contact.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-800 text-[0.95rem]">{contact.name}</div>
                                            <div className="text-[0.8rem] text-slate-500">{contact.role} • {contact.company}</div>
                                        </div>
                                    </div>
                                    {contact.contacted ? (
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className="flex items-center justify-center gap-1 text-[0.75rem] px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium whitespace-nowrap">
                                                <Mail className="w-3 h-3" />
                                                Contacted
                                            </span>
                                            <span className={`text-[0.75rem] px-2.5 py-1 rounded-full font-medium whitespace-nowrap text-center ${contact.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                                contact.status === 'declined' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {contact.status === 'accepted' ? 'Connected' :
                                                    contact.status === 'declined' ? 'Declined' :
                                                        'Pending Request'}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[0.75rem] px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-medium whitespace-nowrap">
                                            Pending
                                        </span>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full p-8 text-center bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                                <p className="text-slate-500 font-medium">No industry contacts yet. Connect with professionals to build your network!</p>
                            </div>
                        )}
                    </div>

                    {industryContacts.length > 0 && (
                        <div className="mt-5 flex items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                            <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0" />
                            <p className="text-[0.82rem] text-indigo-700">
                                <span className="font-semibold">{contactedCount}</span> industry professionals contacted
                            </p>
                        </div>
                    )}
                </div>

            </div>

            {/* Explore Professionals Modal */}
            <Dialog open={exploreModalOpen} onOpenChange={setExploreModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Explore Industry Professionals</DialogTitle>
                        <DialogDescription>
                            Connect with professionals to grow your network and career opportunities.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-3 mt-4 max-h-[60vh] overflow-y-auto pr-2">
                        {allIndustryProfessionals.length === 0 ? (
                            <p className="text-center text-slate-500 py-4">Loading professionals...</p>
                        ) : (
                            allIndustryProfessionals.map((prof) => {
                                // Check if already connected/contacted
                                const isContacted = industryContacts.some(c => c.id === prof._id);

                                return (
                                    <div key={prof._id} className="flex items-center justify-between p-3 border border-slate-100 bg-slate-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-[40px] h-[40px] rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-sm shrink-0 overflow-hidden border border-indigo-200">
                                                {prof.profilePicture ? (
                                                    <img src={prof.profilePicture} alt={prof.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    (prof.name || prof.email).split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800 text-[0.95rem]">{prof.name || prof.email}</div>
                                                <div className="text-[0.8rem] text-slate-500">{prof.industryName || "Industry Professional"} • {prof.companyName || "Company"}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleConnect(prof._id)}
                                            disabled={isContacted || connectingId === prof._id}
                                            className={`text-xs px-3 py-1.5 flex items-center gap-1.5 rounded-lg font-medium transition-all ${isContacted
                                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                                                }`}
                                        >
                                            {connectingId === prof._id ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : isContacted ? (
                                                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Sent</span>
                                            ) : (
                                                <span className="flex items-center gap-1"><Plus className="w-3 h-3" /> Connect</span>
                                            )}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </DialogContent>
            </Dialog>

        </DashboardLayout>
    );
}

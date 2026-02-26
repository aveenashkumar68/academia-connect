import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { toast } from "sonner";
import {
    Plus, X, Send, Trash2, ThumbsUp, Share2, MessageCircle,
    MapPin, Calendar, Clock, DollarSign, Briefcase, Building2,
    Globe, Mail, Phone, User, AlertTriangle, Tag, ChevronDown,
    ChevronUp, ExternalLink, Search
} from "lucide-react";

const POST_TYPES = [
    { value: "industry", label: "Industry", icon: "🏭", color: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" },
    { value: "academic", label: "Academic", icon: "📚", color: "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800" },
    { value: "event", label: "Event", icon: "📅", color: "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800" },
    { value: "job", label: "Job", icon: "💼", color: "bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" },
    { value: "general", label: "General", icon: "📢", color: "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700" },
];



export default function CommunityPosts() {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [typeFilter, setTypeFilter] = useState("all");
    const [deptFilter, setDeptFilter] = useState("all");

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [posting, setPosting] = useState(false);
    const [form, setForm] = useState(getEmptyForm());
    const [tagInput, setTagInput] = useState("");
    const [departments, setDepartments] = useState([]);

    function getEmptyForm() {
        return {
            postType: "industry", title: "", message: "", department: "",
            targetAudience: "all", location: "", companyName: "", industryName: "",
            contactPerson: "", contactEmail: "", contactPhone: "", website: "",
            requirements: "", experience: "", compensation: "", duration: "",
            registrationDeadline: "", eventDate: "", eventTime: "",
            tags: [], isUrgent: false,
        };
    }

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const params = {};
            if (typeFilter !== "all") params.type = typeFilter;
            if (deptFilter !== "all") params.department = deptFilter;
            const { data } = await api.get("/posts", { params });
            setPosts(data);
        } catch {
            toast.error("Failed to load posts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPosts(); }, [typeFilter, deptFilter]);

    // Fetch departments from API
    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/departments");
                setDepartments(data);
            } catch {
                console.error("Failed to fetch departments");
            }
        })();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.message.trim()) {
            toast.error("Title and message are required");
            return;
        }
        setPosting(true);
        try {
            await api.post("/posts", { ...form, tags: form.tags });
            toast.success("Post published!");
            setForm(getEmptyForm());
            setShowForm(false);
            fetchPosts();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create post");
        } finally {
            setPosting(false);
        }
    };

    const handleLike = async (id) => {
        try {
            const { data } = await api.put(`/posts/${id}/like`);
            setPosts(prev => prev.map(p => p._id === id ? { ...p, likeCount: data.likeCount, isLiked: data.isLiked } : p));
        } catch {
            toast.error("Failed to like post");
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/posts/${id}`);
            setPosts(prev => prev.filter(p => p._id !== id));
            toast.success("Post deleted");
        } catch {
            toast.error("Failed to delete post");
        }
    };

    const addTag = () => {
        const t = tagInput.trim();
        if (t && !form.tags.includes(t)) {
            setForm(prev => ({ ...prev, tags: [...prev.tags, t] }));
            setTagInput("");
        }
    };

    const removeTag = (idx) => {
        setForm(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== idx) }));
    };

    const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const timeAgo = (date) => {
        const s = Math.floor((Date.now() - new Date(date)) / 1000);
        if (s < 60) return "just now";
        const m = Math.floor(s / 60);
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        const d = Math.floor(h / 24);
        if (d < 7) return `${d}d ago`;
        return new Date(date).toLocaleDateString();
    };

    const getTypeInfo = (type) => POST_TYPES.find(t => t.value === type) || POST_TYPES[4];

    const roleBadgeClass = (role) => {
        const map = {
            "super-admin": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            student: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            industry_partner: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        };
        return map[role] || "bg-gray-100 text-gray-700";
    };

    const roleLabel = (role) => {
        const map = { "super-admin": "Super Admin", admin: "Faculty", student: "Student", industry_partner: "Industry" };
        return map[role] || role;
    };

    const showIndustryFields = ["industry", "academic", "event", "job"].includes(form.postType);
    const showJobFields = form.postType === "job";
    const showEventFields = form.postType === "event";

    return (
        <DashboardLayout title="Community Hub">
            <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">




                {/* Create Post Button */}
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full p-4 sm:p-5 rounded-xl border-2 border-dashed border-primary/40 bg-card hover:bg-primary/5 text-primary font-semibold transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Create New Post
                    </button>
                )}

                {/* Create Post Form */}
                {showForm && (
                    <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/50">
                            <h3 className="font-bold text-foreground">Create New Post</h3>
                            <button onClick={() => { setShowForm(false); setForm(getEmptyForm()); }} className="p-1.5 rounded-md hover:bg-muted transition"><X className="h-4 w-4" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">

                            {/* Post Type */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Tag className="h-4 w-4" /> Post Type</label>
                                <div className="flex flex-wrap gap-2">
                                    {POST_TYPES.map(t => (
                                        <button key={t.value} type="button"
                                            onClick={() => updateForm("postType", t.value)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${form.postType === t.value ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/50"}`}
                                        >
                                            {t.icon} {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Title + Audience */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-2 space-y-1">
                                    <label className="text-sm font-semibold">Title *</label>
                                    <input value={form.title} onChange={e => updateForm("title", e.target.value)} placeholder="Enter post title" required maxLength={200}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold">Target Audience</label>
                                    <select value={form.targetAudience} onChange={e => updateForm("targetAudience", e.target.value)}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                        <option value="all">Everyone</option>
                                        <option value="faculty">Faculty Only</option>
                                        <option value="students">Students Only</option>
                                        <option value="both">Both Faculty & Students</option>
                                    </select>
                                </div>
                            </div>

                            {/* Department + Location */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold">Department</label>
                                    <select value={form.department} onChange={e => updateForm("department", e.target.value)}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                                        <option value="">All Departments</option>
                                        {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold">Location</label>
                                    <input value={form.location} onChange={e => updateForm("location", e.target.value)} placeholder="City, State or Remote"
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                </div>
                            </div>

                            {/* Company / Industry Fields */}
                            {showIndustryFields && (
                                <div className="rounded-lg bg-muted/30 p-4 space-y-3">
                                    <h4 className="text-sm font-bold flex items-center gap-1.5"><Building2 className="h-4 w-4" /> Industry & Company Details</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Input label="Company / Organization" value={form.companyName} onChange={v => updateForm("companyName", v)} placeholder="Enter company name" />
                                        <Input label="Industry Name" value={form.industryName} onChange={v => updateForm("industryName", v)} placeholder="e.g., Technology" />
                                        <Input label="Contact Person" value={form.contactPerson} onChange={v => updateForm("contactPerson", v)} placeholder="Name" />
                                        <Input label="Contact Email" value={form.contactEmail} onChange={v => updateForm("contactEmail", v)} placeholder="contact@company.com" type="email" />
                                        <Input label="Contact Phone" value={form.contactPhone} onChange={v => updateForm("contactPhone", v)} placeholder="+1 234 567 890" />
                                        <Input label="Website" value={form.website} onChange={v => updateForm("website", v)} placeholder="https://company.com" />
                                    </div>
                                </div>
                            )}

                            {/* Job Fields */}
                            {showJobFields && (
                                <div className="rounded-lg bg-green-50/50 dark:bg-green-900/10 p-4 space-y-3">
                                    <h4 className="text-sm font-bold flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> Job Details</h4>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">Requirements</label>
                                        <textarea value={form.requirements} onChange={e => updateForm("requirements", e.target.value)} rows={2} placeholder="List key requirements..."
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Input label="Experience Required" value={form.experience} onChange={v => updateForm("experience", v)} placeholder="e.g., 2-3 years" />
                                        <Input label="Compensation" value={form.compensation} onChange={v => updateForm("compensation", v)} placeholder="e.g., $50,000/year" />
                                        <Input label="Duration" value={form.duration} onChange={v => updateForm("duration", v)} placeholder="e.g., Full-time, 6 months" />
                                        <Input label="Registration Deadline" value={form.registrationDeadline} onChange={v => updateForm("registrationDeadline", v)} type="date" />
                                    </div>
                                </div>
                            )}

                            {/* Event Fields */}
                            {showEventFields && (
                                <div className="rounded-lg bg-orange-50/50 dark:bg-orange-900/10 p-4 space-y-3">
                                    <h4 className="text-sm font-bold flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Event Details</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Input label="Event Date" value={form.eventDate} onChange={v => updateForm("eventDate", v)} type="date" />
                                        <Input label="Event Time" value={form.eventTime} onChange={v => updateForm("eventTime", v)} placeholder="e.g., 10:00 AM - 4:00 PM" />
                                        <Input label="Registration Deadline" value={form.registrationDeadline} onChange={v => updateForm("registrationDeadline", v)} type="date" />
                                    </div>
                                </div>
                            )}

                            {/* Message */}
                            <div className="space-y-1">
                                <label className="text-sm font-semibold">Message / Description *</label>
                                <textarea value={form.message} onChange={e => updateForm("message", e.target.value)} rows={4} required maxLength={5000} placeholder="Write your post content here..."
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                                <p className="text-xs text-muted-foreground text-right">{form.message.length}/5000</p>
                            </div>

                            {/* Tags */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Tags</label>
                                {form.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {form.tags.map((t, i) => (
                                            <span key={i} className="inline-flex items-center gap-1 bg-muted px-2.5 py-1 rounded-full text-xs font-medium">
                                                #{t}
                                                <button type="button" onClick={() => removeTag(i)} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                                        placeholder="Add a tag and press Enter"
                                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                                    <button type="button" onClick={addTag}
                                        className="px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition">Add</button>
                                </div>
                            </div>

                            {/* Urgent checkbox */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isUrgent} onChange={e => updateForm("isUrgent", e.target.checked)}
                                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                <span className="text-sm font-medium">Mark as Urgent</span>
                            </label>

                            {/* Submit */}
                            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                                <button type="button" onClick={() => { setShowForm(false); setForm(getEmptyForm()); }}
                                    className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition">Cancel</button>
                                <button type="submit" disabled={posting}
                                    className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition">
                                    <Send className="h-4 w-4" />
                                    {posting ? "Publishing..." : "Publish Post"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                        {[{ value: "all", label: "All Posts" }, ...POST_TYPES].map(t => (
                            <button key={t.value}
                                onClick={() => setTypeFilter(t.value)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${typeFilter === t.value ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}
                            >
                                {t.icon && `${t.icon} `}{t.label}
                            </button>
                        ))}
                    </div>
                    <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 self-start sm:self-auto">
                        <option value="all">All Departments</option>
                        {departments.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                    </select>
                </div>

                {/* Posts Feed */}
                {loading ? (
                    <div className="text-center py-16 text-muted-foreground">Loading posts...</div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-16">
                        <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">No posts found. Be the first to create one!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map(post => (
                            <PostCard key={post._id} post={post} user={user}
                                getTypeInfo={getTypeInfo} roleBadgeClass={roleBadgeClass}
                                roleLabel={roleLabel} timeAgo={timeAgo}
                                onLike={handleLike} onDelete={handleDelete} />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

/* ── Reusable input ── */
function Input({ label, value, onChange, placeholder, type = "text" }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{label}</label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
    );
}

/* ── Post Card ── */
function PostCard({ post, user, getTypeInfo, roleBadgeClass, roleLabel, timeAgo, onLike, onDelete }) {
    const [expanded, setExpanded] = useState(false);
    const typeInfo = getTypeInfo(post.postType);
    const canDelete = post.author === user?._id || user?.role === "super-admin";

    return (
        <div className={`rounded-xl border bg-card shadow-sm hover:shadow-md transition-all relative overflow-hidden ${post.isUrgent ? "border-l-4 border-l-destructive border-t border-r border-b border-border/50" : "border-border/50"}`}>
            {post.isUrgent && (
                <div className="absolute top-0 right-4 -translate-y-0 z-10">
                    <span className="inline-flex items-center gap-1 bg-destructive text-white text-xs font-bold px-3 py-1 rounded-b-lg">
                        <AlertTriangle className="h-3 w-3" /> Urgent
                    </span>
                </div>
            )}

            <div className="p-4 sm:p-5">
                {/* Author + Meta */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm border border-border/50">
                            {post.authorName?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-semibold text-sm text-foreground truncate">{post.authorName}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${roleBadgeClass(post.authorRole)}`}>
                                    {roleLabel(post.authorRole)}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${typeInfo.color}`}>
                                    {typeInfo.icon} {typeInfo.label}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <span>{timeAgo(post.createdAt)}</span>
                                {post.department && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{post.department}</span>}
                            </div>
                        </div>
                    </div>
                    {canDelete && (
                        <button onClick={() => onDelete(post._id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition shrink-0" title="Delete">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-bold text-foreground mt-3">{post.title}</h3>

                {/* Company badge */}
                {post.companyName && (
                    <div className="mt-2 inline-flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-sm">{post.companyName}</span>
                        {post.industryName && <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{post.industryName}</span>}
                    </div>
                )}

                {/* Message */}
                <p className="mt-3 text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap break-words">
                    {post.message?.length > 300 && !expanded ? post.message.slice(0, 300) + "..." : post.message}
                </p>
                {post.message?.length > 300 && (
                    <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary font-medium mt-1 flex items-center gap-0.5">
                        {expanded ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Read more</>}
                    </button>
                )}

                {/* Contact Info */}
                {(post.contactEmail || post.contactPhone || post.contactPerson) && (
                    <div className="mt-3 rounded-lg bg-muted/30 p-3 space-y-1.5 text-sm">
                        <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Contact Info</p>
                        {post.contactPerson && <p className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" />{post.contactPerson}</p>}
                        {post.contactEmail && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><a href={`mailto:${post.contactEmail}`} className="text-primary hover:underline">{post.contactEmail}</a></p>}
                        {post.contactPhone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{post.contactPhone}</p>}
                        {post.website && <p className="flex items-center gap-2"><ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /><a href={post.website} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{post.website}</a></p>}
                    </div>
                )}

                {/* Additional Details */}
                <PostDetails post={post} />

                {/* Tags */}
                {post.tags?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {post.tags.map((t, i) => (
                            <span key={i} className="bg-muted px-2 py-0.5 rounded-full text-xs font-medium text-muted-foreground">#{t}</span>
                        ))}
                    </div>
                )}

                {/* Target Audience */}
                {post.targetAudience && post.targetAudience !== "all" && (
                    <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Target: {post.targetAudience}</p>
                )}

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap gap-2">
                    <button onClick={() => onLike(post._id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${post.isLiked ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
                        <ThumbsUp className={`h-4 w-4 ${post.isLiked ? "fill-primary" : ""}`} />
                        {post.likeCount || 0}
                    </button>
                    {post.contactEmail && (
                        <a href={`mailto:${post.contactEmail}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-muted/50 text-muted-foreground hover:bg-muted transition">
                            <Mail className="h-4 w-4" /> Contact
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Extra detail rows ── */
function PostDetails({ post }) {
    const items = [];
    if (post.requirements) items.push({ icon: <Briefcase className="h-3.5 w-3.5" />, label: "Requirements", value: post.requirements, highlight: true });
    if (post.location) items.push({ icon: <MapPin className="h-3.5 w-3.5" />, value: post.location });
    if (post.eventDate) items.push({ icon: <Calendar className="h-3.5 w-3.5" />, value: `Event: ${new Date(post.eventDate).toLocaleDateString()}${post.eventTime ? ` at ${post.eventTime}` : ""}` });
    if (post.registrationDeadline) items.push({ icon: <Clock className="h-3.5 w-3.5" />, value: `Deadline: ${new Date(post.registrationDeadline).toLocaleDateString()}` });
    if (post.compensation) items.push({ icon: <DollarSign className="h-3.5 w-3.5" />, value: post.compensation });
    if (post.duration) items.push({ icon: <Clock className="h-3.5 w-3.5" />, value: post.duration });
    if (post.experience) items.push({ icon: <Briefcase className="h-3.5 w-3.5" />, value: `Experience: ${post.experience}` });

    if (items.length === 0) return null;

    return (
        <div className="mt-3 space-y-1.5">
            {items.map((item, i) => (
                item.highlight ? (
                    <div key={i} className="rounded-lg bg-amber-50/60 dark:bg-amber-900/10 p-3">
                        <p className="text-xs font-bold mb-1 flex items-center gap-1.5 text-amber-700 dark:text-amber-400">{item.icon} {item.label}</p>
                        <p className="text-sm text-foreground/85">{item.value}</p>
                    </div>
                ) : (
                    <p key={i} className="text-sm text-muted-foreground flex items-center gap-2">{item.icon}{item.value}</p>
                )
            ))}
        </div>
    );
}

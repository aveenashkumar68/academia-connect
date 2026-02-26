import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import api from "@/lib/api";
import { toast } from "sonner";
import { Bell, CheckCheck } from "lucide-react";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/notifications/all");
            setNotifications(data);
        } catch {
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put("/notifications/mark-read", { ids: [id] });
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
        } catch {
            toast.error("Failed to mark as read");
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put("/notifications/mark-all-read");
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            toast.success("All notifications marked as read");
        } catch {
            toast.error("Failed to mark all as read");
        }
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return "just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

    const typeIcon = (type) => {
        if (type === "post_created") return "📝";
        if (type === "user_created") return "👤";
        return "🔔";
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <DashboardLayout title="Notifications">
            <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Bell className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Notifications</h2>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                            </p>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors self-start sm:self-auto"
                        >
                            <CheckCheck className="h-4 w-4" />
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="text-center py-16 text-muted-foreground">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-16">
                        <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">No notifications yet</p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
                        {notifications.map((n, i) => (
                            <div
                                key={n._id}
                                onClick={() => !n.isRead && markAsRead(n._id)}
                                className={`flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 transition-colors cursor-pointer
                  ${i > 0 ? "border-t border-border/50" : ""}
                  ${n.isRead
                                        ? "bg-card hover:bg-muted/30"
                                        : "bg-primary/[0.04] border-l-[3px] border-l-primary hover:bg-primary/[0.07]"
                                    }`}
                            >
                                <span className="text-lg sm:text-xl mt-0.5 shrink-0">{typeIcon(n.type)}</span>
                                <div className="min-w-0 flex-1">
                                    <p className={`text-sm leading-snug ${n.isRead ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                                        {n.message}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                        <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                                        {!n.isRead && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                                                NEW
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {!n.isRead && (
                                    <div className="hidden sm:flex shrink-0 mt-1">
                                        <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

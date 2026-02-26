import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

export function NotificationDropdown() {
    const [count, setCount] = useState(0);
    const navigate = useNavigate();

    // Fetch unread count
    const fetchCount = async () => {
        try {
            const { data } = await api.get("/notifications/count");
            setCount(data.count);
        } catch {
            // silently ignore
        }
    };

    // Poll count every 30s
    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <button
            onClick={() => navigate("/notifications")}
            className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Notifications"
        >
            <Bell className="h-5 w-5" />
            {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                    {count > 99 ? "99+" : count}
                </span>
            )}
        </button>
    );
}

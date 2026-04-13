import { useRef, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { NotificationDropdown } from "./NotificationDropdown";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Camera, Trash2, User, Loader2 } from "lucide-react";

export function DashboardLayout({
  children,
  title,
  description
}) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const syncLocalStorage = (pictureUrl) => {
    const existingUser = JSON.parse(localStorage.getItem("user") || "{}");
    const updatedUser = { ...existingUser, profilePicture: pictureUrl };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    window.dispatchEvent(new Event("user-updated"));
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const { data } = await api.post("/auth/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      syncLocalStorage(data.profilePicture);
      toast.success("Profile picture updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemove = async () => {
    if (!user?.profilePicture) return;
    setRemoving(true);
    try {
      await api.delete("/auth/avatar");
      syncLocalStorage("");
      toast.success("Profile picture removed!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove picture");
    } finally {
      setRemoving(false);
    }
  };

  return <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header className="flex h-16 items-center justify-between border-b border-border/50 px-4 sm:px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center gap-3 sm:gap-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <div className="hidden sm:flex flex-col">
            <h1 className="font-display text-lg font-bold text-foreground leading-none">Welcome {user?.name || "User"}!</h1>
            <p className="text-xs text-muted-foreground mt-1"></p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <NotificationDropdown />

          {/* Hidden file input for avatar upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-border/50 cursor-pointer hover:opacity-80 transition-opacity"
                role="button"
                tabIndex={0}
                title="Profile options"
              >
                <div className="hidden sm:flex flex-col items-end">
                  <p className="text-sm font-semibold text-foreground leading-none">{user?.name || "User"}</p>
                  {role !== 'super-admin' && (
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{role?.replace("_", " ") || "Loading..."}</p>
                  )}
                </div>
                <div className="relative h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground border border-border/50 hover:ring-2 hover:ring-primary/30 transition-all overflow-hidden">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-bold text-xs sm:text-sm">
                      {initials}
                    </span>
                  )}
                  {(uploading || removing) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Camera className="mr-2 h-4 w-4" />
                {user?.profilePicture ? "Change Photo" : "Upload Photo"}
              </DropdownMenuItem>
              {user?.profilePicture && (
                <DropdownMenuItem
                  onClick={handleRemove}
                  disabled={removing}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Photo
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 bg-background animate-fade-in">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
          {children}
        </div>
      </main>
    </SidebarInset>
  </SidebarProvider>;
}
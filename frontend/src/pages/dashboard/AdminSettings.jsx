import { useState, useEffect } from "react";
import api from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Lock } from "lucide-react";

export default function AdminSettings() {
    const [nameData, setNameData] = useState({ name: "" });
    const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "" });
    const [updatingName, setUpdatingName] = useState(false);
    const [updatingPassword, setUpdatingPassword] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get("/users/profile");
                if (response.data && response.data.name) {
                    setNameData({ name: response.data.name });
                }
            } catch (error) {
                console.error("Failed to fetch profile info");
            }
        };
        fetchProfile();
    }, []);

    const handleUpdateName = async (e) => {
        e.preventDefault();
        setUpdatingName(true);
        try {
            await api.put("/auth/profile", nameData);
            toast.success("Profile name updated successfully. Please log in again to see changes everywhere.");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile name");
        } finally {
            setUpdatingName(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setUpdatingPassword(true);
        try {
            await api.put("/auth/password", passwordData);
            toast.success("Password updated successfully.");
            setPasswordData({ currentPassword: "", newPassword: "" });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update password");
        } finally {
            setUpdatingPassword(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">Settings</h2>
                        <p className="text-muted-foreground">Manage your account settings and credentials</p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Change Name */}
                    <Card className="shadow-sm border border-border/50 bg-card">
                        <CardHeader className="flex flex-row items-center gap-3 pb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">Profile Details</CardTitle>
                                <CardDescription>Update your display name.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdateName} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="Enter your name"
                                        value={nameData.name}
                                        onChange={e => setNameData({ name: e.target.value })}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full mt-2" disabled={updatingName}>
                                    {updatingName ? "Updating..." : "Update Name"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Change Password */}
                    <Card className="shadow-sm border border-border/50 bg-card">
                        <CardHeader className="flex flex-row items-center gap-3 pb-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Lock className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">Security</CardTitle>
                                <CardDescription>Change your account password.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        placeholder="Enter current password"
                                        value={passwordData.currentPassword}
                                        onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        placeholder="Enter new password"
                                        value={passwordData.newPassword}
                                        onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full mt-2" disabled={updatingPassword}>
                                    {updatingPassword ? "Updating..." : "Update Password"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

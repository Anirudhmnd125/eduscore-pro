import { Outlet, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { useAuth } from "@/hooks/useAuth";

interface DashboardLayoutProps {
  role: "admin" | "faculty" | "student";
}

export function DashboardLayout({ role }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const userName = profile?.full_name || 
    (role === "admin" ? "Admin" : role === "faculty" ? "Faculty" : "Student");

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar role={role} userName={userName} onLogout={handleLogout} />
      <main className="pl-64">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

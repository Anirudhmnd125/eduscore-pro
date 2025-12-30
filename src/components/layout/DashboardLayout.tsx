import { Outlet, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/ui/app-sidebar";

interface DashboardLayoutProps {
  role: "admin" | "faculty" | "student";
}

export function DashboardLayout({ role }: DashboardLayoutProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  // In production, this would come from auth context
  const userName = role === "admin" ? "Dr. Admin" : role === "faculty" ? "Prof. Johnson" : "Alex Student";

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

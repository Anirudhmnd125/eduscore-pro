import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import {
  LayoutDashboard,
  Upload,
  FileText,
  Users,
  Settings,
  GraduationCap,
  ClipboardCheck,
  BarChart3,
  LogOut,
} from "lucide-react";

type UserRole = "admin" | "faculty" | "student";

interface SidebarProps {
  role: UserRole;
  userName: string;
  onLogout?: () => void;
}

const navigationConfig: Record<UserRole, Array<{ label: string; path: string; icon: React.ReactNode }>> = {
  admin: [
    { label: "Dashboard", path: "/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Faculty", path: "/admin/faculty", icon: <Users className="w-5 h-5" /> },
    { label: "Students", path: "/admin/students", icon: <GraduationCap className="w-5 h-5" /> },
    { label: "Evaluations", path: "/admin/evaluations", icon: <ClipboardCheck className="w-5 h-5" /> },
    { label: "Reports", path: "/admin/reports", icon: <BarChart3 className="w-5 h-5" /> },
    { label: "Settings", path: "/admin/settings", icon: <Settings className="w-5 h-5" /> },
  ],
  faculty: [
    { label: "Dashboard", path: "/faculty", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Upload Exam", path: "/faculty/upload", icon: <Upload className="w-5 h-5" /> },
    { label: "Evaluations", path: "/faculty/evaluations", icon: <ClipboardCheck className="w-5 h-5" /> },
    { label: "Answer Sheets", path: "/faculty/sheets", icon: <FileText className="w-5 h-5" /> },
    { label: "Reports", path: "/faculty/reports", icon: <BarChart3 className="w-5 h-5" /> },
  ],
  student: [
    { label: "Dashboard", path: "/student", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "My Results", path: "/student/results", icon: <FileText className="w-5 h-5" /> },
    { label: "Feedback", path: "/student/feedback", icon: <ClipboardCheck className="w-5 h-5" /> },
  ],
};

export function AppSidebar({ role, userName, onLogout }: SidebarProps) {
  const location = useLocation();
  const navigation = navigationConfig[role];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sidebar-foreground font-heading font-bold text-lg">ExamAI</h1>
            <p className="text-sidebar-foreground/60 text-xs">Evaluation System</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? "sidebar-active" : "sidebar"}
                className="w-full gap-3"
              >
                {item.icon}
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center">
            <span className="text-sidebar-accent-foreground font-medium text-sm">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sidebar-foreground text-sm font-medium truncate">{userName}</p>
            <p className="text-sidebar-foreground/60 text-xs capitalize">{role}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={onLogout}
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

import { StatCard, AcademicCard, AcademicCardHeader } from "@/components/ui/academic-card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  GraduationCap,
  FileText, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Settings,
  BarChart3
} from "lucide-react";
import { Link } from "react-router-dom";

// Mock data for demo
const systemStats = {
  totalFaculty: 24,
  totalStudents: 1250,
  totalEvaluations: 3420,
  pendingEvaluations: 156,
  averageScore: 74,
  completionRate: 89,
};

const recentActivity = [
  { id: 1, type: "evaluation", message: "Prof. Johnson completed 12 evaluations", time: "5 min ago" },
  { id: 2, type: "upload", message: "Dr. Smith uploaded Algorithms Final", time: "1 hour ago" },
  { id: 3, type: "review", message: "Prof. Davis reviewed 8 answer sheets", time: "2 hours ago" },
  { id: 4, type: "student", message: "15 new students registered", time: "3 hours ago" },
];

const departmentStats = [
  { name: "Computer Science", faculty: 8, students: 450, evaluations: 1200, avgScore: 76 },
  { name: "Information Technology", faculty: 6, students: 320, evaluations: 890, avgScore: 72 },
  { name: "Electronics", faculty: 5, students: 280, evaluations: 720, avgScore: 78 },
  { name: "Mechanical", faculty: 5, students: 200, evaluations: 610, avgScore: 71 },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">System overview and management controls</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/reports">
            <Button variant="outline" className="gap-2">
              <BarChart3 className="w-5 h-5" />
              Reports
            </Button>
          </Link>
          <Link to="/admin/settings">
            <Button className="gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Faculty"
          value={systemStats.totalFaculty}
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          label="Total Students"
          value={systemStats.totalStudents.toLocaleString()}
          icon={<GraduationCap className="w-6 h-6" />}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          label="Total Evaluations"
          value={systemStats.totalEvaluations.toLocaleString()}
          icon={<FileText className="w-6 h-6" />}
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          label="Pending Review"
          value={systemStats.pendingEvaluations}
          icon={<Clock className="w-6 h-6" />}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AcademicCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">System Average Score</p>
              <p className="text-4xl font-heading font-bold text-foreground mt-1">{systemStats.averageScore}%</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-score-high text-sm">
              <span>↑ 3% from last semester</span>
            </div>
          </div>
        </AcademicCard>

        <AcademicCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Completion Rate</p>
              <p className="text-4xl font-heading font-bold text-foreground mt-1">{systemStats.completionRate}%</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-score-high/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-score-high" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div 
                className="h-full bg-score-high rounded-full transition-all duration-500" 
                style={{ width: `${systemStats.completionRate}%` }}
              />
            </div>
          </div>
        </AcademicCard>

        <AcademicCard>
          <AcademicCardHeader title="Recent Activity" />
          <div className="space-y-3 -mt-2">
            {recentActivity.slice(0, 3).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="text-foreground">{activity.message}</p>
                  <p className="text-muted-foreground text-xs">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </AcademicCard>
      </div>

      {/* Department Performance */}
      <AcademicCard>
        <AcademicCardHeader 
          title="Department Performance" 
          description="Overview of all departments"
          action={
            <Link to="/admin/reports">
              <Button variant="ghost" size="sm">View Details</Button>
            </Link>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Department</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Faculty</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Students</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Evaluations</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Avg Score</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {departmentStats.map((dept, index) => (
                <tr key={index} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <td className="py-4 px-4">
                    <p className="font-medium text-foreground">{dept.name}</p>
                  </td>
                  <td className="py-4 px-4 text-center text-foreground">{dept.faculty}</td>
                  <td className="py-4 px-4 text-center text-foreground">{dept.students}</td>
                  <td className="py-4 px-4 text-center text-foreground">{dept.evaluations}</td>
                  <td className="py-4 px-4 text-center">
                    <span className={`font-medium ${dept.avgScore >= 75 ? 'text-score-high' : dept.avgScore >= 50 ? 'text-score-medium' : 'text-score-low'}`}>
                      {dept.avgScore}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Button variant="ghost" size="sm">Manage</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AcademicCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Users className="w-6 h-6" />, label: "Manage Faculty", path: "/admin/faculty" },
          { icon: <GraduationCap className="w-6 h-6" />, label: "Manage Students", path: "/admin/students" },
          { icon: <FileText className="w-6 h-6" />, label: "All Evaluations", path: "/admin/evaluations" },
          { icon: <Settings className="w-6 h-6" />, label: "System Settings", path: "/admin/settings" },
        ].map((action, index) => (
          <Link key={index} to={action.path}>
            <AcademicCard hover className="text-center py-8">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary">{action.icon}</span>
              </div>
              <p className="font-medium text-foreground">{action.label}</p>
            </AcademicCard>
          </Link>
        ))}
      </div>
    </div>
  );
}

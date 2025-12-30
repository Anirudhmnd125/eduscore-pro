import { StatCard, AcademicCard, AcademicCardHeader } from "@/components/ui/academic-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScoreCircle } from "@/components/ui/score-display";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  Users,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

// Mock data for demo
const recentEvaluations = [
  { id: 1, student: "John Smith", exam: "Data Structures Mid-Term", status: "reviewed" as const, score: 78, maxScore: 100, date: "2024-01-15" },
  { id: 2, student: "Emily Chen", exam: "Data Structures Mid-Term", status: "evaluated" as const, score: 92, maxScore: 100, date: "2024-01-15" },
  { id: 3, student: "Michael Brown", exam: "Data Structures Mid-Term", status: "pending" as const, score: 0, maxScore: 100, date: "2024-01-15" },
  { id: 4, student: "Sarah Davis", exam: "Algorithms Final", status: "reviewed" as const, score: 85, maxScore: 100, date: "2024-01-14" },
];

const pendingReviews = [
  { id: 1, exam: "Data Structures Mid-Term", count: 12, urgent: true },
  { id: 2, exam: "Algorithms Final", count: 8, urgent: false },
  { id: 3, exam: "Database Systems Quiz", count: 25, urgent: true },
];

export default function FacultyDashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Faculty Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, Prof. Johnson. Here's your evaluation overview.</p>
        </div>
        <Link to="/faculty/upload">
          <Button size="lg" className="gap-2">
            <Upload className="w-5 h-5" />
            Upload New Exam
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Evaluations"
          value="156"
          icon={<FileText className="w-6 h-6" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          label="Pending Review"
          value="45"
          icon={<Clock className="w-6 h-6" />}
        />
        <StatCard
          label="Completed Today"
          value="23"
          icon={<CheckCircle className="w-6 h-6" />}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          label="Average Score"
          value="76%"
          icon={<TrendingUp className="w-6 h-6" />}
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Evaluations */}
        <div className="lg:col-span-2">
          <AcademicCard>
            <AcademicCardHeader 
              title="Recent Evaluations" 
              description="Latest answer sheet evaluations"
              action={
                <Link to="/faculty/evaluations">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View all <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              }
            />
            
            <div className="space-y-4">
              {recentEvaluations.map((evaluation) => (
                <div 
                  key={evaluation.id} 
                  className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{evaluation.student}</p>
                    <p className="text-sm text-muted-foreground truncate">{evaluation.exam}</p>
                  </div>
                  <StatusBadge status={evaluation.status} />
                  {evaluation.status !== "pending" && (
                    <ScoreCircle score={evaluation.score} maxScore={evaluation.maxScore} size={50} />
                  )}
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </AcademicCard>
        </div>

        {/* Pending Reviews */}
        <div>
          <AcademicCard>
            <AcademicCardHeader 
              title="Pending Reviews" 
              description="Exams awaiting your review"
            />
            
            <div className="space-y-3">
              {pendingReviews.map((review) => (
                <div 
                  key={review.id}
                  className="p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-foreground text-sm">{review.exam}</p>
                    {review.urgent && (
                      <AlertCircle className="w-4 h-4 text-status-pending" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {review.count} sheets pending
                    </span>
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <Link to="/faculty/evaluations">
                <Button variant="secondary" className="w-full">
                  View All Pending
                </Button>
              </Link>
            </div>
          </AcademicCard>
        </div>
      </div>

      {/* Quick Actions */}
      <AcademicCard>
        <AcademicCardHeader title="Quick Actions" description="Common tasks at your fingertips" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Upload className="w-6 h-6" />, label: "Upload Answer Sheets", path: "/faculty/upload" },
            { icon: <FileText className="w-6 h-6" />, label: "View All Sheets", path: "/faculty/sheets" },
            { icon: <CheckCircle className="w-6 h-6" />, label: "Review Evaluations", path: "/faculty/evaluations" },
            { icon: <TrendingUp className="w-6 h-6" />, label: "View Reports", path: "/faculty/reports" },
          ].map((action, index) => (
            <Link key={index} to={action.path}>
              <div className="p-6 rounded-xl border border-border hover:border-primary/30 hover:bg-secondary/30 transition-all text-center group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                  <span className="text-primary">{action.icon}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{action.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </AcademicCard>
    </div>
  );
}

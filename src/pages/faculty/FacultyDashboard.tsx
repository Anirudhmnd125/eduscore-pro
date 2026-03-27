import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface EvaluationRow {
  id: string;
  student_name: string | null;
  student_roll_number: string | null;
  status: string;
  total_marks_obtained: number | null;
  max_marks: number | null;
  percentage: number | null;
  grade: string | null;
  created_at: string;
  exams: { title: string; subject: string } | null;
}

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<EvaluationRow[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      setLoading(true);

      // Fetch recent evaluations with exam info
      const { data, error } = await supabase
        .from("evaluations")
        .select("id, student_name, student_roll_number, status, total_marks_obtained, max_marks, percentage, grade, created_at, exams(title, subject)")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        const rows = (data as any[]).map((d) => ({
          ...d,
          exams: Array.isArray(d.exams) ? d.exams[0] : d.exams,
        })) as EvaluationRow[];
        setEvaluations(rows);

        const total = rows.length;
        const pending = rows.filter((e) => e.status === "pending" || e.status === "processing").length;
        const completed = rows.filter((e) => e.status === "completed" || e.status === "approved").length;
        const scored = rows.filter((e) => e.percentage != null);
        const avgScore = scored.length > 0
          ? Math.round(scored.reduce((s, e) => s + (e.percentage ?? 0), 0) / scored.length)
          : 0;

        setStats({ total, pending, completed, avgScore });
      }
      setLoading(false);
    }

    fetchData();
  }, [user]);

  const statusMap = (s: string): "pending" | "evaluated" | "reviewed" => {
    if (s === "approved") return "reviewed";
    if (s === "completed") return "evaluated";
    return "pending";
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Faculty Dashboard</h1>
          <p className="text-muted-foreground mt-1">Here's your evaluation overview.</p>
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
        <StatCard label="Total Evaluations" value={String(stats.total)} icon={<FileText className="w-6 h-6" />} />
        <StatCard label="Pending Review" value={String(stats.pending)} icon={<Clock className="w-6 h-6" />} />
        <StatCard label="Completed" value={String(stats.completed)} icon={<CheckCircle className="w-6 h-6" />} />
        <StatCard label="Average Score" value={`${stats.avgScore}%`} icon={<TrendingUp className="w-6 h-6" />} />
      </div>

      {/* Recent Evaluations */}
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
          {loading && <p className="text-muted-foreground text-sm">Loading...</p>}
          {!loading && evaluations.length === 0 && (
            <p className="text-muted-foreground text-sm">No evaluations yet. Upload an exam to get started.</p>
          )}
          {evaluations.map((evaluation) => (
            <div 
              key={evaluation.id} 
              className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {evaluation.student_name || evaluation.student_roll_number || "Unknown Student"}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {evaluation.exams?.title || "Untitled Exam"} · {evaluation.exams?.subject || ""}
                </p>
              </div>
              <StatusBadge status={statusMap(evaluation.status)} />
              {evaluation.total_marks_obtained != null && evaluation.max_marks != null && (
                <ScoreCircle score={evaluation.total_marks_obtained} maxScore={evaluation.max_marks} size={50} />
              )}
              <Link to={`/faculty/evaluations/${evaluation.id}`}>
                <Button variant="ghost" size="sm">View</Button>
              </Link>
            </div>
          ))}
        </div>
      </AcademicCard>

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

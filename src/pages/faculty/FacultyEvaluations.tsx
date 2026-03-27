import { useState, useEffect } from "react";
import { AcademicCard, AcademicCardHeader } from "@/components/ui/academic-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScoreCircle } from "@/components/ui/score-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter,
  ArrowUpDown,
  Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type EvaluationStatus = "pending" | "evaluated" | "reviewed";

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

export default function FacultyEvaluations() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EvaluationStatus | "all">("all");
  const [evaluations, setEvaluations] = useState<EvaluationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchEvaluations() {
      setLoading(true);
      const { data, error } = await supabase
        .from("evaluations")
        .select("id, student_name, student_roll_number, status, total_marks_obtained, max_marks, percentage, grade, created_at, exams(title, subject)")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const rows = (data as any[]).map((d) => ({
          ...d,
          exams: Array.isArray(d.exams) ? d.exams[0] : d.exams,
        })) as EvaluationRow[];
        setEvaluations(rows);
      }
      setLoading(false);
    }
    fetchEvaluations();
  }, [user]);

  const statusMap = (s: string): EvaluationStatus => {
    if (s === "approved") return "reviewed";
    if (s === "completed") return "evaluated";
    return "pending";
  };

  const filteredEvaluations = evaluations.filter((e) => {
    const name = e.student_name || "";
    const roll = e.student_roll_number || "";
    const exam = e.exams?.title || "";
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roll.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.toLowerCase().includes(searchQuery.toLowerCase());
    const mappedStatus = statusMap(e.status);
    const matchesStatus = statusFilter === "all" || mappedStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: evaluations.length,
    pending: evaluations.filter((e) => statusMap(e.status) === "pending").length,
    evaluated: evaluations.filter((e) => statusMap(e.status) === "evaluated").length,
    reviewed: evaluations.filter((e) => statusMap(e.status) === "reviewed").length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Evaluations</h1>
        <p className="text-muted-foreground mt-1">Review and manage AI-evaluated answer sheets</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by student name, roll number, or exam..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "pending", "evaluated", "reviewed"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="capitalize"
            >
              {status} ({statusCounts[status]})
            </Button>
          ))}
        </div>
      </div>

      {/* Evaluations Table */}
      <AcademicCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2 cursor-pointer hover:text-foreground">
                    Student <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Exam</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-muted-foreground">Score</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-muted-foreground">Grade</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              )}
              {!loading && filteredEvaluations.map((evaluation) => (
                <tr 
                  key={evaluation.id} 
                  className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-foreground">{evaluation.student_name || "Unknown Student"}</p>
                      <p className="text-sm text-muted-foreground">{evaluation.student_roll_number || "—"}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-foreground">{evaluation.exams?.title || "Untitled Exam"}</p>
                      <p className="text-sm text-muted-foreground">{evaluation.exams?.subject || ""}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <StatusBadge status={statusMap(evaluation.status)} />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      {evaluation.total_marks_obtained != null && evaluation.max_marks != null ? (
                        <ScoreCircle score={evaluation.total_marks_obtained} maxScore={evaluation.max_marks} size={45} />
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-medium text-foreground">{evaluation.grade || "—"}</span>
                  </td>
                  <td className="py-4 px-4 text-foreground">
                    {new Date(evaluation.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Link to={`/faculty/evaluations/${evaluation.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Eye className="w-4 h-4" />
                        {statusMap(evaluation.status) === "evaluated" ? "Review" : "View"}
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredEvaluations.length === 0 && (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-1">No evaluations found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </AcademicCard>
    </div>
  );
}

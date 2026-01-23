import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AcademicCard } from "@/components/ui/academic-card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Download, Eye, FileText, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EvaluationRecord {
  id: string;
  student_name: string | null;
  student_roll_number: string | null;
  total_marks_obtained: number | null;
  max_marks: number | null;
  grade: string | null;
  percentage: number | null;
  status: string;
  evaluated_at: string | null;
  created_at: string;
  exam: {
    id: string;
    title: string;
    subject: string;
  } | null;
  faculty: {
    full_name: string;
  } | null;
}

export default function EvaluationHistory() {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchEvaluations();
  }, []);

  async function fetchEvaluations() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("evaluations")
        .select(`
          *,
          exam:exams(id, title, subject, faculty_id)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching evaluations:", error);
        toast.error("Failed to fetch evaluation history");
        return;
      }

      // Fetch faculty names for each exam
      const evaluationsWithFaculty = await Promise.all(
        (data || []).map(async (evaluation) => {
          if (evaluation.exam?.faculty_id) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", evaluation.exam.faculty_id)
              .single();

            return {
              ...evaluation,
              faculty: profileData,
            };
          }
          return { ...evaluation, faculty: null };
        })
      );

      setEvaluations(evaluationsWithFaculty as EvaluationRecord[]);
    } catch (error) {
      console.error("Error in fetchEvaluations:", error);
      toast.error("Failed to fetch evaluation history");
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="status-pending">Pending</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Processing</Badge>;
      case "completed":
        return <Badge variant="outline" className="status-evaluated">Completed</Badge>;
      case "approved":
        return <Badge variant="outline" className="status-reviewed">Approved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getGradeColor = (grade: string | null) => {
    if (!grade) return "text-muted-foreground";
    if (grade === "A+" || grade === "A") return "text-green-600";
    if (grade === "B+" || grade === "B") return "text-blue-600";
    if (grade === "C+" || grade === "C") return "text-amber-600";
    return "text-red-600";
  };

  const filteredEvaluations = evaluations.filter((evaluation) => {
    const matchesSearch =
      (evaluation.student_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (evaluation.student_roll_number?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (evaluation.exam?.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (evaluation.exam?.subject?.toLowerCase() || "").includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || evaluation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDownloadReport = (evaluation: EvaluationRecord) => {
    const report = `
EVALUATION REPORT
=================

Exam: ${evaluation.exam?.title || "N/A"}
Subject: ${evaluation.exam?.subject || "N/A"}
Student: ${evaluation.student_name || "N/A"}
Roll Number: ${evaluation.student_roll_number || "N/A"}

Score: ${evaluation.total_marks_obtained || 0}/${evaluation.max_marks || 0}
Percentage: ${evaluation.percentage?.toFixed(1) || 0}%
Grade: ${evaluation.grade || "N/A"}

Status: ${evaluation.status}
Evaluated: ${evaluation.evaluated_at ? new Date(evaluation.evaluated_at).toLocaleString() : "N/A"}
    `.trim();

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evaluation-${evaluation.student_roll_number || evaluation.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Evaluation History</h1>
        <p className="text-muted-foreground mt-1">
          View and track all evaluation records
        </p>
      </div>

      <AcademicCard>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by student, exam, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredEvaluations.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "No evaluations found matching your criteria"
                : "No evaluations recorded yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{evaluation.exam?.title || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">{evaluation.exam?.subject}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{evaluation.student_name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{evaluation.student_roll_number}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {evaluation.total_marks_obtained ?? "-"}/{evaluation.max_marks ?? "-"}
                      </span>
                      {evaluation.percentage !== null && (
                        <span className="text-sm text-muted-foreground ml-1">
                          ({evaluation.percentage.toFixed(1)}%)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold text-lg ${getGradeColor(evaluation.grade)}`}>
                        {evaluation.grade || "-"}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(evaluation.status)}</TableCell>
                    <TableCell>{evaluation.faculty?.full_name || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span className="text-sm">
                          {new Date(evaluation.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadReport(evaluation)}
                          title="Download Report"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AcademicCard>
    </div>
  );
}

import { useState } from "react";
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

type EvaluationStatus = "pending" | "evaluated" | "reviewed";

interface Evaluation {
  id: number;
  student: string;
  rollNo: string;
  exam: string;
  subject: string;
  status: EvaluationStatus;
  aiScore: number;
  finalScore: number;
  maxScore: number;
  date: string;
}

// Mock data
const evaluations: Evaluation[] = [
  { id: 1, student: "John Smith", rollNo: "CS2021045", exam: "Data Structures Mid-Term", subject: "Computer Science", status: "reviewed", aiScore: 78, finalScore: 80, maxScore: 100, date: "2024-01-15" },
  { id: 2, student: "Emily Chen", rollNo: "CS2021032", exam: "Data Structures Mid-Term", subject: "Computer Science", status: "evaluated", aiScore: 92, finalScore: 92, maxScore: 100, date: "2024-01-15" },
  { id: 3, student: "Michael Brown", rollNo: "CS2021018", exam: "Data Structures Mid-Term", subject: "Computer Science", status: "pending", aiScore: 0, finalScore: 0, maxScore: 100, date: "2024-01-15" },
  { id: 4, student: "Sarah Davis", rollNo: "CS2021056", exam: "Data Structures Mid-Term", subject: "Computer Science", status: "reviewed", aiScore: 85, finalScore: 85, maxScore: 100, date: "2024-01-14" },
  { id: 5, student: "James Wilson", rollNo: "CS2021023", exam: "Algorithms Final", subject: "Computer Science", status: "evaluated", aiScore: 72, finalScore: 72, maxScore: 100, date: "2024-01-14" },
  { id: 6, student: "Amanda Taylor", rollNo: "CS2021041", exam: "Algorithms Final", subject: "Computer Science", status: "pending", aiScore: 0, finalScore: 0, maxScore: 100, date: "2024-01-14" },
  { id: 7, student: "Robert Martinez", rollNo: "IT2021015", exam: "Database Systems Quiz", subject: "Information Technology", status: "reviewed", aiScore: 45, finalScore: 47, maxScore: 50, date: "2024-01-13" },
  { id: 8, student: "Lisa Anderson", rollNo: "IT2021028", exam: "Database Systems Quiz", subject: "Information Technology", status: "evaluated", aiScore: 42, finalScore: 42, maxScore: 50, date: "2024-01-13" },
];

export default function FacultyEvaluations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<EvaluationStatus | "all">("all");

  const filteredEvaluations = evaluations.filter((e) => {
    const matchesSearch = 
      e.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.exam.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: evaluations.length,
    pending: evaluations.filter((e) => e.status === "pending").length,
    evaluated: evaluations.filter((e) => e.status === "evaluated").length,
    reviewed: evaluations.filter((e) => e.status === "reviewed").length,
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
                <th className="text-center py-4 px-4 text-sm font-medium text-muted-foreground">AI Score</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-muted-foreground">Final Score</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvaluations.map((evaluation) => (
                <tr 
                  key={evaluation.id} 
                  className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-foreground">{evaluation.student}</p>
                      <p className="text-sm text-muted-foreground">{evaluation.rollNo}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-foreground">{evaluation.exam}</p>
                      <p className="text-sm text-muted-foreground">{evaluation.subject}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <StatusBadge status={evaluation.status} />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      {evaluation.status !== "pending" ? (
                        <ScoreCircle score={evaluation.aiScore} maxScore={evaluation.maxScore} size={45} />
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center">
                      {evaluation.status === "reviewed" ? (
                        <ScoreCircle score={evaluation.finalScore} maxScore={evaluation.maxScore} size={45} />
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-foreground">{evaluation.date}</td>
                  <td className="py-4 px-4 text-right">
                    <Link to={`/faculty/evaluations/${evaluation.id}`}>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Eye className="w-4 h-4" />
                        {evaluation.status === "evaluated" ? "Review" : "View"}
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEvaluations.length === 0 && (
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

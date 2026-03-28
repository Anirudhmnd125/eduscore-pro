import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AcademicCard, AcademicCardHeader } from "@/components/ui/academic-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScoreDisplay, ScoreCircle } from "@/components/ui/score-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Download,
  Edit3,
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface QuestionEval {
  id: string;
  question_id: string;
  marks_obtained: number;
  max_marks: number;
  criteria_breakdown: any;
  strengths: string[] | null;
  weaknesses: string[] | null;
  feedback: string | null;
}

interface EvalData {
  id: string;
  student_name: string | null;
  student_roll_number: string | null;
  status: string;
  total_marks_obtained: number | null;
  max_marks: number | null;
  percentage: number | null;
  grade: string | null;
  ai_evaluation: any;
  faculty_override: any;
  created_at: string;
  evaluated_at: string | null;
  approved_at: string | null;
  exams: { title: string; subject: string; total_marks: number } | null;
}

type UIStatus = "pending" | "evaluated" | "reviewed";

const statusMap = (s: string): UIStatus => {
  if (s === "approved") return "reviewed";
  if (s === "completed") return "evaluated";
  return "pending";
};

export default function EvaluationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [evalData, setEvalData] = useState<EvalData | null>(null);
  const [questions, setQuestions] = useState<QuestionEval[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedScores, setEditedScores] = useState<Record<string, number>>({});
  const [editedFeedback, setEditedFeedback] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      const [evalRes, qRes] = await Promise.all([
        supabase
          .from("evaluations")
          .select("*, exams(title, subject, total_marks)")
          .eq("id", id)
          .single(),
        supabase
          .from("question_evaluations")
          .select("*")
          .eq("evaluation_id", id)
          .order("question_id"),
      ]);

      if (evalRes.error || !evalRes.data) {
        toast.error("Evaluation not found");
        navigate("/faculty/evaluations");
        return;
      }

      const d = evalRes.data as any;
      setEvalData({
        ...d,
        exams: Array.isArray(d.exams) ? d.exams[0] : d.exams,
      });
      setQuestions((qRes.data as QuestionEval[]) || []);
      setLoading(false);
    }
    load();
  }, [id, navigate]);

  if (loading || !evalData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const aiEval = evalData.ai_evaluation as any;
  const overallStrengths: string[] = aiEval?.overall_strengths || [];
  const overallWeaknesses: string[] = aiEval?.overall_weaknesses || [];
  const studyRecs: string[] = aiEval?.study_recommendations || [];
  const summary: string = aiEval?.summary || "";

  const getTotalScore = () => {
    if (questions.length > 0) {
      return questions.reduce((sum, q) => sum + (editedScores[q.question_id] ?? q.marks_obtained), 0);
    }
    return evalData.total_marks_obtained ?? 0;
  };

  const totalMax = evalData.max_marks ?? evalData.exams?.total_marks ?? 100;

  const handleSaveChanges = async () => {
    try {
      const newTotal = getTotalScore();
      const newPercentage = Math.round((newTotal / totalMax) * 100);

      const { error } = await supabase
        .from("evaluations")
        .update({
          faculty_override: { editedScores, editedFeedback } as any,
          total_marks_obtained: newTotal,
          percentage: newPercentage,
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", evalData.id);

      if (error) {
        toast.error("Failed to save changes");
        return;
      }

      for (const [questionId, marks] of Object.entries(editedScores)) {
        await supabase
          .from("question_evaluations")
          .update({ marks_obtained: marks })
          .eq("evaluation_id", evalData.id)
          .eq("question_id", questionId);
      }
      for (const [questionId, feedback] of Object.entries(editedFeedback)) {
        await supabase
          .from("question_evaluations")
          .update({ feedback })
          .eq("evaluation_id", evalData.id)
          .eq("question_id", questionId);
      }

      setIsEditing(false);
      setEvalData((prev) => prev ? { ...prev, status: "approved", total_marks_obtained: newTotal, percentage: newPercentage } : prev);
      toast.success("Evaluation updated and approved!");
    } catch {
      toast.error("Failed to save changes");
    }
  };

  const handleDownloadReport = () => {
    let report = `EVALUATION REPORT\n${"=".repeat(60)}\n`;
    report += `Student: ${evalData.student_name || "Unknown"}\n`;
    report += `Roll No: ${evalData.student_roll_number || "—"}\n`;
    report += `Exam: ${evalData.exams?.title || "—"}\n`;
    report += `Subject: ${evalData.exams?.subject || "—"}\n`;
    report += `Score: ${getTotalScore()} / ${totalMax}\n`;
    report += `Grade: ${evalData.grade || "—"}\n\n`;

    if (questions.length > 0) {
      report += `QUESTION-WISE BREAKDOWN\n${"-".repeat(40)}\n`;
      questions.forEach((q) => {
        const score = editedScores[q.question_id] ?? q.marks_obtained;
        report += `\n${q.question_id}: ${score}/${q.max_marks}\n`;
        if (q.strengths?.length) report += `  Strengths: ${q.strengths.join(", ")}\n`;
        if (q.weaknesses?.length) report += `  Weaknesses: ${q.weaknesses.join(", ")}\n`;
        if (q.feedback) report += `  Feedback: ${editedFeedback[q.question_id] ?? q.feedback}\n`;
      });
    }

    if (summary) report += `\nSummary: ${summary}\n`;

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evaluation_${evalData.student_name || evalData.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link to="/faculty/evaluations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              {evalData.student_name || "Unknown Student"}
            </h1>
            <p className="text-muted-foreground">
              {evalData.student_roll_number || "—"} • {evalData.exams?.title || "Exam"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={statusMap(evalData.status)} />
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={handleDownloadReport} className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button onClick={() => setIsEditing(true)} className="gap-2">
                <Edit3 className="w-4 h-4" />
                Edit & Approve
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2">
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button onClick={handleSaveChanges} className="gap-2">
                <Save className="w-4 h-4" />
                Save & Approve
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Summary */}
        <div className="lg:col-span-1 space-y-6">
          <AcademicCard>
            <AcademicCardHeader title="Score Summary" />
            <div className="flex flex-col items-center py-4">
              <ScoreCircle score={getTotalScore()} maxScore={totalMax} size={140} />
              <div className="mt-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {getTotalScore()} / {totalMax}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Total Score</p>
                {evalData.grade && (
                  <p className="mt-2 text-lg font-bold text-primary">Grade: {evalData.grade}</p>
                )}
              </div>
            </div>
          </AcademicCard>

          <AcademicCard>
            <AcademicCardHeader title="Exam Details" />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exam</span>
                <span className="font-medium text-foreground">{evalData.exams?.title || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subject</span>
                <span className="font-medium text-foreground">{evalData.exams?.subject || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Evaluated</span>
                <span className="font-medium text-foreground">
                  {evalData.evaluated_at ? new Date(evalData.evaluated_at).toLocaleString() : new Date(evalData.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </AcademicCard>

          {(overallStrengths.length > 0 || overallWeaknesses.length > 0 || studyRecs.length > 0) && (
            <AcademicCard>
              <AcademicCardHeader title="Overall Feedback" />
              <div className="space-y-4">
                {overallStrengths.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-score-high" />
                      <span className="text-sm font-medium text-foreground">Strengths</span>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {overallStrengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-score-high mt-1">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {overallWeaknesses.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-score-medium" />
                      <span className="text-sm font-medium text-foreground">Areas for Improvement</span>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {overallWeaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-score-medium mt-1">•</span>{w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {studyRecs.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Study Recommendations</span>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {studyRecs.map((r, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AcademicCard>
          )}

          {summary && (
            <AcademicCard>
              <AcademicCardHeader title="Summary" />
              <p className="text-sm text-muted-foreground">{summary}</p>
            </AcademicCard>
          )}
        </div>

        {/* Question-wise Evaluation */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-heading text-xl font-semibold text-foreground">Question-wise Evaluation</h2>

          {questions.length === 0 && (
            <AcademicCard>
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No question-level data available</p>
              </div>
            </AcademicCard>
          )}

          {questions.map((q) => {
            const criteria = Array.isArray(q.criteria_breakdown) ? q.criteria_breakdown : [];
            return (
              <AcademicCard key={q.id}>
                <div className="flex items-start justify-between mb-4">
                  <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                    {q.question_id}
                  </span>
                  <div className="text-right">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="w-20 text-center"
                          value={editedScores[q.question_id] ?? q.marks_obtained}
                          onChange={(e) =>
                            setEditedScores({
                              ...editedScores,
                              [q.question_id]: Math.min(parseInt(e.target.value) || 0, q.max_marks),
                            })
                          }
                          max={q.max_marks}
                          min={0}
                        />
                        <span className="text-muted-foreground">/ {q.max_marks}</span>
                      </div>
                    ) : (
                      <ScoreDisplay
                        score={editedScores[q.question_id] ?? q.marks_obtained}
                        maxScore={q.max_marks}
                        size="sm"
                      />
                    )}
                  </div>
                </div>

                {/* Criteria */}
                {criteria.length > 0 && (
                  <div className="mb-4 p-4 rounded-lg bg-secondary/30 border border-border">
                    <span className="text-sm font-medium text-foreground mb-2 block">Marking Criteria</span>
                    <div className="space-y-2">
                      {criteria.map((c: any, idx: number) => (
                        <div key={idx} className="flex items-start justify-between text-sm">
                          <div className="flex-1">
                            <span className="text-foreground">{c.criterion}</span>
                            {c.comment && <p className="text-xs text-muted-foreground mt-0.5">{c.comment}</p>}
                          </div>
                          <span className="font-medium ml-4">
                            {c.marks_awarded}/{c.max_marks}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths & Weaknesses */}
                <div className="space-y-3">
                  {q.strengths && q.strengths.length > 0 && (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-4 h-4 text-score-high mt-1 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-foreground">Strengths:</span>
                        <ul className="text-sm text-muted-foreground mt-1">
                          {q.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}
                  {q.weaknesses && q.weaknesses.length > 0 && (
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-score-low mt-1 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-foreground">Weaknesses:</span>
                        <ul className="text-sm text-muted-foreground mt-1">
                          {q.weaknesses.map((w, i) => <li key={i}>• {w}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}
                  {(q.feedback || isEditing) && (
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-foreground">Feedback:</span>
                        {isEditing ? (
                          <Textarea
                            className="mt-2 text-sm"
                            value={editedFeedback[q.question_id] ?? q.feedback ?? ""}
                            onChange={(e) =>
                              setEditedFeedback({ ...editedFeedback, [q.question_id]: e.target.value })
                            }
                            rows={2}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">
                            {editedFeedback[q.question_id] ?? q.feedback}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </AcademicCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}

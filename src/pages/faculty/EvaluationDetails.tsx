import { useState } from "react";
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
  MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

// Mock evaluation data
const evaluationData = {
  id: 1,
  student: {
    name: "John Smith",
    rollNo: "CS2021045",
    department: "Computer Science",
  },
  exam: {
    name: "Data Structures Mid-Term",
    subject: "Computer Science",
    date: "2024-01-15",
    totalMarks: 100,
  },
  status: "evaluated" as const,
  aiScore: 78,
  finalScore: 78,
  evaluatedAt: "2024-01-16 14:30",
  questions: [
    {
      number: 1,
      title: "Explain the concept of linked lists and their types",
      maxMarks: 10,
      aiScore: 8,
      finalScore: 8,
      feedback: {
        strengths: ["Good explanation of singly linked list", "Correct diagram provided"],
        weaknesses: ["Circular linked list explanation incomplete", "Missing time complexity analysis"],
        suggestions: "Review circular and doubly linked list concepts. Focus on understanding the trade-offs between different types.",
      },
      studentAnswer: "A linked list is a linear data structure where elements are stored in nodes. Each node contains data and a pointer to the next node...",
    },
    {
      number: 2,
      title: "Write a function to reverse a linked list",
      maxMarks: 15,
      aiScore: 12,
      finalScore: 12,
      feedback: {
        strengths: ["Correct iterative approach", "Proper pointer manipulation", "Clean code structure"],
        weaknesses: ["Missing edge case for empty list", "No comments explaining the logic"],
        suggestions: "Always handle edge cases like empty list or single node. Adding comments improves code readability.",
      },
      studentAnswer: "void reverseList(Node* head) { Node* prev = NULL; Node* current = head; ...",
    },
    {
      number: 3,
      title: "Compare and contrast stacks and queues",
      maxMarks: 10,
      aiScore: 6,
      finalScore: 6,
      feedback: {
        strengths: ["Basic definitions are correct"],
        weaknesses: ["Comparison is superficial", "Missing real-world applications", "No diagrams provided"],
        suggestions: "Provide detailed comparisons with specific use cases. Use tables for clear comparison and include diagrams.",
      },
      studentAnswer: "Stack follows LIFO while Queue follows FIFO...",
    },
  ],
  overallFeedback: {
    strengths: ["Strong understanding of basic data structures", "Good code writing skills", "Clear handwriting and presentation"],
    areasForImprovement: ["Time complexity analysis needs work", "Cover edge cases in programming questions", "Include more diagrams for conceptual questions"],
    studyRecommendations: ["Practice more problems on GeeksforGeeks", "Review MIT OCW lectures on Data Structures", "Focus on Chapter 5-7 of CLRS book"],
  },
};

export default function EvaluationDetails() {
  const [isEditing, setIsEditing] = useState(false);
  const [editedScores, setEditedScores] = useState<Record<number, number>>({});
  const [editedFeedback, setEditedFeedback] = useState<Record<number, string>>({});

  const handleSaveChanges = () => {
    setIsEditing(false);
    toast.success("Evaluation updated and approved!");
  };

  const handleDownloadReport = () => {
    toast.success("Report downloaded successfully!");
  };

  const getTotalScore = () => {
    return evaluationData.questions.reduce((sum, q) => {
      return sum + (editedScores[q.number] ?? q.finalScore);
    }, 0);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link to="/faculty/evaluations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">{evaluationData.student.name}</h1>
            <p className="text-muted-foreground">
              {evaluationData.student.rollNo} • {evaluationData.exam.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={evaluationData.status} />
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={handleDownloadReport} className="gap-2">
                <Download className="w-4 h-4" />
                Download Report
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
              <ScoreCircle 
                score={getTotalScore()} 
                maxScore={evaluationData.exam.totalMarks} 
                size={140} 
              />
              <div className="mt-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {getTotalScore()} / {evaluationData.exam.totalMarks}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Total Score</p>
              </div>
              {evaluationData.aiScore !== getTotalScore() && (
                <div className="mt-4 p-3 rounded-lg bg-secondary/50 text-sm">
                  <p className="text-muted-foreground">
                    AI Score: <span className="font-medium text-foreground">{evaluationData.aiScore}</span>
                  </p>
                </div>
              )}
            </div>
          </AcademicCard>

          <AcademicCard>
            <AcademicCardHeader title="Exam Details" />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exam</span>
                <span className="font-medium text-foreground">{evaluationData.exam.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subject</span>
                <span className="font-medium text-foreground">{evaluationData.exam.subject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-foreground">{evaluationData.exam.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Evaluated At</span>
                <span className="font-medium text-foreground">{evaluationData.evaluatedAt}</span>
              </div>
            </div>
          </AcademicCard>

          <AcademicCard>
            <AcademicCardHeader title="Overall Feedback" />
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-score-high" />
                  <span className="text-sm font-medium text-foreground">Strengths</span>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {evaluationData.overallFeedback.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-score-high mt-1">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-score-medium" />
                  <span className="text-sm font-medium text-foreground">Areas for Improvement</span>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {evaluationData.overallFeedback.areasForImprovement.map((a, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-score-medium mt-1">•</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Study Recommendations</span>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {evaluationData.overallFeedback.studyRecommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </AcademicCard>
        </div>

        {/* Question-wise Evaluation */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-heading text-xl font-semibold text-foreground">Question-wise Evaluation</h2>
          
          {evaluationData.questions.map((question) => (
            <AcademicCard key={question.number}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                      Q{question.number}
                    </span>
                    <h3 className="font-medium text-foreground">{question.title}</h3>
                  </div>
                </div>
                <div className="text-right">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-20 text-center"
                        value={editedScores[question.number] ?? question.finalScore}
                        onChange={(e) => setEditedScores({
                          ...editedScores,
                          [question.number]: Math.min(parseInt(e.target.value) || 0, question.maxMarks)
                        })}
                        max={question.maxMarks}
                        min={0}
                      />
                      <span className="text-muted-foreground">/ {question.maxMarks}</span>
                    </div>
                  ) : (
                    <ScoreDisplay 
                      score={editedScores[question.number] ?? question.finalScore} 
                      maxScore={question.maxMarks} 
                      size="sm"
                    />
                  )}
                </div>
              </div>

              {/* Student Answer Preview */}
              <div className="mb-4 p-4 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Student Answer (Excerpt)</span>
                </div>
                <p className="text-sm text-foreground italic">"{question.studentAnswer}"</p>
              </div>

              {/* Feedback */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-score-high mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-foreground">Strengths:</span>
                    <ul className="text-sm text-muted-foreground mt-1">
                      {question.feedback.strengths.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-score-low mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-foreground">Weaknesses:</span>
                    <ul className="text-sm text-muted-foreground mt-1">
                      {question.feedback.weaknesses.map((w, i) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-foreground">Suggestions:</span>
                    {isEditing ? (
                      <Textarea
                        className="mt-2 text-sm"
                        value={editedFeedback[question.number] ?? question.feedback.suggestions}
                        onChange={(e) => setEditedFeedback({
                          ...editedFeedback,
                          [question.number]: e.target.value
                        })}
                        rows={2}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">
                        {editedFeedback[question.number] ?? question.feedback.suggestions}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </AcademicCard>
          ))}
        </div>
      </div>
    </div>
  );
}

import { StatCard, AcademicCard, AcademicCardHeader } from "@/components/ui/academic-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScoreDisplay, ScoreCircle } from "@/components/ui/score-display";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Download,
  BookOpen,
  TrendingUp,
  Calendar,
  MessageSquare
} from "lucide-react";

// Mock data for demo
const recentResults = [
  { 
    id: 1, 
    exam: "Data Structures Mid-Term", 
    subject: "Computer Science", 
    status: "reviewed" as const, 
    score: 78, 
    maxScore: 100, 
    date: "2024-01-15",
    feedback: "Good understanding of linked lists. Needs improvement in tree traversal algorithms."
  },
  { 
    id: 2, 
    exam: "Database Systems Quiz", 
    subject: "Information Technology", 
    status: "evaluated" as const, 
    score: 45, 
    maxScore: 50, 
    date: "2024-01-12",
    feedback: "Excellent performance! Strong grasp of normalization concepts."
  },
  { 
    id: 3, 
    exam: "Algorithms Final", 
    subject: "Computer Science", 
    status: "pending" as const, 
    score: 0, 
    maxScore: 100, 
    date: "2024-01-18",
    feedback: null
  },
];

const performanceData = {
  totalExams: 8,
  averageScore: 82,
  highestScore: 95,
  improvement: 7,
};

export default function StudentDashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">My Results</h1>
        <p className="text-muted-foreground mt-1">View your exam results and detailed feedback</p>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Exams Taken"
          value={performanceData.totalExams}
          icon={<FileText className="w-6 h-6" />}
        />
        <StatCard
          label="Average Score"
          value={`${performanceData.averageScore}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          trend={{ value: performanceData.improvement, isPositive: true }}
        />
        <StatCard
          label="Highest Score"
          value={`${performanceData.highestScore}%`}
          icon={<BookOpen className="w-6 h-6" />}
        />
        <StatCard
          label="Next Exam"
          value="Jan 25"
          icon={<Calendar className="w-6 h-6" />}
        />
      </div>

      {/* Overall Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AcademicCard className="lg:col-span-1">
          <AcademicCardHeader title="Overall Performance" />
          <div className="flex flex-col items-center py-4">
            <ScoreCircle score={performanceData.averageScore} maxScore={100} size={140} />
            <p className="mt-4 text-muted-foreground text-sm">Average across all exams</p>
            <div className="mt-4 flex items-center gap-2 text-score-high">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+{performanceData.improvement}% improvement</span>
            </div>
          </div>
        </AcademicCard>

        <AcademicCard className="lg:col-span-2">
          <AcademicCardHeader 
            title="Recent Results"
            description="Your latest exam evaluations"
          />
          <div className="space-y-4">
            {recentResults.map((result) => (
              <div 
                key={result.id}
                className="p-4 rounded-xl border border-border hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-foreground">{result.exam}</h4>
                    <p className="text-sm text-muted-foreground">{result.subject} • {result.date}</p>
                  </div>
                  <StatusBadge status={result.status} />
                </div>
                
                {result.status !== "pending" ? (
                  <>
                    <div className="flex items-center gap-6 mb-3">
                      <ScoreDisplay score={result.score} maxScore={result.maxScore} showPercentage />
                    </div>
                    {result.feedback && (
                      <div className="p-3 rounded-lg bg-secondary/50 text-sm text-muted-foreground">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 mt-0.5 text-primary" />
                          <p>{result.feedback}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="gap-1">
                        <FileText className="w-4 h-4" />
                        View Details
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Download className="w-4 h-4" />
                        Download Report
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Evaluation in progress. Results will be available soon.
                  </p>
                )}
              </div>
            ))}
          </div>
        </AcademicCard>
      </div>

      {/* Subject-wise Performance */}
      <AcademicCard>
        <AcademicCardHeader 
          title="Subject-wise Performance" 
          description="Your performance breakdown by subject"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { subject: "Computer Science", score: 85, exams: 4, trend: 5 },
            { subject: "Information Technology", score: 78, exams: 2, trend: -2 },
            { subject: "Mathematics", score: 82, exams: 2, trend: 8 },
          ].map((subject, index) => (
            <div key={index} className="p-6 rounded-xl border border-border">
              <h4 className="font-medium text-foreground mb-1">{subject.subject}</h4>
              <p className="text-xs text-muted-foreground mb-4">{subject.exams} exams taken</p>
              <div className="flex items-center justify-between">
                <ScoreCircle score={subject.score} maxScore={100} size={60} />
                <div className={`flex items-center gap-1 text-sm font-medium ${subject.trend >= 0 ? 'text-score-high' : 'text-score-low'}`}>
                  {subject.trend >= 0 ? '↑' : '↓'} {Math.abs(subject.trend)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </AcademicCard>
    </div>
  );
}

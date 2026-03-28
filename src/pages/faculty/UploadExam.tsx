import { useState } from "react";
import { AcademicCard, AcademicCardHeader } from "@/components/ui/academic-card";
import { FileUploadZone } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  ArrowRight, 
  FileText, 
  BookOpen, 
  ClipboardList,
  Upload,
  CheckCircle,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { processAndEvaluateExam, FullEvaluationResult } from "@/lib/api/evaluation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type UploadStep = 1 | 2 | 3 | 4;

interface ExamData {
  examName: string;
  subject: string;
  totalMarks: number;
  studentName: string;
  studentRollNumber: string;
  questionPaper: File[];
  modelAnswers: File[];
  modelAnswersText: string;
  rubric: string;
  answerSheets: File[];
}

export default function UploadExam() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<UploadStep>(1);
  const [examData, setExamData] = useState<ExamData>({
    examName: "",
    subject: "",
    totalMarks: 100,
    studentName: "",
    studentRollNumber: "",
    questionPaper: [],
    modelAnswers: [],
    modelAnswersText: "",
    rubric: "",
    answerSheets: [],
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [evaluationResult, setEvaluationResult] = useState<FullEvaluationResult | null>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  const steps = [
    { number: 1, title: "Exam Details", icon: <FileText className="w-5 h-5" /> },
    { number: 2, title: "Question Paper & Model Answers", icon: <BookOpen className="w-5 h-5" /> },
    { number: 3, title: "Marking Rubric", icon: <ClipboardList className="w-5 h-5" /> },
    { number: 4, title: "Answer Sheets", icon: <Upload className="w-5 h-5" /> },
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as UploadStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as UploadStep);
    }
  };

  const handleStartEvaluation = async () => {
    setIsProcessing(true);
    setEvaluationError(null);
    setProcessingProgress(0);
    setProcessingStatus("Initializing AI evaluation...");
    
    try {
      const result = await processAndEvaluateExam({
        answerSheetFiles: examData.answerSheets,
        questionPaperFiles: examData.questionPaper,
        modelAnswerFiles: examData.modelAnswers,
        rubric: examData.rubric,
        totalMarks: examData.totalMarks,
        onProgress: (step, progress) => {
          setProcessingStatus(step);
          setProcessingProgress(progress);
        },
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Evaluation failed");
      }

      setEvaluationResult(result.data);
      toast.success("Evaluation completed successfully!");

      // Save to database
      setProcessingStatus("Saving results to database...");
      setProcessingProgress(95);

      // 1. Create exam record
      const { data: examRecord, error: examError } = await supabase
        .from("exams")
        .insert({
          faculty_id: user!.id,
          title: examData.examName,
          subject: examData.subject,
          total_marks: examData.totalMarks,
          rubric: examData.rubric,
        })
        .select()
        .single();

      if (examError) {
        console.error("Error saving exam:", examError);
        toast.error("Evaluation completed but failed to save to database");
      }

      let evaluationId: string | null = null;

      if (examRecord) {
        // 2. Create evaluation record
        const evalData = result.data;
        const { data: evalRecord, error: evalError } = await supabase
          .from("evaluations")
          .insert({
            exam_id: examRecord.id,
            status: "completed",
            total_marks_obtained: evalData.total_score,
            max_marks: evalData.max_score,
            percentage: evalData.percentage,
            grade: evalData.grade,
            ai_evaluation: evalData as any,
            evaluated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (evalError) {
          console.error("Error saving evaluation:", evalError);
        } else if (evalRecord) {
          evaluationId = evalRecord.id;

          // 3. Save question-level evaluations
          const questionRows = evalData.questions.map((q) => ({
            evaluation_id: evalRecord.id,
            question_id: q.question_id,
            marks_obtained: q.total_marks,
            max_marks: q.max_marks,
            criteria_breakdown: q.criteria_breakdown as any,
            strengths: q.strengths,
            weaknesses: q.weaknesses,
            feedback: q.feedback,
          }));

          const { error: qError } = await supabase
            .from("question_evaluations")
            .insert(questionRows);

          if (qError) {
            console.error("Error saving question evaluations:", qError);
          }
        }
      }

      // Store result in sessionStorage for the results page
      sessionStorage.setItem("lastEvaluation", JSON.stringify({
        examData: {
          examName: examData.examName,
          subject: examData.subject,
          totalMarks: examData.totalMarks,
        },
        result: result.data,
        evaluationId,
        examId: examRecord?.id ?? null,
        timestamp: new Date().toISOString(),
      }));
      
      navigate("/faculty/evaluation-result");
      
    } catch (error) {
      console.error("Evaluation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Evaluation failed";
      setEvaluationError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return examData.examName && examData.subject && examData.totalMarks > 0;
      case 2:
        return examData.questionPaper.length > 0 && examData.modelAnswers.length > 0;
      case 3:
        return examData.rubric.length > 20;
      case 4:
        return examData.answerSheets.length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/faculty">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Upload Exam</h1>
          <p className="text-muted-foreground mt-1">Upload answer sheets for AI-powered evaluation</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                  currentStep >= step.number
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {currentStep > step.number ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  step.icon
                )}
              </div>
              <p className={`text-sm mt-2 font-medium ${
                currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
              }`}>
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 lg:w-24 h-1 mx-2 rounded-full ${
                currentStep > step.number ? "bg-primary" : "bg-secondary"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="max-w-3xl mx-auto">
        <AcademicCard>
          {currentStep === 1 && (
            <div className="space-y-6">
              <AcademicCardHeader 
                title="Exam Details" 
                description="Enter the basic information about the exam"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="examName">Exam Name</Label>
                  <Input
                    id="examName"
                    placeholder="e.g., Data Structures Mid-Term"
                    value={examData.examName}
                    onChange={(e) => setExamData({ ...examData, examName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Computer Science"
                    value={examData.subject}
                    onChange={(e) => setExamData({ ...examData, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalMarks">Total Marks</Label>
                  <Input
                    id="totalMarks"
                    type="number"
                    placeholder="100"
                    value={examData.totalMarks}
                    onChange={(e) => setExamData({ ...examData, totalMarks: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentName">Student Name</Label>
                  <Input
                    id="studentName"
                    placeholder="e.g., John Smith"
                    value={examData.studentName}
                    onChange={(e) => setExamData({ ...examData, studentName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentRollNumber">Roll Number</Label>
                  <Input
                    id="studentRollNumber"
                    placeholder="e.g., CS2021045"
                    value={examData.studentRollNumber}
                    onChange={(e) => setExamData({ ...examData, studentRollNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <AcademicCardHeader 
                title="Question Paper & Model Answers" 
                description="Upload the question paper and model answers as PDF files"
              />
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    AI Evaluation Source of Truth
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    The AI will extract content from your PDFs using OCR and use ONLY the model answers 
                    to evaluate student responses. External knowledge will not be used.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Question Paper (PDF)</Label>
                    <FileUploadZone
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      multiple
                      maxSize={20}
                      onFilesSelected={(files) => setExamData({ ...examData, questionPaper: files })}
                      label="Upload Question Paper"
                      description="Upload the question paper as PDF or images"
                    />
                    {examData.questionPaper.length > 0 && (
                      <p className="text-sm text-score-high mt-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {examData.questionPaper.length} file(s) uploaded
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="mb-2 block">Model Answers (PDF)</Label>
                    <FileUploadZone
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      multiple
                      maxSize={20}
                      onFilesSelected={(files) => setExamData({ ...examData, modelAnswers: files })}
                      label="Upload Model Answers"
                      description="Upload the faculty model answers as PDF or images"
                    />
                    {examData.modelAnswers.length > 0 && (
                      <p className="text-sm text-score-high mt-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {examData.modelAnswers.length} file(s) uploaded
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <AcademicCardHeader 
                title="Marking Rubric" 
                description="Define the marking scheme for accurate AI evaluation"
              />
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Strict Rubric Enforcement
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    The AI will assign marks STRICTLY according to this rubric. Include question numbers, 
                    maximum marks, and specific criteria. Be explicit about partial credit rules.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rubric">Marking Rubric</Label>
                  <Textarea
                    id="rubric"
                    placeholder={`Q1 (10 marks):
- Definition of linked list (2 marks)
- Node structure explanation (2 marks)
- Types of linked list with descriptions (3 marks)
- Diagram showing node connections (2 marks)
- Real-world example (1 mark)

Q2 (15 marks):
- Correct algorithm explanation (5 marks)
- Time complexity with justification (5 marks)
- Space complexity analysis (3 marks)
- Edge case handling (2 marks)

Q3 (10 marks):
- Stack definition and LIFO explanation (2 marks)
- Queue definition and FIFO explanation (2 marks)
- At least 3 differences (3 marks)
- Real-world applications for each (2 marks)
- Diagram comparison (1 mark)
...`}
                    value={examData.rubric}
                    onChange={(e) => setExamData({ ...examData, rubric: e.target.value })}
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <AcademicCardHeader 
                title="Answer Sheets" 
                description="Upload student answer booklets for evaluation"
              />
              <FileUploadZone
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                multiple
                maxSize={20}
                onFilesSelected={(files) => setExamData({ ...examData, answerSheets: files })}
                label="Upload Answer Sheets"
                description="Upload scanned answer sheets (PDF, JPG, PNG, WEBP)"
              />
              
              {examData.answerSheets.length > 0 && (
                <div className="p-4 rounded-lg bg-score-high/10 border border-score-high/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-score-high" />
                    <div>
                      <p className="font-medium text-foreground">
                        {examData.answerSheets.length} page{examData.answerSheets.length > 1 ? "s" : ""} ready
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Click "Start AI Evaluation" to begin OCR and scoring
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="p-4 rounded-lg bg-secondary border border-border space-y-3">
                  <div className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-foreground font-medium">{processingStatus}</span>
                  </div>
                  <Progress value={processingProgress} className="h-2" />
                </div>
              )}

              {evaluationError && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-destructive" />
                    <div>
                      <p className="font-medium text-foreground">Evaluation Failed</p>
                      <p className="text-sm text-muted-foreground">{evaluationError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isProcessing}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleStartEvaluation}
                disabled={!canProceed() || isProcessing}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Start AI Evaluation
                  </>
                )}
              </Button>
            )}
          </div>
        </AcademicCard>
      </div>
    </div>
  );
}

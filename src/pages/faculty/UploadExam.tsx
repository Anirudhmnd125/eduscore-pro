import { useState } from "react";
import { AcademicCard, AcademicCardHeader } from "@/components/ui/academic-card";
import { FileUploadZone } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  ArrowRight, 
  FileText, 
  BookOpen, 
  ClipboardList,
  Upload,
  CheckCircle,
  Sparkles
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type UploadStep = 1 | 2 | 3 | 4;

interface ExamData {
  examName: string;
  subject: string;
  totalMarks: number;
  questionPaper: File[];
  modelAnswers: File[];
  rubric: string;
  answerSheets: File[];
}

export default function UploadExam() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<UploadStep>(1);
  const [examData, setExamData] = useState<ExamData>({
    examName: "",
    subject: "",
    totalMarks: 100,
    questionPaper: [],
    modelAnswers: [],
    rubric: "",
    answerSheets: [],
  });
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleStartEvaluation = () => {
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      toast.success("Evaluation started! You will be notified when complete.");
      navigate("/faculty/evaluations");
    }, 2000);
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
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <AcademicCardHeader 
                title="Question Paper & Model Answers" 
                description="Upload the question paper and model answers for reference"
              />
              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block">Question Paper</Label>
                  <FileUploadZone
                    accept=".pdf"
                    onFilesSelected={(files) => setExamData({ ...examData, questionPaper: files })}
                    label="Upload Question Paper"
                    description="PDF format preferred"
                  />
                </div>
                <div>
                  <Label className="mb-3 block">Model Answers</Label>
                  <FileUploadZone
                    accept=".pdf"
                    onFilesSelected={(files) => setExamData({ ...examData, modelAnswers: files })}
                    label="Upload Model Answers"
                    description="PDF format preferred"
                  />
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
                    AI Evaluation Guidelines
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Provide a detailed marking scheme. Include question numbers, maximum marks, and key points to look for. 
                    The AI will strictly follow this rubric for fair evaluation.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rubric">Marking Rubric</Label>
                  <Textarea
                    id="rubric"
                    placeholder={`Example format:

Q1 (10 marks):
- Definition of linked list (2 marks)
- Types of linked list (3 marks)
- Advantages over arrays (3 marks)
- Diagram (2 marks)

Q2 (15 marks):
- Algorithm explanation (5 marks)
- Time complexity analysis (5 marks)
- Code implementation (5 marks)
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
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                maxSize={20}
                onFilesSelected={(files) => setExamData({ ...examData, answerSheets: files })}
                label="Upload Answer Sheets"
                description="Upload PDF scans or images of answer booklets"
              />
              
              {examData.answerSheets.length > 0 && (
                <div className="p-4 rounded-lg bg-score-high/10 border border-score-high/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-score-high" />
                    <div>
                      <p className="font-medium text-foreground">
                        {examData.answerSheets.length} answer sheet{examData.answerSheets.length > 1 ? "s" : ""} ready
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Click "Start AI Evaluation" to begin processing
                      </p>
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
              disabled={currentStep === 1}
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

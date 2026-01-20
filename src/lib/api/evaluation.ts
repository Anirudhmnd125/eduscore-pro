import { supabase } from "@/integrations/supabase/client";

export interface OCRResult {
  success: boolean;
  raw_text: string;
  questions: Array<{
    question_id: string;
    answer_text: string;
  }>;
  confidence: "high" | "medium" | "low";
  notes?: string;
}

export interface CriteriaBreakdown {
  criterion: string;
  max_marks: number;
  marks_awarded: number;
  comment: string;
}

export interface QuestionEvaluation {
  question_id: string;
  student_answer_excerpt?: string;
  total_marks: number;
  max_marks: number;
  criteria_breakdown: CriteriaBreakdown[];
  strengths: string[];
  weaknesses: string[];
  feedback: string;
}

export interface FullEvaluationResult {
  questions: QuestionEvaluation[];
  total_score: number;
  max_score: number;
  percentage: number;
  grade: string;
  overall_strengths: string[];
  overall_weaknesses: string[];
  study_recommendations: string[];
  summary: string;
}

export interface EvaluationApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Convert a File to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extract text from an image using OCR
 */
export async function extractTextFromImage(
  imageFile: File
): Promise<EvaluationApiResponse<OCRResult>> {
  try {
    const base64 = await fileToBase64(imageFile);
    
    const { data, error } = await supabase.functions.invoke("ocr-extract", {
      body: {
        imageBase64: base64,
        mimeType: imageFile.type,
      },
    });

    if (error) {
      console.error("OCR extraction error:", error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err) {
    console.error("OCR error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "OCR extraction failed",
    };
  }
}

/**
 * Evaluate a single answer against model answer and rubric
 */
export async function evaluateSingleAnswer(params: {
  studentAnswer: string;
  modelAnswer: string;
  rubric: string;
  questionId: string;
  maxMarks: number;
}): Promise<EvaluationApiResponse<QuestionEvaluation>> {
  try {
    const { data, error } = await supabase.functions.invoke("evaluate-answer", {
      body: params,
    });

    if (error) {
      console.error("Evaluation error:", error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err) {
    console.error("Evaluation error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Evaluation failed",
    };
  }
}

/**
 * Evaluate a full exam with all questions
 */
export async function evaluateFullExam(params: {
  extractedAnswers: Array<{ question_id: string; answer_text: string }>;
  modelAnswers: string;
  rubric: string;
  totalMarks: number;
}): Promise<EvaluationApiResponse<FullEvaluationResult>> {
  try {
    const { data, error } = await supabase.functions.invoke("evaluate-full-exam", {
      body: params,
    });

    if (error) {
      console.error("Full evaluation error:", error);
      return { success: false, error: error.message };
    }

    return data;
  } catch (err) {
    console.error("Full evaluation error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Full evaluation failed",
    };
  }
}

/**
 * Process multiple answer sheets (images/PDFs) and evaluate them
 */
export async function processAndEvaluateAnswerSheet(params: {
  answerSheetFiles: File[];
  modelAnswers: string;
  rubric: string;
  totalMarks: number;
  onProgress?: (step: string, progress: number) => void;
}): Promise<EvaluationApiResponse<FullEvaluationResult>> {
  const { answerSheetFiles, modelAnswers, rubric, totalMarks, onProgress } = params;

  try {
    // Step 1: Extract text from all pages/images
    onProgress?.("Extracting text from answer sheets...", 10);
    
    const allExtractedAnswers: Array<{ question_id: string; answer_text: string }> = [];
    let rawTextCombined = "";

    for (let i = 0; i < answerSheetFiles.length; i++) {
      const file = answerSheetFiles[i];
      onProgress?.(`Processing page ${i + 1} of ${answerSheetFiles.length}...`, 10 + (30 * (i + 1) / answerSheetFiles.length));
      
      const ocrResult = await extractTextFromImage(file);
      
      if (!ocrResult.success || !ocrResult.data) {
        console.warn(`Failed to extract text from file ${i + 1}:`, ocrResult.error);
        continue;
      }

      rawTextCombined += ocrResult.data.raw_text + "\n\n";
      
      if (ocrResult.data.questions && ocrResult.data.questions.length > 0) {
        allExtractedAnswers.push(...ocrResult.data.questions);
      }
    }

    if (!rawTextCombined.trim()) {
      return { success: false, error: "Could not extract any text from the uploaded files" };
    }

    // If no structured questions were found, create a single entry with all text
    const answersToEvaluate = allExtractedAnswers.length > 0 
      ? allExtractedAnswers 
      : [{ question_id: "Full Answer", answer_text: rawTextCombined }];

    // Step 2: Evaluate the extracted answers
    onProgress?.("Evaluating answers against rubric...", 50);
    
    const evaluationResult = await evaluateFullExam({
      extractedAnswers: answersToEvaluate,
      modelAnswers,
      rubric,
      totalMarks,
    });

    onProgress?.("Evaluation complete!", 100);
    
    return evaluationResult;

  } catch (err) {
    console.error("Process and evaluate error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Processing failed",
    };
  }
}

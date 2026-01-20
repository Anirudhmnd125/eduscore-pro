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
 * Extract text from multiple files (images/PDFs) using OCR
 */
export async function extractTextFromFiles(
  files: File[],
  onProgress?: (step: string, progress: number) => void,
  startProgress: number = 0,
  endProgress: number = 100
): Promise<string> {
  let combinedText = "";
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const progress = startProgress + ((endProgress - startProgress) * (i + 1)) / files.length;
    onProgress?.(`Processing file ${i + 1} of ${files.length}...`, progress);
    
    const ocrResult = await extractTextFromImage(file);
    
    if (ocrResult.success && ocrResult.data) {
      combinedText += ocrResult.data.raw_text + "\n\n";
    }
  }
  
  return combinedText.trim();
}

/**
 * Process a full exam evaluation with PDF uploads for question paper, model answers, and answer sheets
 */
export async function processAndEvaluateExam(params: {
  answerSheetFiles: File[];
  questionPaperFiles: File[];
  modelAnswerFiles: File[];
  rubric: string;
  totalMarks: number;
  onProgress?: (step: string, progress: number) => void;
}): Promise<EvaluationApiResponse<FullEvaluationResult>> {
  const { 
    answerSheetFiles, 
    questionPaperFiles, 
    modelAnswerFiles, 
    rubric, 
    totalMarks, 
    onProgress 
  } = params;

  try {
    // Step 1: Extract text from question paper
    onProgress?.("Extracting question paper...", 5);
    const questionPaperText = await extractTextFromFiles(
      questionPaperFiles, 
      onProgress, 
      5, 
      15
    );
    
    if (!questionPaperText) {
      console.warn("Could not extract text from question paper");
    }

    // Step 2: Extract text from model answers
    onProgress?.("Extracting model answers...", 15);
    const modelAnswersText = await extractTextFromFiles(
      modelAnswerFiles, 
      onProgress, 
      15, 
      30
    );
    
    if (!modelAnswersText) {
      return { success: false, error: "Could not extract text from model answers PDF" };
    }

    // Step 3: Extract text from answer sheets
    onProgress?.("Extracting student answers...", 30);
    const allExtractedAnswers: Array<{ question_id: string; answer_text: string }> = [];
    let rawTextCombined = "";

    for (let i = 0; i < answerSheetFiles.length; i++) {
      const file = answerSheetFiles[i];
      const progress = 30 + (30 * (i + 1) / answerSheetFiles.length);
      onProgress?.(`Processing answer sheet page ${i + 1} of ${answerSheetFiles.length}...`, progress);
      
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
      return { success: false, error: "Could not extract any text from the uploaded answer sheets" };
    }

    // If no structured questions were found, create a single entry with all text
    const answersToEvaluate = allExtractedAnswers.length > 0 
      ? allExtractedAnswers 
      : [{ question_id: "Full Answer", answer_text: rawTextCombined }];

    // Step 4: Evaluate the extracted answers
    onProgress?.("Evaluating answers against rubric...", 70);
    
    const evaluationResult = await evaluateFullExam({
      extractedAnswers: answersToEvaluate,
      modelAnswers: modelAnswersText,
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuestionEvaluation {
  question_id: string;
  total_marks: number;
  max_marks: number;
  criteria_breakdown: Array<{
    criterion: string;
    max_marks: number;
    marks_awarded: number;
    comment: string;
  }>;
  strengths: string[];
  weaknesses: string[];
  overall_feedback: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { extractedAnswers, modelAnswers, rubric, totalMarks } = await req.json();

    if (!extractedAnswers || !modelAnswers || !rubric) {
      return new Response(
        JSON.stringify({ success: false, error: "Extracted answers, model answers, and rubric are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting full exam evaluation...");

    const systemPrompt = `You are an AI exam evaluation assistant for a college.

TASK:
1. Evaluate ALL student answers STRICTLY using the faculty-provided model answers and marking rubric.
2. Assign marks ONLY according to the rubric for each question.
3. Provide detailed, constructive academic feedback.
4. Generate an overall assessment.

IMPORTANT RULES (MUST FOLLOW):
- Use ONLY the faculty-provided model answers as the source of truth.
- Do NOT use external knowledge.
- Do NOT add new concepts that are not present in the faculty answers.
- Award marks ONLY according to the rubric.
- Be fair, strict, and consistent.
- Do NOT exceed maximum marks for any question.
- Partial credit is allowed only if supported by the faculty answer.
- Maintain academic integrity.

OUTPUT REQUIREMENTS:
Return ONLY valid JSON in the following format:
{
  "questions": [
    {
      "question_id": "Q1",
      "student_answer_excerpt": "First 100 chars of student answer...",
      "total_marks": number,
      "max_marks": number,
      "criteria_breakdown": [
        {
          "criterion": "string",
          "max_marks": number,
          "marks_awarded": number,
          "comment": "justification based on rubric"
        }
      ],
      "strengths": ["what student did well"],
      "weaknesses": ["what was missing/incorrect"],
      "feedback": "specific feedback for this question"
    }
  ],
  "total_score": number,
  "max_score": number,
  "percentage": number,
  "grade": "A/B/C/D/F based on percentage",
  "overall_strengths": ["overall strong points"],
  "overall_weaknesses": ["areas needing improvement"],
  "study_recommendations": ["specific study suggestions"],
  "summary": "2-3 sentence overall assessment"
}`;

    const userPrompt = `FACULTY MODEL ANSWERS:
${modelAnswers}

MARKING RUBRIC:
${rubric}

STUDENT ANSWERS (Extracted via OCR):
${JSON.stringify(extractedAnswers, null, 2)}

Total Maximum Marks: ${totalMarks}

Evaluate each answer strictly according to the rubric. Provide comprehensive feedback.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 16000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Evaluation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Read as text first to avoid JSON parse errors on truncated responses
    const responseText = await response.text();
    let aiResponse;
    try {
      aiResponse = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse AI gateway response:", e);
      console.error("Response text length:", responseText.length);
      console.error("Response text tail:", responseText.slice(-200));
      return new Response(
        JSON.stringify({ success: false, error: "AI response was truncated or malformed. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: "No response from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Robust JSON extraction
    let parsedResult;
    try {
      parsedResult = extractJsonFromResponse(content);
    } catch (parseError) {
      console.error("Failed to parse AI content:", parseError);
      console.error("Raw content tail:", content.slice(-300));
      return new Response(
        JSON.stringify({ success: false, error: "Failed to parse evaluation response. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Full exam evaluation complete: ${parsedResult.total_score}/${parsedResult.max_score}`);
    return new Response(
      JSON.stringify({ success: true, data: parsedResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Full evaluation error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Evaluation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

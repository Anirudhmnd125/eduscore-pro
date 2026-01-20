import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentAnswer, modelAnswer, rubric, questionId, maxMarks } = await req.json();

    if (!studentAnswer || !modelAnswer || !rubric) {
      return new Response(
        JSON.stringify({ success: false, error: "Student answer, model answer, and rubric are required" }),
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

    console.log(`Evaluating answer for ${questionId}...`);

    const systemPrompt = `You are an AI exam evaluation assistant for a college.

TASK:
1. Evaluate the student answer STRICTLY using the faculty-provided model answer and marking rubric.
2. Assign marks ONLY according to the rubric.
3. Provide detailed, constructive academic feedback.

IMPORTANT RULES (MUST FOLLOW):
- Use ONLY the faculty-provided model answer as the source of truth.
- Do NOT use external knowledge.
- Do NOT add new concepts that are not present in the faculty answer.
- Award marks ONLY according to the rubric.
- If a concept is missing in the faculty answer, it must NOT be rewarded.
- Be fair, strict, and consistent.
- Do NOT exceed maximum marks.
- Partial credit is allowed only if supported by the faculty answer.
- Be conservative when unsure.
- Maintain academic integrity.

OUTPUT REQUIREMENTS:
Return ONLY valid JSON in the following format:
{
  "question_id": "string",
  "total_marks": number,
  "max_marks": number,
  "criteria_breakdown": [
    {
      "criterion": "string (the specific marking criterion)",
      "max_marks": number,
      "marks_awarded": number,
      "comment": "short justification based on faculty answer"
    }
  ],
  "strengths": ["list of what the student did well"],
  "weaknesses": ["list of what was missing or incorrect"],
  "overall_feedback": "clear, concise academic feedback for the student with suggestions for improvement"
}

EVALUATION PRINCIPLES:
- Be specific about why marks were deducted
- Reference the rubric criteria explicitly
- Feedback must be educational and constructive
- No casual language, maintain academic tone`;

    const userPrompt = `FACULTY MODEL ANSWER:
${modelAnswer}

MARKING RUBRIC:
${rubric}

STUDENT ANSWER:
${studentAnswer}

Question ID: ${questionId}
Maximum Marks: ${maxMarks}

Evaluate this answer strictly according to the rubric and model answer provided.`;

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
        max_tokens: 2000,
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

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: "No response from AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response
    let parsedResult;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, content];
      const jsonStr = jsonMatch[1] || content;
      parsedResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to parse evaluation response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Evaluation complete for ${questionId}: ${parsedResult.total_marks}/${maxMarks}`);
    return new Response(
      JSON.stringify({ success: true, data: parsedResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Evaluation error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Evaluation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

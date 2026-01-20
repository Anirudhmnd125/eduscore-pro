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
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "Image data is required" }),
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

    console.log("Starting OCR extraction...");

    // Use Gemini for OCR - it has excellent vision capabilities
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert OCR assistant for extracting text from student answer sheets.

TASK:
1. Extract ALL text accurately from the provided image
2. Identify answer sections marked with question numbers (Q1, Q2, Q3, 1., 2., etc.)
3. Preserve the structure and formatting of answers
4. Handle handwritten text with care

OUTPUT FORMAT:
Return ONLY valid JSON in this format:
{
  "success": true,
  "raw_text": "Complete extracted text from the document",
  "questions": [
    {
      "question_id": "Q1",
      "answer_text": "The student's answer for this question"
    }
  ],
  "confidence": "high" | "medium" | "low",
  "notes": "Any issues encountered during extraction"
}

IMPORTANT:
- Be thorough and accurate
- Preserve mathematical notations and diagrams descriptions
- If text is unclear, provide best guess and note in confidence
- Separate each question's answer clearly`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text from this student answer sheet. Identify each question and its corresponding answer clearly."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
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
        JSON.stringify({ success: false, error: "OCR extraction failed" }),
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

    // Parse the JSON response from the AI
    let parsedResult;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, content];
      const jsonStr = jsonMatch[1] || content;
      parsedResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return raw text if JSON parsing fails
      parsedResult = {
        success: true,
        raw_text: content,
        questions: [],
        confidence: "low",
        notes: "Could not parse structured response, returning raw text"
      };
    }

    console.log("OCR extraction successful");
    return new Response(
      JSON.stringify({ success: true, data: parsedResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("OCR error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "OCR extraction failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

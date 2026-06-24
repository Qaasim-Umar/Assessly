import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    // Admin client — bypasses RLS, used to fetch answer keys and insert submission
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // User client — used only to verify the student's JWT
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const { examId, answers, theoryAnswers, studentName } = await req.json();

    if (!examId || !answers) {
      return Response.json({ error: "Missing required fields" }, { status: 400, headers: corsHeaders });
    }

    const { data: questions, error: qError } = await adminClient
      .from("questions")
      .select("id, correct_answer, type")
      .eq("exam_id", examId)
      .eq("is_active", true)
      .order("order_index");

    if (qError || !questions) {
      return Response.json({ error: "Failed to fetch questions" }, { status: 500, headers: corsHeaders });
    }

    const total = questions.length;
    let mcqScore = 0;
    let hasTheory = false;

    questions.forEach((q: any, idx: number) => {
      const isTheory = q.correct_answer === null || q.correct_answer === undefined;
      if (isTheory) {
        hasTheory = true;
      } else {
        const chosen = answers[String(idx)];
        if (chosen !== undefined && chosen === q.correct_answer) {
          mcqScore++;
        }
      }
    });

    const initialPercentage = total > 0 ? Math.round((mcqScore / total) * 100) : 0;
    const theoryStatus = hasTheory ? "pending_review" : "none";

    const { error: insertError } = await adminClient
      .from("submissions")
      .insert({
        exam_id: examId,
        student_id: user.id,
        student_name: studentName ?? "Student",
        answers,
        score: mcqScore,
        total,
        percentage: initialPercentage,
        theory_answers: theoryAnswers ?? {},
        theory_status: theoryStatus,
        theory_marks: {},
        mcq_score: mcqScore,
        final_score: mcqScore,
        final_percentage: initialPercentage,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return Response.json({ error: "Failed to save submission" }, { status: 500, headers: corsHeaders });
    }

    return Response.json(
      { score: mcqScore, total, percentage: initialPercentage, hasTheory },
      { headers: corsHeaders }
    );
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500, headers: corsHeaders });
  }
});

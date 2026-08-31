import { supabase } from "./supabase";

export type SchoolQuestionDifficulty = "Simple" | "Medium" | "Hard";
export type SchoolQuestionType = "MCQ" | "Theory";
export const SCHOOL_ASSESSMENT_TYPES = ["Assignment", "Test", "Exam", "Practice"] as const;
export type SchoolAssessmentType = (typeof SCHOOL_ASSESSMENT_TYPES)[number];

export type SchoolAssessmentQuestionInput = {
  id?: string | null;
  text: string;
  type: SchoolQuestionType;
  topic: string | null;
  difficulty: SchoolQuestionDifficulty;
  options: Array<{ label: string; text: string }> | null;
  correctAnswer: number | null;
};

export type CreateSchoolAssessmentDraftInput = {
  schoolId: string;
  academicTermId: string | null;
  title: string;
  subject: string;
  assessmentType: SchoolAssessmentType;
  durationMinutes: number | null;
  showResults: boolean;
  questions: SchoolAssessmentQuestionInput[];
};

export type SchoolAssessmentDraftResult = {
  id: string;
  title: string;
  questionCount: number;
  operation: "created" | "updated";
};

export type SchoolAssessmentDraft = {
  id: string;
  academicTermId: string | null;
  title: string;
  subject: string;
  assessmentType: SchoolAssessmentType;
  durationMinutes: number | null;
  showResults: boolean;
  questions: Array<Required<Pick<SchoolAssessmentQuestionInput, "text" | "type" | "difficulty">> & {
    id: string;
    topic: string | null;
    options: Array<{ label: string; text: string }> | null;
    correctAnswer: number | null;
  }>;
};

export type UpdateSchoolAssessmentDraftInput = CreateSchoolAssessmentDraftInput & {
  assessmentId: string;
};

export type PublishSchoolAssessmentInput = {
  schoolId: string;
  assessmentId: string;
  classIds: string[];
  availability: "now" | "scheduled";
  startsAt: string | null;
  endsAt: string | null;
};

export type PublishSchoolAssessmentResult = {
  assessmentId: string;
  classCount: number;
  status: "Live" | "Published";
};

export type CloseSchoolAssessmentResult = {
  assessmentId: string;
  closedAt: string;
};

function writeError(error: { code?: string; message?: string }, fallback: string): Error {
  if (error.code === "42501") {
    return new Error("You do not have permission to create School assessments.");
  }
  if (error.code === "23514") {
    return new Error("Check the assessment details and questions, then try again.");
  }
  return new Error(error.message?.trim() || fallback);
}

function draftEditError(error: { code?: string; message?: string }, fallback: string): Error {
  if (error.code === "42501") {
    return new Error("You do not have permission to edit assessments for this school.");
  }
  if (error.code === "23514") {
    return new Error("Check the assessment details and questions, then try again.");
  }
  return new Error(error.message?.trim() || fallback);
}

function publishError(error: { code?: string; message?: string }, fallback: string): Error {
  const message = error.message?.toLowerCase() ?? "";
  if (error.code === "23505" && message.includes("one_live_per_class")) {
    return new Error("One of those classes already has a live assessment. Schedule this one for later or close the current live assessment first.");
  }
  if (error.code === "23505") {
    return new Error("This assessment is already assigned to one of the selected classes. Refresh the page and try again.");
  }
  if (error.code === "23503") {
    return new Error("One of the selected classes is no longer available. Refresh the class list and try again.");
  }
  if (error.code === "23514") {
    return new Error("Check the assessment start and end times, then try again.");
  }
  if (error.code === "42501") {
    return new Error("You do not have permission to publish assessments for this school.");
  }
  return new Error(error.message?.trim() || fallback);
}

function closeError(error: { code?: string; message?: string }, fallback: string): Error {
  if (error.code === "42501") {
    return new Error("You do not have permission to close assessments for this school.");
  }
  return new Error(error.message?.trim() || fallback);
}

function readOptions(value: unknown): Array<{ label: string; text: string }> | null {
  if (!Array.isArray(value)) return null;
  const options = value.flatMap((option) => {
    if (!option || typeof option !== "object") return [];
    const row = option as { label?: unknown; text?: unknown };
    if (typeof row.label !== "string" || typeof row.text !== "string") return [];
    return [{ label: row.label, text: row.text }];
  });
  return options.length > 0 ? options : null;
}

function validateInput(input: CreateSchoolAssessmentDraftInput) {
  const title = input.title.trim();
  const subject = input.subject.trim();
  if (title.length < 2) throw new Error("Enter an assessment title.");
  if (!subject) throw new Error("Enter the assessment subject.");
  if (!(SCHOOL_ASSESSMENT_TYPES as readonly string[]).includes(input.assessmentType)) {
    throw new Error("Choose Assignment, Test, Exam, or Practice as the assessment type.");
  }
  if (input.durationMinutes !== null && input.durationMinutes < 1) {
    throw new Error("Duration must be at least one minute.");
  }
  if (input.questions.length === 0) throw new Error("Add at least one question.");

  input.questions.forEach((question, index) => {
    if (!question.text.trim()) throw new Error(`Enter the text for question ${index + 1}.`);
    if (question.type !== "MCQ") return;
    if (!question.options || question.options.length !== 4 || question.options.some((option) => !option.text.trim())) {
      throw new Error(`Enter all four options for question ${index + 1}.`);
    }
    if (question.correctAnswer === null || question.correctAnswer < 0 || question.correctAnswer > 3) {
      throw new Error(`Choose the correct answer for question ${index + 1}.`);
    }
  });

  return { title, subject };
}

export async function createSchoolAssessmentDraft(
  input: CreateSchoolAssessmentDraftInput,
): Promise<SchoolAssessmentDraftResult> {
  const { title, subject } = validateInput(input);
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (authError || !userId) {
    throw new Error("Your session has expired. Sign in again before creating an assessment.");
  }

  const questionTypes = new Set(input.questions.map((question) => question.type));
  const difficulties = new Set(input.questions.map((question) => question.difficulty));
  const questionType = questionTypes.size === 1 ? input.questions[0].type : "Mixed";
  const difficulty = difficulties.size === 1 ? input.questions[0].difficulty : "Mixed";

  const { data: assessment, error: assessmentError } = await supabase
    .from("school_assessments")
    .insert({
      school_id: input.schoolId,
      created_by: userId,
      academic_term_id: input.academicTermId,
      title,
      subject,
      assessment_type: input.assessmentType,
      duration_minutes: input.durationMinutes,
      difficulty,
      question_type: questionType,
      status: "Draft",
      question_count: input.questions.length,
      show_results: input.showResults,
    })
    .select("id")
    .single();

  if (assessmentError || !assessment) {
    throw writeError(assessmentError ?? {}, "Could not create the assessment draft.");
  }

  const questionRows = input.questions.map((question, index) => ({
    school_id: input.schoolId,
    assessment_id: assessment.id,
    text: question.text.trim(),
    type: question.type,
    topic: question.topic?.trim() || null,
    difficulty: question.difficulty,
    options: question.type === "MCQ"
      ? question.options?.map((option) => ({ ...option, text: option.text.trim() }))
      : null,
    correct_answer: question.type === "MCQ" ? question.correctAnswer : null,
    order_index: index,
    is_active: true,
    created_by: userId,
  }));

  const { error: questionError } = await supabase
    .from("school_assessment_questions")
    .insert(questionRows);

  if (questionError) {
    const { error: cleanupError } = await supabase
      .from("school_assessments")
      .delete()
      .eq("school_id", input.schoolId)
      .eq("id", assessment.id);

    if (cleanupError) {
      throw new Error("The assessment details were saved, but its questions were not. Refresh the assessment list before trying again.");
    }
    throw writeError(questionError, "Could not save the assessment questions.");
  }

  return {
    id: assessment.id,
    title,
    questionCount: input.questions.length,
    operation: "created",
  };
}

export async function getSchoolAssessmentDraft(
  schoolId: string,
  assessmentId: string,
): Promise<SchoolAssessmentDraft> {
  const cleanSchoolId = schoolId.trim();
  const cleanAssessmentId = assessmentId.trim();
  if (!cleanSchoolId || !cleanAssessmentId) {
    throw new Error("This draft could not be identified. Refresh the page and try again.");
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    throw new Error("Your session has expired. Sign in again before editing the assessment.");
  }

  const { data: assessment, error: assessmentError } = await supabase
    .from("school_assessments")
    .select("id, academic_term_id, title, subject, assessment_type, duration_minutes, show_results, status")
    .eq("school_id", cleanSchoolId)
    .eq("id", cleanAssessmentId)
    .maybeSingle();

  if (assessmentError) throw draftEditError(assessmentError, "Could not load the assessment draft.");
  if (!assessment) throw new Error("The draft was not found or you do not have permission to edit it.");
  if (assessment.status !== "Draft") throw new Error("Only draft assessments can be edited.");

  const { data: questionRows, error: questionError } = await supabase
    .from("school_assessment_questions")
    .select("id, text, type, topic, difficulty, options, correct_answer, order_index")
    .eq("school_id", cleanSchoolId)
    .eq("assessment_id", cleanAssessmentId)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  if (questionError) throw draftEditError(questionError, "Could not load the draft questions.");

  return {
    id: assessment.id,
    academicTermId: assessment.academic_term_id,
    title: assessment.title,
    subject: assessment.subject ?? "",
    assessmentType: (SCHOOL_ASSESSMENT_TYPES as readonly string[]).includes(assessment.assessment_type)
      ? assessment.assessment_type as SchoolAssessmentType
      : "Test",
    durationMinutes: assessment.duration_minutes,
    showResults: assessment.show_results,
    questions: (questionRows ?? []).map((question) => ({
      id: question.id,
      text: question.text,
      type: question.type === "Theory" ? "Theory" : "MCQ",
      topic: question.topic,
      difficulty: question.difficulty === "Simple" || question.difficulty === "Hard" ? question.difficulty : "Medium",
      options: readOptions(question.options),
      correctAnswer: typeof question.correct_answer === "number" ? question.correct_answer : null,
    })),
  };
}

export async function updateSchoolAssessmentDraft(
  input: UpdateSchoolAssessmentDraftInput,
): Promise<SchoolAssessmentDraftResult> {
  const { title, subject } = validateInput(input);
  const assessmentId = input.assessmentId.trim();
  if (!assessmentId) throw new Error("This draft could not be identified. Refresh the page and try again.");

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (authError || !userId) {
    throw new Error("Your session has expired. Sign in again before saving the assessment.");
  }

  const [{ data: assessment, error: assessmentError }, { data: existingQuestions, error: existingQuestionsError }] = await Promise.all([
    supabase
      .from("school_assessments")
      .select("id, status")
      .eq("school_id", input.schoolId)
      .eq("id", assessmentId)
      .maybeSingle(),
    supabase
      .from("school_assessment_questions")
      .select("id, text, type, topic, difficulty, options, correct_answer, order_index")
      .eq("school_id", input.schoolId)
      .eq("assessment_id", assessmentId)
      .eq("is_active", true),
  ]);

  if (assessmentError) throw draftEditError(assessmentError, "Could not check the assessment before saving.");
  if (!assessment) throw new Error("The draft was not found or you do not have permission to edit it.");
  if (assessment.status !== "Draft") throw new Error("This assessment is no longer a draft. Refresh the page before making changes.");
  if (existingQuestionsError) throw draftEditError(existingQuestionsError, "Could not check the existing draft questions.");

  const existingIds = new Set((existingQuestions ?? []).map((question) => question.id));
  const savedIds = input.questions.map((question) => question.id && existingIds.has(question.id) ? question.id : crypto.randomUUID());
  const addedIds = savedIds.filter((id) => !existingIds.has(id));
  const removedIds = [...existingIds].filter((id) => !savedIds.includes(id));
  const questionRows = input.questions.map((question, index) => ({
    id: savedIds[index],
    school_id: input.schoolId,
    assessment_id: assessmentId,
    text: question.text.trim(),
    type: question.type,
    topic: question.topic?.trim() || null,
    difficulty: question.difficulty,
    options: question.type === "MCQ"
      ? question.options?.map((option) => ({ ...option, text: option.text.trim() }))
      : null,
    correct_answer: question.type === "MCQ" ? question.correctAnswer : null,
    order_index: index,
    is_active: true,
    created_by: userId,
  }));

  const rollbackQuestions = async () => {
    if ((existingQuestions ?? []).length > 0) {
      await supabase.from("school_assessment_questions").upsert((existingQuestions ?? []).map((question) => ({
        id: question.id,
        school_id: input.schoolId,
        assessment_id: assessmentId,
        text: question.text,
        type: question.type,
        topic: question.topic,
        difficulty: question.difficulty,
        options: question.options,
        correct_answer: question.correct_answer,
        order_index: question.order_index,
        is_active: true,
        created_by: userId,
      })), { onConflict: "id" });
    }
    if (addedIds.length > 0) {
      await supabase
        .from("school_assessment_questions")
        .delete()
        .eq("school_id", input.schoolId)
        .eq("assessment_id", assessmentId)
        .in("id", addedIds);
    }
  };

  const { error: questionUpsertError } = await supabase
    .from("school_assessment_questions")
    .upsert(questionRows, { onConflict: "id" });
  if (questionUpsertError) {
    await rollbackQuestions();
    throw draftEditError(questionUpsertError, "Could not save the draft questions.");
  }

  if (removedIds.length > 0) {
    const { error: removeError } = await supabase
      .from("school_assessment_questions")
      .delete()
      .eq("school_id", input.schoolId)
      .eq("assessment_id", assessmentId)
      .in("id", removedIds);
    if (removeError) {
      await rollbackQuestions();
      throw draftEditError(removeError, "Could not remove the deleted draft questions.");
    }
  }

  const questionTypes = new Set(input.questions.map((question) => question.type));
  const difficulties = new Set(input.questions.map((question) => question.difficulty));
  const { data: updatedAssessment, error: updateError } = await supabase
    .from("school_assessments")
    .update({
      academic_term_id: input.academicTermId,
      title,
      subject,
      assessment_type: input.assessmentType,
      duration_minutes: input.durationMinutes,
      difficulty: difficulties.size === 1 ? input.questions[0].difficulty : "Mixed",
      question_type: questionTypes.size === 1 ? input.questions[0].type : "Mixed",
      question_count: input.questions.length,
      show_results: input.showResults,
    })
    .eq("school_id", input.schoolId)
    .eq("id", assessmentId)
    .eq("status", "Draft")
    .select("id")
    .maybeSingle();

  if (updateError || !updatedAssessment) {
    await rollbackQuestions();
    throw draftEditError(updateError ?? {}, "The assessment is no longer a draft. Refresh the page and try again.");
  }

  return { id: assessmentId, title, questionCount: input.questions.length, operation: "updated" };
}

export async function publishSchoolAssessment(
  input: PublishSchoolAssessmentInput,
): Promise<PublishSchoolAssessmentResult> {
  const classIds = [...new Set(input.classIds.filter(Boolean))];
  if (classIds.length === 0) throw new Error("Select at least one class.");

  const now = new Date();
  const startsAt = input.availability === "now" ? now : input.startsAt ? new Date(input.startsAt) : null;
  const endsAt = input.endsAt ? new Date(input.endsAt) : null;
  if (!startsAt || Number.isNaN(startsAt.getTime())) {
    throw new Error("Choose when the assessment should become available.");
  }
  if (input.availability === "scheduled" && startsAt.getTime() <= now.getTime()) {
    throw new Error("Choose a future start time for a scheduled assessment.");
  }
  if (endsAt && (Number.isNaN(endsAt.getTime()) || endsAt.getTime() <= startsAt.getTime())) {
    throw new Error("The closing time must be after the start time.");
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (authError || !userId) {
    throw new Error("Your session has expired. Sign in again before publishing an assessment.");
  }

  const [{ data: assessment, error: assessmentError }, { data: classRows, error: classError }] = await Promise.all([
    supabase
      .from("school_assessments")
      .select("id, status, question_count")
      .eq("school_id", input.schoolId)
      .eq("id", input.assessmentId)
      .maybeSingle(),
    supabase
      .from("school_classes")
      .select("id")
      .eq("school_id", input.schoolId)
      .eq("status", "active")
      .in("id", classIds),
  ]);

  if (assessmentError) throw publishError(assessmentError, "Could not check the assessment before publishing.");
  if (!assessment) throw new Error("The assessment was not found or you do not have permission to publish it.");
  if (assessment.status !== "Draft") throw new Error("Only draft assessments can be published from this screen.");
  if ((assessment.question_count ?? 0) < 1) throw new Error("Add at least one question before publishing.");
  if (classError) throw publishError(classError, "Could not check the selected classes.");
  if ((classRows ?? []).length !== classIds.length) {
    throw new Error("One of the selected classes is archived or no longer available. Refresh the page and try again.");
  }

  const assignmentStatus = input.availability === "now" ? "live" : "scheduled";
  const assessmentStatus = input.availability === "now" ? "Live" : "Published";
  const assignmentRows = classIds.map((classId) => ({
    school_id: input.schoolId,
    assessment_id: input.assessmentId,
    class_id: classId,
    status: assignmentStatus,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt?.toISOString() ?? null,
    created_by: userId,
  }));

  const { error: assignmentError } = await supabase
    .from("school_assessment_assignments")
    .insert(assignmentRows);
  if (assignmentError) {
    throw publishError(assignmentError, "Could not assign the assessment to those classes.");
  }

  const { data: updatedAssessment, error: updateError } = await supabase
    .from("school_assessments")
    .update({
      status: assessmentStatus,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt?.toISOString() ?? null,
    })
    .eq("school_id", input.schoolId)
    .eq("id", input.assessmentId)
    .eq("status", "Draft")
    .select("id")
    .maybeSingle();

  if (updateError || !updatedAssessment) {
    const { error: cleanupError } = await supabase
      .from("school_assessment_assignments")
      .delete()
      .eq("school_id", input.schoolId)
      .eq("assessment_id", input.assessmentId)
      .in("class_id", classIds);
    if (cleanupError) {
      throw new Error("The classes were assigned, but publishing did not finish. Refresh the assessment list before trying again.");
    }
    throw publishError(updateError ?? {}, "Could not publish the assessment.");
  }

  return {
    assessmentId: input.assessmentId,
    classCount: classIds.length,
    status: assessmentStatus,
  };
}

export async function closeSchoolAssessment(
  schoolId: string,
  assessmentId: string,
): Promise<CloseSchoolAssessmentResult> {
  const cleanSchoolId = schoolId.trim();
  const cleanAssessmentId = assessmentId.trim();
  if (!cleanSchoolId || !cleanAssessmentId) {
    throw new Error("This assessment could not be identified. Refresh the page and try again.");
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    throw new Error("Your session has expired. Sign in again before closing the assessment.");
  }

  const { data: current, error: currentError } = await supabase
    .from("school_assessments")
    .select("id, status, ends_at")
    .eq("school_id", cleanSchoolId)
    .eq("id", cleanAssessmentId)
    .maybeSingle();

  if (currentError) throw closeError(currentError, "Could not check the assessment before closing it.");
  if (!current) throw new Error("The assessment was not found or you do not have permission to close it.");
  if (current.status !== "Live") throw new Error("Only a live assessment can be closed from this menu.");

  const closedAt = new Date().toISOString();
  const { data: closedAssessment, error: assessmentError } = await supabase
    .from("school_assessments")
    .update({ status: "Closed", ends_at: closedAt })
    .eq("school_id", cleanSchoolId)
    .eq("id", cleanAssessmentId)
    .eq("status", "Live")
    .select("id")
    .maybeSingle();

  if (assessmentError || !closedAssessment) {
    throw closeError(assessmentError ?? {}, "The assessment is no longer live. Refresh the page and try again.");
  }

  const { error: assignmentError } = await supabase
    .from("school_assessment_assignments")
    .update({ status: "closed", ends_at: closedAt })
    .eq("school_id", cleanSchoolId)
    .eq("assessment_id", cleanAssessmentId)
    .in("status", ["live", "scheduled"]);

  if (assignmentError) {
    await supabase
      .from("school_assessments")
      .update({ status: current.status, ends_at: current.ends_at })
      .eq("school_id", cleanSchoolId)
      .eq("id", cleanAssessmentId)
      .eq("status", "Closed")
      .eq("ends_at", closedAt);
    throw closeError(assignmentError, "Could not close the assessment for its assigned classes.");
  }

  return { assessmentId: cleanAssessmentId, closedAt };
}

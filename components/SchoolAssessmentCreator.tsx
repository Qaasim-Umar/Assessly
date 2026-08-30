"use client";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  FileQuestion,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createSchoolAssessmentDraft,
  SCHOOL_ASSESSMENT_TYPES,
  type SchoolAssessmentDraftResult,
  type SchoolAssessmentType,
  type SchoolQuestionDifficulty,
  type SchoolQuestionType,
} from "@/lib/schoolAssessmentService";
import type { SchoolDashboardTerm } from "@/lib/schoolDashboardService";

type Props = {
  schoolId: string;
  terms: SchoolDashboardTerm[];
  onClose: () => void;
  onSaved: (result: SchoolAssessmentDraftResult) => Promise<void>;
};

type QuestionDraft = {
  localId: string;
  text: string;
  type: SchoolQuestionType;
  topic: string;
  difficulty: SchoolQuestionDifficulty;
  options: [string, string, string, string];
  correctAnswer: number | null;
};

const optionLabels = ["A", "B", "C", "D"] as const;
const inputClass = "mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm";

function newQuestion(localId = crypto.randomUUID()): QuestionDraft {
  return {
    localId,
    text: "",
    type: "MCQ",
    topic: "",
    difficulty: "Medium",
    options: ["", "", "", ""],
    correctAnswer: null,
  };
}

function questionError(question: QuestionDraft): string | null {
  if (!question.text.trim()) return "Enter the question text.";
  if (question.type === "Theory") return null;
  if (question.options.some((option) => !option.trim())) return "Enter all four answer options.";
  if (question.correctAnswer === null) return "Select the correct answer.";
  return null;
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  const items = [
    { number: 1, label: "Assessment details" },
    { number: 2, label: "Questions" },
  ];

  return (
    <ol className="grid grid-cols-2 gap-2" aria-label="Assessment creation progress">
      {items.map((item) => {
        const active = item.number === step;
        const complete = item.number < step;
        return (
          <li key={item.number} className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2 ${active ? "border-emerald-300 bg-emerald-50" : complete ? "border-emerald-200 bg-white" : "border-slate-200 bg-slate-50"}`} aria-current={active ? "step" : undefined}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${active || complete ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-600"}`}>
              {complete ? <Check size={15} aria-hidden="true" /> : item.number}
            </span>
            <span className={`text-xs font-bold leading-4 ${active ? "text-emerald-900" : "text-slate-600"}`}>{item.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function SchoolAssessmentCreator({ schoolId, terms, onClose, onSaved }: Props) {
  const currentTermId = terms.find((term) => term.status === "current")?.id ?? terms[0]?.id ?? "";
  const [step, setStep] = useState<1 | 2>(1);
  const [details, setDetails] = useState({
    title: "",
    subject: "",
    academicTermId: currentTermId,
    assessmentType: "Test" as SchoolAssessmentType,
    durationMinutes: "",
    showResults: true,
  });
  const [questions, setQuestions] = useState<QuestionDraft[]>([newQuestion("question-1")]);
  const [activeQuestionId, setActiveQuestionId] = useState(() => questions[0].localId);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const questionTextRef = useRef<HTMLTextAreaElement>(null);

  const activeIndex = Math.max(questions.findIndex((question) => question.localId === activeQuestionId), 0);
  const activeQuestion = questions[activeIndex];
  const completeCount = useMemo(
    () => questions.filter((question) => questionError(question) === null).length,
    [questions],
  );

  const requestClose = useCallback(() => {
    if (saving) return;
    if (!dirty || window.confirm("Discard this unsaved assessment draft?")) onClose();
  }, [dirty, onClose, saving]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [requestClose]);

  const setDetail = <K extends keyof typeof details>(key: K, value: (typeof details)[K]) => {
    setDetails((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setError("");
  };

  const updateQuestion = (patch: Partial<QuestionDraft>) => {
    setQuestions((current) => current.map((question) => question.localId === activeQuestion.localId ? { ...question, ...patch } : question));
    setDirty(true);
    setError("");
  };

  const updateOption = (index: number, value: string) => {
    const nextOptions = [...activeQuestion.options] as QuestionDraft["options"];
    nextOptions[index] = value;
    updateQuestion({ options: nextOptions });
  };

  const continueToQuestions = () => {
    if (details.title.trim().length < 2) {
      setError("Enter an assessment title.");
      titleRef.current?.focus();
      return;
    }
    if (!details.subject.trim()) {
      setError("Enter the assessment subject.");
      return;
    }
    const duration = details.durationMinutes ? Number(details.durationMinutes) : null;
    if (duration !== null && (!Number.isInteger(duration) || duration < 1 || duration > 600)) {
      setError("Duration must be a whole number between 1 and 600 minutes.");
      return;
    }
    setError("");
    setStep(2);
    window.setTimeout(() => questionTextRef.current?.focus(), 0);
  };

  const addQuestion = () => {
    const question = newQuestion();
    setQuestions((current) => [...current, question]);
    setActiveQuestionId(question.localId);
    setDirty(true);
    setError("");
    window.setTimeout(() => questionTextRef.current?.focus(), 0);
  };

  const removeQuestion = () => {
    if (questions.length === 1) return;
    const nextQuestions = questions.filter((question) => question.localId !== activeQuestion.localId);
    const nextActive = nextQuestions[Math.min(activeIndex, nextQuestions.length - 1)];
    setQuestions(nextQuestions);
    setActiveQuestionId(nextActive.localId);
    setDirty(true);
    setError("");
  };

  const saveDraft = async () => {
    const invalidIndex = questions.findIndex((question) => questionError(question) !== null);
    if (invalidIndex >= 0) {
      const invalidQuestion = questions[invalidIndex];
      setActiveQuestionId(invalidQuestion.localId);
      setError(`Question ${invalidIndex + 1}: ${questionError(invalidQuestion)}`);
      window.setTimeout(() => questionTextRef.current?.focus(), 0);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const result = await createSchoolAssessmentDraft({
        schoolId,
        academicTermId: details.academicTermId || null,
        title: details.title,
        subject: details.subject,
        assessmentType: details.assessmentType,
        durationMinutes: details.durationMinutes ? Number(details.durationMinutes) : null,
        showResults: details.showResults,
        questions: questions.map((question) => ({
          text: question.text,
          type: question.type,
          topic: question.topic || null,
          difficulty: question.difficulty,
          options: question.type === "MCQ"
            ? question.options.map((text, index) => ({ label: optionLabels[index], text }))
            : null,
          correctAnswer: question.type === "MCQ" ? question.correctAnswer : null,
        })),
      });
      setDirty(false);
      await onSaved(result);
      onClose();
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not save the assessment draft.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex bg-slate-950/60 p-0 backdrop-blur-sm sm:p-4 lg:p-6" role="presentation">
      <section className="m-auto flex h-dvh w-full flex-col overflow-hidden bg-[var(--cbt-background)] shadow-2xl sm:h-[min(920px,calc(100dvh-32px))] sm:max-w-6xl sm:rounded-3xl sm:border sm:border-white/70" role="dialog" aria-modal="true" aria-labelledby="school-assessment-creator-heading">
        <header className="shrink-0 border-b border-emerald-200 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-4 py-4 text-white sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-emerald-100"><ClipboardCheck size={21} aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-200/75">School assessment creator</p>
              <h2 id="school-assessment-creator-heading" className="mt-1 text-lg font-extrabold sm:text-xl">Create an assessment draft</h2>
              <p className="mt-1 text-xs leading-5 text-emerald-100/75">Add the details and questions now. You will assign classes and publish it afterward.</p>
            </div>
            <button type="button" onClick={requestClose} disabled={saving} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-wait disabled:opacity-50" aria-label="Close assessment creator"><X size={19} aria-hidden="true" /></button>
          </div>
        </header>

        <div className="cbt-scrollbar flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-5 sm:px-6 sm:py-6">
            <StepIndicator step={step} />

            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800" role="alert">
                <CircleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={(event) => { event.preventDefault(); continueToQuestions(); }} className="overflow-hidden rounded-2xl border border-[var(--cbt-border)] bg-white shadow-sm">
                <div className="border-b border-[var(--cbt-border)] px-4 py-4 sm:px-6">
                  <h3 className="text-base font-extrabold text-slate-950">Assessment details</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--cbt-muted)]">Give teachers and pupils a clear title and subject.</p>
                </div>
                <fieldset disabled={saving} className="grid gap-5 p-4 sm:grid-cols-2 sm:p-6">
                  <label className="text-xs font-bold text-slate-700 sm:col-span-2">Assessment title <span className="text-red-600" aria-hidden="true">*</span><input ref={titleRef} required maxLength={200} value={details.title} onChange={(event) => setDetail("title", event.target.value)} className={inputClass} placeholder="Example: First Term Mathematics Test" autoFocus /></label>
                  <label className="text-xs font-bold text-slate-700">Subject <span className="text-red-600" aria-hidden="true">*</span><input required maxLength={100} value={details.subject} onChange={(event) => setDetail("subject", event.target.value)} className={inputClass} placeholder="Example: Mathematics" /></label>
                  <label className="text-xs font-bold text-slate-700">Assessment type<select value={details.assessmentType} onChange={(event) => setDetail("assessmentType", event.target.value as SchoolAssessmentType)} className={inputClass}>{SCHOOL_ASSESSMENT_TYPES.map((assessmentType) => <option key={assessmentType} value={assessmentType}>{assessmentType}</option>)}</select></label>
                  <label className="text-xs font-bold text-slate-700">Academic term<select value={details.academicTermId} onChange={(event) => setDetail("academicTermId", event.target.value)} className={inputClass}><option value="">No academic term</option>{terms.map((term) => <option key={term.id} value={term.id}>{term.name} · {term.academicYear}{term.status === "current" ? " (Current)" : ""}</option>)}</select></label>
                  <label className="text-xs font-bold text-slate-700">Duration in minutes<input type="number" min="1" max="600" step="1" inputMode="numeric" value={details.durationMinutes} onChange={(event) => setDetail("durationMinutes", event.target.value)} className={inputClass} placeholder="Example: 45" /><span className="mt-1.5 block text-[11px] font-normal leading-4 text-slate-500">Leave blank if the assessment will not have a timer.</span></label>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                    <div className="flex items-center justify-between gap-4">
                      <div><p className="text-sm font-extrabold text-slate-900">Show results after submission</p><p className="mt-1 text-xs leading-5 text-slate-600">You can change this before publishing.</p></div>
                      <button type="button" role="switch" aria-checked={details.showResults} onClick={() => setDetail("showResults", !details.showResults)} className={`relative flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${details.showResults ? "border-emerald-700 bg-emerald-700" : "border-slate-300 bg-slate-300"}`}><span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${details.showResults ? "translate-x-7" : "translate-x-1"}`} /></button>
                    </div>
                  </div>
                </fieldset>
                <div className="flex flex-col-reverse gap-3 border-t border-[var(--cbt-border)] bg-[var(--cbt-surface-muted)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <button type="button" onClick={requestClose} className="min-h-12 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500">Cancel</button>
                  <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--cbt-primary)] px-6 text-sm font-extrabold text-white hover:bg-[var(--cbt-primary-strong)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">Continue to questions<ChevronRight size={17} aria-hidden="true" /></button>
                </div>
              </form>
            ) : (
              <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
                <aside className="h-fit overflow-hidden rounded-2xl border border-[var(--cbt-border)] bg-white shadow-sm lg:sticky lg:top-0" aria-label="Assessment questions">
                  <div className="border-b border-[var(--cbt-border)] px-4 py-4"><div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-extrabold">Questions</h3><p className="mt-1 text-xs text-[var(--cbt-muted)]">{completeCount} of {questions.length} complete</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-800 tabular-nums">{questions.length}</span></div></div>
                  <div className="cbt-scrollbar flex gap-2 overflow-x-auto p-3 lg:max-h-[470px] lg:flex-col lg:overflow-y-auto">
                    {questions.map((question, index) => {
                      const active = question.localId === activeQuestion.localId;
                      const complete = questionError(question) === null;
                      return <button key={question.localId} type="button" onClick={() => { setActiveQuestionId(question.localId); setError(""); }} aria-current={active ? "true" : undefined} className={`flex min-h-12 min-w-[150px] items-center gap-3 rounded-xl border px-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 lg:min-w-0 ${active ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${active ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700"}`}>{index + 1}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-slate-900">{question.text.trim() || `Question ${index + 1}`}</span><span className="mt-0.5 block text-[10px] text-slate-500">{question.type} · {question.difficulty}</span></span>{complete ? <CheckCircle2 size={16} className="shrink-0 text-emerald-700" aria-label="Complete" /> : <CircleAlert size={16} className="shrink-0 text-amber-600" aria-label="Incomplete" />}</button>;
                    })}
                  </div>
                  <div className="border-t border-[var(--cbt-border)] p-3"><button type="button" onClick={addQuestion} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-extrabold text-emerald-800 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"><Plus size={16} aria-hidden="true" />Add another question</button></div>
                </aside>

                <section className="overflow-hidden rounded-2xl border border-[var(--cbt-border)] bg-white shadow-sm" aria-labelledby="question-editor-heading">
                  <div className="flex items-center justify-between gap-4 border-b border-[var(--cbt-border)] px-4 py-4 sm:px-6"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">Question {activeIndex + 1} of {questions.length}</p><h3 id="question-editor-heading" className="mt-1 text-base font-extrabold text-slate-950">Question editor</h3></div><button type="button" onClick={removeQuestion} disabled={questions.length === 1} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-xs font-bold text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"><Trash2 size={15} aria-hidden="true" />Remove</button></div>
                  <fieldset disabled={saving} className="space-y-5 p-4 sm:p-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <label className="text-xs font-bold text-slate-700">Question type<select value={activeQuestion.type} onChange={(event) => updateQuestion({ type: event.target.value as SchoolQuestionType, correctAnswer: event.target.value === "Theory" ? null : activeQuestion.correctAnswer })} className={inputClass}><option value="MCQ">Multiple choice</option><option value="Theory">Theory</option></select></label>
                      <label className="text-xs font-bold text-slate-700">Difficulty<select value={activeQuestion.difficulty} onChange={(event) => updateQuestion({ difficulty: event.target.value as SchoolQuestionDifficulty })} className={inputClass}><option value="Simple">Simple</option><option value="Medium">Medium</option><option value="Hard">Hard</option></select></label>
                      <label className="text-xs font-bold text-slate-700">Topic <span className="font-normal text-slate-500">(optional)</span><input maxLength={100} value={activeQuestion.topic} onChange={(event) => updateQuestion({ topic: event.target.value })} className={inputClass} placeholder="Example: Algebra" /></label>
                    </div>
                    <label className="block text-xs font-bold text-slate-700">Question text <span className="text-red-600" aria-hidden="true">*</span><textarea ref={questionTextRef} required rows={4} maxLength={2000} value={activeQuestion.text} onChange={(event) => updateQuestion({ text: event.target.value })} className={`${inputClass} min-h-28 py-3 leading-6`} placeholder="Type the question pupils will answer…" /></label>

                    {activeQuestion.type === "MCQ" ? (
                      <fieldset className="space-y-3"><legend className="text-xs font-bold text-slate-700">Answer options <span className="text-red-600" aria-hidden="true">*</span></legend><p className="text-[11px] leading-4 text-slate-500">Select the circle beside the correct answer.</p>{activeQuestion.options.map((option, index) => <label key={optionLabels[index]} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition-colors focus-within:ring-2 focus-within:ring-emerald-500 ${activeQuestion.correctAnswer === index ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}><input type="radio" name={`correct-answer-${activeQuestion.localId}`} checked={activeQuestion.correctAnswer === index} onChange={() => updateQuestion({ correctAnswer: index })} className="h-5 w-5 shrink-0 accent-emerald-700" aria-label={`Mark option ${optionLabels[index]} as correct`} /><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${activeQuestion.correctAnswer === index ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700"}`}>{optionLabels[index]}</span><input value={option} onChange={(event) => updateOption(index, event.target.value)} maxLength={500} className="min-h-11 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white sm:text-sm" placeholder={`Option ${optionLabels[index]}`} aria-label={`Option ${optionLabels[index]} text`} /></label>)}</fieldset>
                    ) : (
                      <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900"><FileQuestion size={18} className="mt-1 shrink-0" aria-hidden="true" /><p>Pupils will type a written response. Theory grading will be connected in the results phase.</p></div>
                    )}
                  </fieldset>
                  <div className="flex flex-col-reverse gap-3 border-t border-[var(--cbt-border)] bg-[var(--cbt-surface-muted)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <button type="button" onClick={() => { setStep(1); setError(""); }} disabled={saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"><ArrowLeft size={16} aria-hidden="true" />Back to details</button>
                    <button type="button" onClick={saveDraft} disabled={saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--cbt-primary)] px-6 text-sm font-extrabold text-white hover:bg-[var(--cbt-primary-strong)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{saving ? <RefreshCw size={17} className="animate-spin" aria-hidden="true" /> : <Save size={17} aria-hidden="true" />}{saving ? "Saving assessment…" : `Save draft · ${questions.length} question${questions.length === 1 ? "" : "s"}`}</button>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

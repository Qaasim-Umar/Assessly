// ── Shared exam data store ─────────────────────────────────────────────────
// Single source of truth for both the creator dashboard and the student view.
// The student page shows only exams with status === "Live".

export type ExamStatus = "Draft" | "Published" | "Live";
export type ExamDifficulty = "Simple" | "Medium" | "Hard" | "Mixed";
export type ExamType = "Test" | "Mock" | "Practice";

export interface SharedExam {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  type: ExamType;
  questions: number;
  duration: number; // minutes
  status: ExamStatus;
  createdAt: string;
  difficulty: ExamDifficulty;
  // Student-facing fields (relevant when status === "Live")
  timeRemaining: string;
  minutesLeft: number;
}

export const mockExams: SharedExam[] = [
  {
    id: "1",
    title: "Third Term Mathematics Examination",
    subject: "Mathematics",
    classLevel: "SS2",
    type: "Test",
    questions: 40,
    duration: 120,
    status: "Live",
    createdAt: "Feb 25, 2026",
    difficulty: "Mixed",
    timeRemaining: "1h 45m",
    minutesLeft: 105,
  },
  {
    id: "2",
    title: "English Language Mid-Term Assessment",
    subject: "English Language",
    classLevel: "SS1",
    type: "Mock",
    questions: 50,
    duration: 60,
    status: "Published",
    createdAt: "Feb 20, 2026",
    difficulty: "Medium",
    timeRemaining: "1h 00m",
    minutesLeft: 60,
  },
  {
    id: "3",
    title: "Biology Theory & Objectives",
    subject: "Biology",
    classLevel: "SS3",
    type: "Test",
    questions: 60,
    duration: 120,
    status: "Live",
    createdAt: "Feb 18, 2026",
    difficulty: "Hard",
    timeRemaining: "2h 00m",
    minutesLeft: 120,
  },
  {
    id: "4",
    title: "Chemistry Periodic Assessment",
    subject: "Chemistry",
    classLevel: "SS2",
    type: "Test",
    questions: 30,
    duration: 45,
    status: "Draft",
    createdAt: "Feb 26, 2026",
    difficulty: "Simple",
    timeRemaining: "45m",
    minutesLeft: 45,
  },
  {
    id: "5",
    title: "Physics Revision Practice",
    subject: "Physics",
    classLevel: "SS3",
    type: "Practice",
    questions: 25,
    duration: 30,
    status: "Draft",
    createdAt: "Feb 22, 2026",
    difficulty: "Medium",
    timeRemaining: "30m",
    minutesLeft: 30,
  },
];

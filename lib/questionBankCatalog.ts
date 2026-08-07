export type QuestionBankExam =
  | "jamb"
  | "waec"
  | "neco"
  | "post"
  | "bece"
  | "neco-bece"
  | "waec-bece"
  | "nabteb";

export interface QuestionBankFile {
  name: string;
  objectKey: string;
  format?: "PDF";
}

export interface QuestionBankPack {
  id: string;
  slug: string;
  exam: QuestionBankExam;
  examLabel: string;
  section: string;
  title: string;
  subject: string;
  years: string;
  shortDescription: string;
  packType: "single" | "pack";
  objectKey: string;
  packFiles: QuestionBankFile[];
}

export const QUESTION_BANK_PACKS: QuestionBankPack[] = [
  {
    id: "mock-1",
    slug: "jamb-mathematics-past-questions-2015-2024",
    exam: "jamb",
    examLabel: "JAMB · Mathematics",
    section: "JAMB / UTME",
    title: "JAMB Mathematics Complete 2015–2024",
    subject: "Mathematics",
    years: "2015–2024",
    shortDescription:
      "Practise ten years of JAMB Mathematics past questions with answers in one focused, downloadable revision pack.",
    packType: "single",
    objectKey:
      "question-banks/jamb/mathematics/2015-2024/jamb-mathematics-2015-2024.pdf",
    packFiles: [],
  },
  {
    id: "mock-2",
    slug: "waec-science-past-questions-2024",
    exam: "waec",
    examLabel: "WAEC · Science Bundle",
    section: "WAEC / SSCE",
    title: "WAEC Physics, Chemistry & Biology 2024",
    subject: "Physics, Chemistry & Biology",
    years: "2024",
    shortDescription:
      "Download and practise the 2024 WAEC Physics, Chemistry, and Biology papers as three separate revision files.",
    packType: "pack",
    objectKey: "",
    packFiles: [
      {
        name: "WAEC Physics 2024",
        objectKey: "question-banks/waec/physics/2024/waec-physics-2024.pdf",
        format: "PDF",
      },
      {
        name: "WAEC Chemistry 2024",
        objectKey: "question-banks/waec/chemistry/2024/waec-chemistry-2024.pdf",
        format: "PDF",
      },
      {
        name: "WAEC Biology 2024",
        objectKey: "question-banks/waec/biology/2024/waec-biology-2024.pdf",
        format: "PDF",
      },
    ],
  },
];

export function getQuestionBankPack(slug: string) {
  return QUESTION_BANK_PACKS.find((pack) => pack.slug === slug);
}

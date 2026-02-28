export type Difficulty = "Simple" | "Medium" | "Hard";
export type QuestionType = "MCQ" | "Theory" | "Mixed";
export type ExamType = "Test" | "Mock" | "Practice";
export type Source = "manual" | "pdf";

export interface Option {
  label: string;
  text: string;
}

export interface Question {
  id: number;
  text: string;
  options?: Option[];
  type: "MCQ" | "Theory";
  topic: string;
  commandWord: string;
  aiDifficulty: Difficulty;
  userDifficulty: Difficulty;
  approved: boolean;
}

export interface ExamForm {
  title: string;
  subject: string;
  classLevel: string;
  type: ExamType;
  duration: string;
  source: Source;
  questionType: QuestionType;
  difficulty: Difficulty | "Mixed";
  questionCount: number;
  ratioSimple: number;
  ratioMedium: number;
  ratioHard: number;
}

export const defaultForm: ExamForm = {
  title: "Third Term Mathematics Examination",
  subject: "Mathematics",
  classLevel: "SS2",
  type: "Test",
  duration: "",
  source: "pdf",
  questionType: "MCQ",
  difficulty: "Mixed",
  questionCount: 10,
  ratioSimple: 40,
  ratioMedium: 40,
  ratioHard: 20,
};

// ─── Mock question generation ────────────────────────────────────────────────

const questionBank: Record<string, Partial<Question>[]> = {
  Mathematics: [
    {
      text: "Define the term 'prime number' and list five examples.",
      topic: "Number Theory",
      commandWord: "Define",
      aiDifficulty: "Simple",
      type: "Theory",
    },
    {
      text: "Solve for x: 3x + 7 = 22.",
      topic: "Algebra",
      commandWord: "Solve",
      aiDifficulty: "Simple",
      type: "MCQ",
      options: [
        { label: "A", text: "3" },
        { label: "B", text: "5" },
        { label: "C", text: "6" },
        { label: "D", text: "7" },
      ],
    },
    {
      text: "Calculate the area of a circle with radius 7 cm. (Use π = 22/7)",
      topic: "Geometry",
      commandWord: "Calculate",
      aiDifficulty: "Simple",
      type: "MCQ",
      options: [
        { label: "A", text: "154 cm²" },
        { label: "B", text: "44 cm²" },
        { label: "C", text: "22 cm²" },
        { label: "D", text: "49 cm²" },
      ],
    },
    {
      text: "Find the sum of the first 10 terms of the arithmetic sequence: 2, 5, 8, 11, ...",
      topic: "Sequences",
      commandWord: "Find",
      aiDifficulty: "Medium",
      type: "MCQ",
      options: [
        { label: "A", text: "155" },
        { label: "B", text: "125" },
        { label: "C", text: "140" },
        { label: "D", text: "147" },
      ],
    },
    {
      text: "Expand and simplify: (2x + 3)(x – 4).",
      topic: "Algebra",
      commandWord: "Expand",
      aiDifficulty: "Medium",
      type: "MCQ",
      options: [
        { label: "A", text: "2x²–5x–12" },
        { label: "B", text: "2x²+5x–12" },
        { label: "C", text: "2x²–8x–12" },
        { label: "D", text: "2x²–5x+12" },
      ],
    },
    {
      text: "Explain the difference between a function and a relation with appropriate examples.",
      topic: "Functions",
      commandWord: "Explain",
      aiDifficulty: "Medium",
      type: "Theory",
    },
    {
      text: "A triangle has sides 5 cm, 12 cm and 13 cm. Determine whether it is a right-angled triangle and justify your answer.",
      topic: "Trigonometry",
      commandWord: "Determine",
      aiDifficulty: "Medium",
      type: "Theory",
    },
    {
      text: "Evaluate: ∫(3x² + 2x – 1)dx.",
      topic: "Calculus",
      commandWord: "Evaluate",
      aiDifficulty: "Hard",
      type: "MCQ",
      options: [
        { label: "A", text: "x³+x²–x+C" },
        { label: "B", text: "6x+2+C" },
        { label: "C", text: "x³+x²+C" },
        { label: "D", text: "3x³+2x²–x+C" },
      ],
    },
    {
      text: "Analyze the behavior of the function f(x) = (x²–4)/(x–2) near x = 2, and determine its limit.",
      topic: "Calculus",
      commandWord: "Analyze",
      aiDifficulty: "Hard",
      type: "Theory",
    },
    {
      text: "Prove that the square root of 2 is irrational.",
      topic: "Number Theory",
      commandWord: "Prove",
      aiDifficulty: "Hard",
      type: "Theory",
    },
  ],
  Biology: [
    {
      text: "Name the four bases found in DNA.",
      topic: "Genetics",
      commandWord: "Name",
      aiDifficulty: "Simple",
      type: "MCQ",
      options: [
        { label: "A", text: "A, T, G, C" },
        { label: "B", text: "A, U, G, C" },
        { label: "C", text: "A, T, G, U" },
        { label: "D", text: "A, B, G, C" },
      ],
    },
    {
      text: "Define osmosis and state one example from plant biology.",
      topic: "Cell Biology",
      commandWord: "Define",
      aiDifficulty: "Simple",
      type: "Theory",
    },
    {
      text: "Which organelle is responsible for protein synthesis?",
      topic: "Cell Biology",
      commandWord: "Identify",
      aiDifficulty: "Simple",
      type: "MCQ",
      options: [
        { label: "A", text: "Nucleus" },
        { label: "B", text: "Ribosome" },
        { label: "C", text: "Mitochondria" },
        { label: "D", text: "Golgi body" },
      ],
    },
    {
      text: "Describe the process of mitosis and explain its significance.",
      topic: "Cell Division",
      commandWord: "Describe",
      aiDifficulty: "Medium",
      type: "Theory",
    },
    {
      text: "Compare and contrast aerobic and anaerobic respiration.",
      topic: "Respiration",
      commandWord: "Compare",
      aiDifficulty: "Medium",
      type: "Theory",
    },
    {
      text: "A heterozygous tall pea plant (Tt) is crossed with a short pea plant (tt). Predict the expected phenotype ratio.",
      topic: "Genetics",
      commandWord: "Predict",
      aiDifficulty: "Medium",
      type: "MCQ",
      options: [
        { label: "A", text: "1:1" },
        { label: "B", text: "3:1" },
        { label: "C", text: "1:3" },
        { label: "D", text: "2:1" },
      ],
    },
    {
      text: "Evaluate the impact of deforestation on biodiversity and ecosystem services.",
      topic: "Ecology",
      commandWord: "Evaluate",
      aiDifficulty: "Hard",
      type: "Theory",
    },
    {
      text: "Analyze the mechanisms by which antibiotic resistance develops in bacterial populations.",
      topic: "Microbiology",
      commandWord: "Analyze",
      aiDifficulty: "Hard",
      type: "Theory",
    },
  ],
  Chemistry: [
    {
      text: "State the periodic law as revised by Moseley.",
      topic: "Periodic Table",
      commandWord: "State",
      aiDifficulty: "Simple",
      type: "Theory",
    },
    {
      text: "What is the atomic number of Carbon?",
      topic: "Atomic Structure",
      commandWord: "Identify",
      aiDifficulty: "Simple",
      type: "MCQ",
      options: [
        { label: "A", text: "6" },
        { label: "B", text: "12" },
        { label: "C", text: "8" },
        { label: "D", text: "14" },
      ],
    },
    {
      text: "Balance the equation: Fe + O₂ → Fe₂O₃.",
      topic: "Chemical Equations",
      commandWord: "Balance",
      aiDifficulty: "Simple",
      type: "MCQ",
      options: [
        { label: "A", text: "4Fe + 3O₂ → 2Fe₂O₃" },
        { label: "B", text: "2Fe + 3O₂ → Fe₂O₃" },
        { label: "C", text: "Fe + O₂ → FeO" },
        { label: "D", text: "2Fe + O₂ → 2FeO" },
      ],
    },
    {
      text: "Explain the difference between ionic and covalent bonding with examples.",
      topic: "Chemical Bonding",
      commandWord: "Explain",
      aiDifficulty: "Medium",
      type: "Theory",
    },
    {
      text: "Calculate the molar mass of H₂SO₄.",
      topic: "Stoichiometry",
      commandWord: "Calculate",
      aiDifficulty: "Medium",
      type: "MCQ",
      options: [
        { label: "A", text: "98 g/mol" },
        { label: "B", text: "80 g/mol" },
        { label: "C", text: "64 g/mol" },
        { label: "D", text: "34 g/mol" },
      ],
    },
    {
      text: "Analyze the factors that affect the rate of a chemical reaction.",
      topic: "Kinetics",
      commandWord: "Analyze",
      aiDifficulty: "Hard",
      type: "Theory",
    },
  ],
  Physics: [
    {
      text: "State Newton's First Law of Motion.",
      topic: "Mechanics",
      commandWord: "State",
      aiDifficulty: "Simple",
      type: "Theory",
    },
    {
      text: "A body travels 60m in 3s. Calculate its average speed.",
      topic: "Kinematics",
      commandWord: "Calculate",
      aiDifficulty: "Simple",
      type: "MCQ",
      options: [
        { label: "A", text: "20 m/s" },
        { label: "B", text: "18 m/s" },
        { label: "C", text: "180 m/s" },
        { label: "D", text: "2 m/s" },
      ],
    },
    {
      text: "Explain the principle of conservation of energy with a practical example.",
      topic: "Energy",
      commandWord: "Explain",
      aiDifficulty: "Medium",
      type: "Theory",
    },
    {
      text: "A 5 kg object is accelerated at 3 m/s². Calculate the net force.",
      topic: "Mechanics",
      commandWord: "Calculate",
      aiDifficulty: "Medium",
      type: "MCQ",
      options: [
        { label: "A", text: "15 N" },
        { label: "B", text: "8 N" },
        { label: "C", text: "2 N" },
        { label: "D", text: "10 N" },
      ],
    },
    {
      text: "Analyze the wave-particle duality of light and discuss supporting evidence.",
      topic: "Modern Physics",
      commandWord: "Analyze",
      aiDifficulty: "Hard",
      type: "Theory",
    },
  ],
};

const defaultQuestions: Partial<Question>[] = [
  {
    text: "Define the key concept studied in this subject area.",
    topic: "Core Concepts",
    commandWord: "Define",
    aiDifficulty: "Simple",
    type: "Theory",
  },
  {
    text: "Identify the most important principle in this topic.",
    topic: "Principles",
    commandWord: "Identify",
    aiDifficulty: "Simple",
    type: "MCQ",
    options: [
      { label: "A", text: "Option A" },
      { label: "B", text: "Option B" },
      { label: "C", text: "Option C" },
      { label: "D", text: "Option D" },
    ],
  },
  {
    text: "Explain the relationship between cause and effect in this context.",
    topic: "Analysis",
    commandWord: "Explain",
    aiDifficulty: "Medium",
    type: "Theory",
  },
  {
    text: "Calculate the correct answer based on the given formula.",
    topic: "Application",
    commandWord: "Calculate",
    aiDifficulty: "Medium",
    type: "MCQ",
    options: [
      { label: "A", text: "Value A" },
      { label: "B", text: "Value B" },
      { label: "C", text: "Value C" },
      { label: "D", text: "Value D" },
    ],
  },
  {
    text: "Analyze and evaluate the significance of this concept in modern applications.",
    topic: "Higher Order",
    commandWord: "Analyze",
    aiDifficulty: "Hard",
    type: "Theory",
  },
];

export function generateQuestions(
  subject: string,
  count: number,
  qType: QuestionType,
  difficulty: Difficulty | "Mixed",
): Question[] {
  const pool = questionBank[subject] ?? defaultQuestions;
  const filled: Partial<Question>[] = [];
  while (filled.length < count) filled.push(...pool);
  const sliced = filled.slice(0, count);

  return sliced.map((q, i) => {
    let diff: Difficulty = q.aiDifficulty ?? "Medium";
    if (difficulty !== "Mixed") diff = difficulty;
    const type: "MCQ" | "Theory" =
      qType === "MCQ"
        ? "MCQ"
        : qType === "Theory"
          ? "Theory"
          : (q.type ?? "MCQ");
    return {
      id: i + 1,
      text: q.text ?? `Question ${i + 1}`,
      options:
        type === "MCQ"
          ? (q.options ?? [
              { label: "A", text: "Option A" },
              { label: "B", text: "Option B" },
              { label: "C", text: "Option C" },
              { label: "D", text: "Option D" },
            ])
          : undefined,
      type,
      topic: q.topic ?? "General",
      commandWord: q.commandWord ?? "Answer",
      aiDifficulty: diff,
      userDifficulty: diff,
      approved: false,
    };
  });
}

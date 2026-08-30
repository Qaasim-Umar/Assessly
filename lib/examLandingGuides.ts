export interface ExamLandingGuideContent {
  examName: string;
  structure: {
    title: string;
    intro: string;
    facts: { label: string; value: string }[];
    requirements: string[];
    registrationNote: string;
  };
  officialLinks: { label: string; href: string }[];
  modesIntro: string;
  modes: { title: string; bestFor: string; body: string; href: string }[];
  studyStrategy: { title: string; body: string }[];
  mistakes: string[];
  scoring: {
    title: string;
    intro: string;
    points: { title: string; body: string }[];
  };
  subjectIntro: string;
  subjectGuides: {
    id: string;
    title: string;
    overview: string;
    topics: string[];
    method: string;
  }[];
  samples: {
    subject: string;
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  }[];
}

export const JAMB_GUIDE: ExamLandingGuideContent = {
  examName: "JAMB UTME",
  structure: {
    title: "JAMB UTME structure and subject requirements",
    intro:
      "UTME is a computer-based multiple-choice examination. The 2026 JAMB manual specifies 180 questions in two hours: 60 Use of English questions and 40 questions in each of three other subjects.",
    facts: [
      { label: "Format", value: "Computer-based multiple choice" },
      { label: "Questions", value: "180 questions in total" },
      { label: "Time", value: "2 hours" },
      { label: "Result", value: "Reported out of 400" },
    ],
    requirements: [
      "Use of English is compulsory for every candidate and contains 60 questions.",
      "Choose three additional UTME subjects that match your intended course and institution; each contains 40 questions.",
      "Your UTME combination and your O'Level credits are separate requirements. A strong score cannot correct an invalid subject combination.",
      "Use JAMB IBASS to confirm the exact course, institution, O'Level and UTME requirements before registration.",
    ],
    registrationNote:
      "Do not copy a friend's subject combination merely because your courses sound similar. Requirements can differ by programme and institution, and JAMB's IBASS eligibility checker is the authoritative place to confirm them.",
  },
  officialLinks: [
    {
      label: "JAMB 2026 UTME manual",
      href: "https://www.jamb.gov.ng/PDFs/2026/2026%20TRAINING%20MANUAL%20%20final.pdf",
    },
    {
      label: "JAMB IBASS eligibility checker",
      href: "https://eligibility.jamb.gov.ng/",
    },
  ],
  modesIntro:
    "Use a mode because it solves today's study problem—not because it feels easiest. Combine learning modes with timed retrieval so knowledge survives exam pressure.",
  modes: [
    {
      title: "JAMB Simulator",
      bestFor: "exam rehearsal",
      body: "Choose English plus three subjects and complete a full UTME-style session. Use it to test pacing, subject switching and concentration across the entire two-hour window.",
      href: "/practice/mock/jamb",
    },
    {
      title: "Practice Mode",
      bestFor: "targeted drills",
      body: "Select one subject and topic for focused questions. Use this immediately after studying a concept to check whether you can apply it without notes.",
      href: "/practice",
    },
    {
      title: "Study Mode",
      bestFor: "learning weak topics",
      body: "Work more deliberately and use explanations to repair misunderstandings. Keep an error log containing the rule or idea you missed—not merely the correct option.",
      href: "/practice/study",
    },
    {
      title: "Past Questions",
      bestFor: "pattern recognition",
      body: "Revise by examination, subject and year. Compare repeated topic patterns, but always solve the question before looking at the answer.",
      href: "/practice/past-questions",
    },
    {
      title: "Survival Mode",
      bestFor: "speed and composure",
      body: "Answer continuously while protecting limited lives. This is useful for quick recall, but it should supplement—not replace—careful study and full mock exams.",
      href: "/practice/survival",
    },
  ],
  studyStrategy: [
    {
      title: "Begin with a diagnostic mock",
      body: "Take one full simulator without pausing. Record accuracy by subject, unanswered questions and topics that consumed too much time.",
    },
    {
      title: "Repair one weakness at a time",
      body: "Study the underlying concept, complete 15–25 focused questions, then explain the solution aloud without reading it.",
    },
    {
      title: "Train the compulsory English section",
      body: "English is the largest section. Schedule comprehension, lexis, grammar and oral-form drills throughout the week instead of leaving them for the final days.",
    },
    {
      title: "Build timed subject blocks",
      body: "Practise sets with a visible timer. Learn to skip a stubborn item, secure easier marks and return only when the rest of the block is safe.",
    },
    {
      title: "Repeat full simulations",
      body: "Take a full mock weekly at first and more frequently near the exam. Track whether your accuracy remains stable when you work faster.",
    },
  ],
  mistakes: [
    "Registering the wrong three-subject combination for the intended course.",
    "Treating Use of English as a minor subject even though it contains 60 questions.",
    "Spending several minutes on one calculation instead of marking it for review.",
    "Memorising past-question options without understanding why the alternatives are wrong.",
    "Taking many mocks without reviewing errors by topic and error type.",
    "Changing a reasoned answer because of panic rather than new evidence.",
  ],
  scoring: {
    title: "How to interpret JAMB practice scores",
    intro:
      "JAMB reports the UTME total out of 400, while a practice platform may first show raw correct answers or a percentage. Treat practice results as diagnostic evidence, not as a guaranteed official score conversion.",
    points: [
      {
        title: "Raw accuracy",
        body: "Calculate correct answers divided by attempted questions. Compare subjects separately so a strong section does not conceal a weak one.",
      },
      {
        title: "Pacing",
        body: "A high untimed percentage is not enough. Track correct answers completed within the two-hour limit and how many items you leave unseen.",
      },
      {
        title: "Readiness trend",
        body: "Use several full mocks under the same conditions. A stable upward trend is more informative than one unusually high or low session.",
      },
    ],
  },
  subjectIntro:
    "Start with the subjects in your verified combination. Use these compact guides to identify high-value topic groups and a practical revision method for each one.",
  subjectGuides: [
    {
      id: "jamb-use-of-english-guide",
      title: "JAMB Use of English guide",
      overview:
        "Build accuracy across comprehension, vocabulary and sentence-level decisions. Read for the writer's claim and evidence rather than relying on familiar-looking words.",
      topics: ["Comprehension", "Lexis and structure", "Sentence interpretation", "Oral forms"],
      method:
        "Complete one short passage daily, justify every answer with a line or inference from the text, and keep a vocabulary notebook containing each word in context.",
    },
    {
      id: "jamb-mathematics-guide",
      title: "JAMB Mathematics guide",
      overview:
        "Fluency matters because many questions combine familiar rules with unfamiliar wording. Train recognition, setup and calculation as separate skills.",
      topics: ["Number and numeration", "Algebra", "Geometry", "Trigonometry", "Statistics"],
      method:
        "Build a one-page formula sheet from memory, practise mixed sets, and label every error as a concept, setup, calculation or time-management mistake.",
    },
    {
      id: "jamb-biology-guide",
      title: "JAMB Biology guide",
      overview:
        "Biology rewards precise distinctions. Connect processes across levels—from cells and organisms to populations and ecosystems—instead of memorising isolated definitions.",
      topics: ["Cell biology", "Nutrition", "Genetics", "Ecology", "Evolution and adaptation"],
      method:
        "Draw labelled process diagrams, compare easily confused terms in two-column tables, and practise questions that ask you to apply a principle to a new organism or habitat.",
    },
    {
      id: "jamb-chemistry-guide",
      title: "JAMB Chemistry guide",
      overview:
        "Chemistry questions often move between symbols, particles and measurable quantities. Make each conversion step explicit before choosing an answer.",
      topics: ["Mole calculations", "Atomic structure", "Bonding", "Acids and bases", "Organic chemistry"],
      method:
        "Balance equations first, write units throughout calculations, and mix numerical questions with periodic trends, observations and reaction conditions.",
    },
    {
      id: "jamb-physics-guide",
      title: "JAMB Physics guide",
      overview:
        "Physics becomes faster when you can translate a sentence into a diagram, known values and one governing relationship.",
      topics: ["Mechanics", "Heat", "Waves", "Electricity", "Modern physics"],
      method:
        "Sketch the situation, list known quantities with SI units, select the relationship, then estimate the expected size of the answer before calculating.",
    },
    {
      id: "jamb-government-economics-guide",
      title: "JAMB Government and Economics guide",
      overview:
        "These subjects require both definitions and application. Tie institutions, policies and models to consequences rather than memorising lists without context.",
      topics: ["Constitution and institutions", "Political processes", "Markets", "National income", "Public finance"],
      method:
        "Use cause-and-effect chains, compare similar concepts, and answer scenario questions by identifying the principle before examining the options.",
    },
  ],
  samples: [
    {
      subject: "Mathematics",
      question: "A trader marks an item 25% above cost price and then gives a 10% discount. What percentage profit does the trader make?",
      options: ["10%", "12.5%", "15%", "22.5%"],
      answer: "B — 12.5%",
      explanation:
        "Let the cost price be ₦100. The marked price is ₦125. A 10% discount removes ₦12.50, so the selling price is ₦112.50. Profit is ₦12.50 on ₦100, which is 12.5%.",
    },
    {
      subject: "Use of English",
      question: "Choose the option that best completes the sentence: Neither the coach nor the players ___ willing to abandon the match.",
      options: ["was", "is", "were", "has been"],
      answer: "C — were",
      explanation:
        "With neither…nor, the verb commonly agrees with the nearer subject. The nearer subject is the plural noun “players,” so “were” completes the sentence.",
    },
  ],
};

export const WAEC_GUIDE: ExamLandingGuideContent = {
  examName: "WAEC WASSCE",
  structure: {
    title: "WAEC structure and subject requirements",
    intro:
      "WASSCE is organised subject by subject rather than as one single timed test. Depending on the subject, candidates may sit objective, essay or theory, oral and practical papers on different dates.",
    facts: [
      { label: "Entry load", value: "8–9 subjects" },
      { label: "Core in 2026–27", value: "English and General Mathematics" },
      { label: "Paper types", value: "Objective, essay, oral or practical" },
      { label: "Grades", value: "A1 to F9 by subject" },
    ],
    requirements: [
      "WAEC Nigeria's current entry rules require a minimum of eight and a maximum of nine subjects.",
      "For candidates registering in 2026 and 2027, English Language and General Mathematics are the two available core subjects under the new curriculum transition.",
      "Choose six or seven additional approved subjects that match your school programme and the admission requirements for your intended course.",
      "Paper components and durations differ by subject; check the current timetable and syllabus rather than applying one format to every paper.",
    ],
    registrationNote:
      "WAEC rules and paper schedules can change. Confirm your registered subjects, paper codes, practical or oral requirements and exact dates using WAEC Nigeria's current entry regulations and timetable.",
  },
  officialLinks: [
    {
      label: "WAEC entry regulations",
      href: "https://waecnigeria.org/node/102",
    },
    {
      label: "WAEC e-Learning toolkit",
      href: "https://www.waeconline.org.ng/e-learning/",
    },
  ],
  modesIntro:
    "WAEC preparation must train both recognition and written production. Objective practice builds breadth, while study and past-paper sessions should also include workings, essays, diagrams and practical reasoning on paper.",
  modes: [
    {
      title: "Practice Mode",
      bestFor: "objective accuracy",
      body: "Choose WAEC, a subject and a topic for focused questions. Use explanations to identify the exact rule, fact or calculation step behind each answer.",
      href: "/practice",
    },
    {
      title: "Study Mode",
      bestFor: "concept repair",
      body: "Slow down on weak areas and connect each explanation to your syllabus notes. After reviewing, close the explanation and reproduce the solution independently.",
      href: "/practice/study",
    },
    {
      title: "Past Questions",
      bestFor: "paper familiarity",
      body: "Select WAEC, subject and year to recognise recurring demands. For essay subjects, write complete answers away from the screen before checking guidance.",
      href: "/practice/past-questions",
    },
    {
      title: "Survival Mode",
      bestFor: "quick recall",
      body: "Use limited lives to sharpen fast factual and computational recall. Follow it with slower correction work so speed does not reinforce careless habits.",
      href: "/practice/survival",
    },
  ],
  studyStrategy: [
    {
      title: "Turn the syllabus into a checklist",
      body: "Mark every topic as not started, learning, practising or exam-ready. Do not let favourite topics consume time needed by neglected sections.",
    },
    {
      title: "Pair objective and written work",
      body: "After an objective drill, answer one related theory question with full workings, definitions, diagrams or examples as the subject requires.",
    },
    {
      title: "Use the examiner's language",
      body: "Practise command words such as state, explain, compare, calculate and evaluate. The length and structure of your answer should match the instruction.",
    },
    {
      title: "Schedule practical and oral preparation",
      body: "Do not treat practical observations, apparatus, specimens, graphs or oral work as last-minute extras. Rehearse their procedures throughout revision.",
    },
    {
      title: "Complete full papers under time",
      body: "Use the exact duration for the paper you are practising. Reserve final minutes to check numbering, units, required questions and transferred answers.",
    },
  ],
  mistakes: [
    "Ignoring the rubric and answering the wrong number of questions or sections.",
    "Practising only objective questions even when the subject includes essay, oral or practical papers.",
    "Omitting units, diagrams, labels or essential workings in calculation subjects.",
    "Rounding intermediate values too early and carrying an avoidable error into the final answer.",
    "Writing everything remembered instead of responding to the command word and mark allocation.",
    "Studying from answers alone without covering the current syllabus topic by topic.",
  ],
  scoring: {
    title: "How WAEC grading should shape your practice",
    intro:
      "WAEC reports a separate grade for each subject from A1 to F9. A1–C6 are credit grades, D7–E8 are passes and F9 is a fail, but your practice percentage should not be treated as an automatic official grade boundary.",
    points: [
      {
        title: "Components combine",
        body: "Objective, essay, practical or oral components contribute according to that subject's marking scheme. Strength in one paper may not compensate for leaving another component unprepared.",
      },
      {
        title: "Method earns marks",
        body: "In written and calculation papers, correct steps, units, diagrams and explanations can matter. Practise producing the evidence a marker needs to award marks.",
      },
      {
        title: "Credits serve a purpose",
        body: "Admission requirements usually specify credits in particular subjects, not merely a total number of passes. Prepare around the subjects required for your intended course.",
      },
    ],
  },
  subjectIntro:
    "WAEC papers reward subject-specific technique. Use the links below to jump to a guide, then combine digital objective practice with written work where the paper demands it.",
  subjectGuides: [
    {
      id: "waec-english-guide",
      title: "WAEC English Language guide",
      overview:
        "English preparation should cover essay writing, comprehension, summary, objective language use and oral work. Each component requires a different practice habit.",
      topics: ["Essay organisation", "Comprehension", "Summary", "Lexis and structure", "Oral English"],
      method:
        "Write one timed essay or summary each week, edit it for grammar and paragraph logic, and practise objective and oral items in shorter daily sessions.",
    },
    {
      id: "waec-mathematics-guide",
      title: "WAEC General Mathematics guide",
      overview:
        "Show a logical path from the given information to the answer. WAEC examiner reports repeatedly flag rubrics, units, accuracy and interpretation as avoidable weaknesses.",
      topics: ["Algebra", "Geometry", "Mensuration", "Trigonometry", "Statistics and probability"],
      method:
        "Write every essential step, include units, delay rounding until the final line, and practise drawing diagrams for bearings, geometry and word problems.",
    },
    {
      id: "waec-biology-guide",
      title: "WAEC Biology guide",
      overview:
        "Prepare for objective and written biological reasoning, including accurate diagrams, observable features, comparisons and the application of principles.",
      topics: ["Cell processes", "Nutrition", "Transport", "Genetics", "Ecology"],
      method:
        "Practise concise definitions, labelled diagrams and comparison tables. For practical-style tasks, separate what is observed from the biological inference.",
    },
    {
      id: "waec-chemistry-guide",
      title: "WAEC Chemistry guide",
      overview:
        "Chemistry preparation must connect equations and calculations with experimental observations, conditions, apparatus and safe procedure.",
      topics: ["Stoichiometry", "Energetics", "Equilibrium", "Organic chemistry", "Qualitative analysis"],
      method:
        "Balance equations before calculating, record units and significant figures, and learn observations as evidence linked to a conclusion rather than isolated colours.",
    },
    {
      id: "waec-physics-guide",
      title: "WAEC Physics guide",
      overview:
        "Physics answers should communicate the model, formula, substitution and unit clearly. Practical questions also test measurement, tables, graphs and interpretation.",
      topics: ["Mechanics", "Thermal physics", "Waves and optics", "Electricity", "Practical graphs"],
      method:
        "Practise plotting with labelled axes and sensible scales, show substitutions, and check whether the unit and magnitude of the final result are physically reasonable.",
    },
    {
      id: "waec-government-guide",
      title: "WAEC Government guide",
      overview:
        "Government requires accurate concepts, organised explanation and relevant Nigerian or international examples—not a list of disconnected facts.",
      topics: ["Constitution", "Organs of government", "Political participation", "Public administration", "International relations"],
      method:
        "Build comparison tables, practise explaining each point in a complete sentence, and match the number of developed points to the marks and command word.",
    },
  ],
  samples: [
    {
      subject: "General Mathematics",
      question: "A cylindrical tank has radius 2 m and height 3 m. Using π = 22/7, what is its volume to the nearest cubic metre?",
      options: ["19 m³", "38 m³", "44 m³", "66 m³"],
      answer: "B — 38 m³",
      explanation:
        "Volume = πr²h = (22/7) × 2² × 3 = 264/7 ≈ 37.71. Rounded to the nearest cubic metre, the volume is 38 m³. Notice that the cubic unit is essential.",
    },
    {
      subject: "Biology",
      question: "Why does a wilted plant usually become firm after its roots are placed in water?",
      options: ["Water enters the cells by osmosis", "Food moves into the leaves by diffusion", "Mineral salts leave the roots", "The stomata remain permanently closed"],
      answer: "A — Water enters the cells by osmosis",
      explanation:
        "Water moves into root and plant cells across selectively permeable membranes. The vacuoles expand and turgor pressure increases, making the tissues firm again.",
    },
  ],
};

export const POST_UTME_GUIDE: ExamLandingGuideContent = {
  examName: "Post-UTME",
  structure: {
    title: "Post-UTME structure and subject requirements",
    intro:
      "Post-UTME is institution-specific. A university may conduct a CBT, use an online screening exercise, calculate an aggregate from submitted results, or change its method between admission cycles.",
    facts: [
      { label: "Format", value: "Set by each institution" },
      { label: "Subjects", value: "Usually tied to the chosen course" },
      { label: "Timing", value: "Varies by school and year" },
      { label: "Aggregate", value: "No universal formula" },
    ],
    requirements: [
      "Confirm that your institution actually conducts a test for the current admission cycle; some schools use result-based screening instead.",
      "Where a test is used, prepare the exact subjects and scope published by the university, not a generic Post-UTME combination.",
      "Check the institution's UTME threshold, O'Level subject credits, result-upload rules and first-choice or programme conditions.",
      "Use only the university's official admissions portal for dates, fees, venue instructions and aggregate calculations.",
    ],
    registrationNote:
      "Treat every blog timetable or formula as unconfirmed until it matches the university's official notice for your admission year. Post-UTME details can change even when the institution used a different method last year.",
  },
  officialLinks: [
    {
      label: "JAMB IBASS eligibility checker",
      href: "https://eligibility.jamb.gov.ng/",
    },
    {
      label: "JAMB CAPS",
      href: "https://caps.jamb.gov.ng/",
    },
  ],
  modesIntro:
    "Begin with the target university, then choose a practice mode. School-specific past questions help with pattern recognition, while subject and study modes repair the knowledge those patterns expose.",
  modes: [
    {
      title: "Practice Mode",
      bestFor: "school-specific drills",
      body: "Select Post-UTME and your target institution before choosing a subject or topic. Use this for focused practice after confirming the school's current screening scope.",
      href: "/practice",
    },
    {
      title: "Past Questions",
      bestFor: "institution patterns",
      body: "Browse available questions by university and year. Use repeated topics to prioritise revision, but do not assume last year's format will remain unchanged.",
      href: "/practice/past-questions",
    },
    {
      title: "Study Mode",
      bestFor: "closing knowledge gaps",
      body: "Review explanations slowly when school-specific practice exposes a weak topic. Re-solve the item from scratch before moving to the next set.",
      href: "/practice/study",
    },
    {
      title: "Survival Mode",
      bestFor: "fast recall",
      body: "Build composure and decision speed with limited lives. Use it after learning, not as a substitute for checking the university's actual screening requirements.",
      href: "/practice/survival",
    },
  ],
  studyStrategy: [
    {
      title: "Read the current official notice",
      body: "Write down the format, subjects, duration, permitted materials, scoring method and screening date from your institution's own portal.",
    },
    {
      title: "Take a school-specific diagnostic",
      body: "Use available past questions to identify recurring areas and your weak subjects. Separate genuine knowledge gaps from time-pressure mistakes.",
    },
    {
      title: "Revise from the syllabus outward",
      body: "Strengthen the relevant secondary-school and UTME foundations first, then use institution-specific patterns to decide which topics deserve extra repetitions.",
    },
    {
      title: "Train for the published format",
      body: "If the school announces a CBT, practise timed screen-based sets. If screening is result-based, focus on correct uploads, eligibility and aggregate calculation instead of imaginary test details.",
    },
    {
      title: "Protect the administrative details",
      body: "Confirm names, result records, uploads, payments and deadlines early. Academic preparation cannot repair an invalid or incomplete screening application.",
    },
  ],
  mistakes: [
    "Assuming every university conducts a Post-UTME examination.",
    "Using another university's subjects, duration or aggregate formula for your target school.",
    "Preparing only current affairs when the published screening focuses on course-related subjects.",
    "Memorising old school-specific questions without repairing the underlying topic gaps.",
    "Ignoring O'Level uploads, first-choice rules, document details or application deadlines.",
    "Treating the minimum screening threshold as a guaranteed departmental admission score.",
  ],
  scoring: {
    title: "How Post-UTME and aggregate scoring work",
    intro:
      "There is no national Post-UTME scoring formula. Universities may weight UTME, a screening test and O'Level grades differently, so only the formula published by your institution for the current cycle is authoritative.",
    points: [
      {
        title: "Normalised components",
        body: "A school may convert UTME from 400 to a smaller contribution. For example, UTME ÷ 8 gives a maximum of 50—but use that only when your university explicitly publishes it.",
      },
      {
        title: "Illustrative 50:50 example",
        body: "Under a hypothetical 50:50 formula, UTME 280 gives 35/50 and a 72% screening score gives 36/50, producing 71/100. This is an example, not a universal rule.",
      },
      {
        title: "Eligibility is not admission",
        body: "A general cut-off may permit screening, while competitive programmes apply higher departmental thresholds based on capacity and candidate performance.",
      },
    ],
  },
  subjectIntro:
    "Use the subjects in your university's current notice. These guides cover common screening areas, but the official school-specific scope always takes priority.",
  subjectGuides: [
    {
      id: "post-utme-english-guide",
      title: "Post-UTME English and verbal guide",
      overview:
        "Many screening tests include comprehension, vocabulary, grammar or verbal reasoning because they test how quickly candidates interpret precise language.",
      topics: ["Comprehension", "Vocabulary in context", "Grammar", "Sentence logic", "Verbal reasoning"],
      method:
        "Practise short timed passages, identify the exact evidence for each inference, and review why every distractor fails rather than checking only the correct answer.",
    },
    {
      id: "post-utme-mathematics-guide",
      title: "Post-UTME Mathematics guide",
      overview:
        "Quantitative questions often reward fast setup more than long computation. Strengthen core arithmetic and algebra before chasing unusual tricks.",
      topics: ["Percentages", "Ratios", "Algebra", "Geometry", "Data interpretation"],
      method:
        "Practise mixed short sets, estimate before calculating, and learn when answer options allow substitution or elimination faster than a full solution.",
    },
    {
      id: "post-utme-science-guide",
      title: "Post-UTME science guide",
      overview:
        "Science and health-related courses may be screened in Biology, Chemistry and Physics, but the precise combination depends on the institution and programme.",
      topics: ["Biology processes", "Chemical calculations", "Periodic trends", "Mechanics", "Electricity"],
      method:
        "Create mixed course-relevant sets, alternate facts with calculations, and revisit the underlying WAEC or UTME concept whenever a school-specific item exposes a gap.",
    },
    {
      id: "post-utme-arts-social-science-guide",
      title: "Post-UTME arts and social science guide",
      overview:
        "Programmes may draw from Government, Economics, Literature, History or related areas. Strong answers depend on concepts, relationships and careful interpretation.",
      topics: ["Government", "Economics", "Literature", "History", "Current institutional scope"],
      method:
        "Confirm the required subjects, build cause-and-effect summaries, and practise distinguishing close concepts in short timed questions.",
    },
    {
      id: "post-utme-current-affairs-guide",
      title: "Post-UTME current affairs guide",
      overview:
        "Prepare current affairs only when the institution's published scope or reliable school-specific pattern supports it. Avoid letting trivia replace core subjects.",
      topics: ["Civic institutions", "National issues", "University knowledge", "Major regional bodies"],
      method:
        "Use a dated weekly summary from reputable sources, connect names to roles and institutions, and prioritise durable civic knowledge over rumours and isolated trivia.",
    },
  ],
  samples: [
    {
      subject: "Quantitative reasoning",
      question: "A screening test has 50 questions. A candidate answers 80% correctly. How many questions did the candidate miss?",
      options: ["5", "10", "15", "20"],
      answer: "B — 10",
      explanation:
        "If 80% were correct, 20% were missed. Twenty per cent of 50 is 0.20 × 50 = 10 questions.",
    },
    {
      subject: "Verbal reasoning",
      question: "All admitted candidates submitted valid results. Ada submitted valid results. Which conclusion is logically justified?",
      options: ["Ada was admitted", "Ada may or may not have been admitted", "Ada was not admitted", "No admitted candidate submitted results"],
      answer: "B — Ada may or may not have been admitted",
      explanation:
        "The statement says admission implies valid submission; it does not say every valid submission implies admission. Ada satisfies a necessary condition, but that alone does not prove admission.",
    },
  ],
};

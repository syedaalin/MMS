export interface DifficultyMeta {
  label: string;
  cls: string;
}

export const DIFFICULTY: Record<string, DifficultyMeta> = {
  easy:   { label: "Easy",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  medium: { label: "Medium", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  hard:   { label: "Hard",   cls: "bg-red-50 text-red-700 border-red-200" },
};

export interface QuestionTypeMeta {
  label: string;
  icon: string;
}

export const QUESTION_TYPES: Record<string, QuestionTypeMeta> = {
  mcq:        { label: "MCQ",          icon: "◉" },
  true_false: { label: "True / False", icon: "⊙" },
  short:      { label: "Short Answer", icon: "✎" },
};

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: "cat1", name: "Tajweed",         icon: "📖", color: "#0d9488" },
  { id: "cat2", name: "Hifz",            icon: "🕌", color: "#7c3aed" },
  { id: "cat3", name: "Islamic Studies", icon: "☪️",  color: "#b45309" },
  { id: "cat4", name: "Arabic",          icon: "✍️",  color: "#0369a1" },
  { id: "cat5", name: "Aqeedah",         icon: "🌙", color: "#be185d" },
];

export interface Question {
  id: string;
  categoryId: string;
  type: "mcq" | "true_false" | "short";
  difficulty: "easy" | "medium" | "hard";
  text: string;
  options: string[];
  answer: string;
  marks: number;
  tags: string[];
}

export const QUESTIONS: Question[] = [
  {
    id: "q1", categoryId: "cat1", type: "mcq", difficulty: "easy",
    text: "Which rule applies when noon sakinah is followed by a letter from (ي ن م و)?",
    options: ["Izhar", "Idgham", "Iqlab", "Ikhfa"],
    answer: "Idgham", marks: 2, tags: ["noon sakinah", "rules"],
  },
  {
    id: "q2", categoryId: "cat1", type: "true_false", difficulty: "easy",
    text: "Madd Tabee'i has a duration of 2 counts.",
    options: ["True", "False"], answer: "True", marks: 1, tags: ["madd"],
  },
  {
    id: "q3", categoryId: "cat3", type: "mcq", difficulty: "medium",
    text: "Which pillar of Islam comes second after Shahada?",
    options: ["Sawm", "Salah", "Zakat", "Hajj"],
    answer: "Salah", marks: 2, tags: ["pillars"],
  },
  {
    id: "q4", categoryId: "cat4", type: "mcq", difficulty: "medium",
    text: "What is the plural of كتاب (kitab)?",
    options: ["كتب", "كاتب", "مكتبة", "كتابة"],
    answer: "كتب", marks: 2, tags: ["vocabulary", "plural"],
  },
  {
    id: "q5", categoryId: "cat5", type: "short", difficulty: "hard",
    text: "Explain the concept of Tawheed Al-Uluhiyyah in your own words.",
    options: [], answer: "Singling out Allah alone in acts of worship such as prayer, supplication, sacrifice and vows.", marks: 5, tags: ["tawheed"],
  },
  {
    id: "q6", categoryId: "cat2", type: "mcq", difficulty: "hard",
    text: "In Surah Al-Baqarah, which verse is known as Ayat Al-Kursi?",
    options: ["Verse 255", "Verse 256", "Verse 257", "Verse 258"],
    answer: "Verse 255", marks: 3, tags: ["quran", "surah baqarah"],
  },
  {
    id: "q7", categoryId: "cat1", type: "mcq", difficulty: "medium",
    text: "Which letter requires Qalqalah?",
    options: ["ب", "أ", "ه", "ف"],
    answer: "ب", marks: 2, tags: ["qalqalah"],
  },
  {
    id: "q8", categoryId: "cat3", type: "true_false", difficulty: "easy",
    text: "The Quran was revealed over a period of 23 years.",
    options: ["True", "False"], answer: "True", marks: 1, tags: ["revelation"],
  },
];

export interface Test {
  id: string;
  name: string;
  categoryId: string | null;
  questionIds: string[];
  difficulty: "easy" | "medium" | "hard" | "mixed";
  duration: number;
  createdAt: string;
}

export const TESTS: Test[] = [
  {
    id: "t1", name: "Tajweed Basics — Term 1", categoryId: "cat1",
    questionIds: ["q1", "q2", "q7"],
    difficulty: "easy", duration: 20, createdAt: "2026-03-10",
  },
  {
    id: "t2", name: "Islamic Studies Mid-Term", categoryId: "cat3",
    questionIds: ["q3", "q8"],
    difficulty: "medium", duration: 30, createdAt: "2026-03-25",
  },
  {
    id: "t3", name: "Comprehensive Assessment", categoryId: null,
    questionIds: ["q1", "q3", "q4", "q5", "q6"],
    difficulty: "mixed", duration: 45, createdAt: "2026-04-05",
  },
];

export interface AssessmentResult {
  id: string;
  testId: string;
  studentName: string;
  studentId: string;
  submittedAt: string;
  answers: Record<string, string>;
  scores: Record<string, number>;
}

export const RESULTS: AssessmentResult[] = [
  {
    id: "r1", testId: "t1", studentName: "Ahmed Ali", studentId: "s1",
    submittedAt: "2026-03-15",
    answers: { q1: "Idgham", q2: "True", q7: "ب" },
    scores: { q1: 2, q2: 1, q7: 2 },
  },
  {
    id: "r2", testId: "t1", studentName: "Fatima Zahra", studentId: "s2",
    submittedAt: "2026-03-15",
    answers: { q1: "Izhar", q2: "True", q7: "ب" },
    scores: { q1: 0, q2: 1, q7: 2 },
  },
  {
    id: "r3", testId: "t1", studentName: "Umar Hassan", studentId: "s3",
    submittedAt: "2026-03-15",
    answers: { q1: "Idgham", q2: "False", q7: "أ" },
    scores: { q1: 2, q2: 0, q7: 0 },
  },
  {
    id: "r4", testId: "t2", studentName: "Ahmed Ali", studentId: "s1",
    submittedAt: "2026-03-28",
    answers: { q3: "Salah", q8: "True" },
    scores: { q3: 2, q8: 1 },
  },
  {
    id: "r5", testId: "t2", studentName: "Fatima Zahra", studentId: "s2",
    submittedAt: "2026-03-28",
    answers: { q3: "Zakat", q8: "True" },
    scores: { q3: 0, q8: 1 },
  },
];

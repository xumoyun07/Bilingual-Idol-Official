import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/translations";
import { Award, CheckCircle2, ChevronRight, Clock, HelpCircle, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Question {
  id: number;
  question: Record<Language, string>;
  options: { text: string; correct?: boolean }[];
}

const PLACEMENT_QUESTIONS: Question[] = [
  {
    id: 1,
    question: {
      en: "Choose the correct sentence to complete the statement:",
      ms: "Pilih ayat yang betul untuk melengkapkan kenyataan ini:",
      ar: "اختر الجملة الصحيحة لإكمال العبارة:",
    },
    options: [
      { text: "She don't like drinking coffee in the morning." },
      { text: "She doesn't likes drinking coffee in the morning." },
      { text: "She doesn't like drinking coffee in the morning.", correct: true },
      { text: "She isn't like drinking coffee in the morning." },
    ],
  },
  {
    id: 2,
    question: {
      en: "If I _____ earlier, I wouldn't have missed the morning lecture.",
      ms: "If I _____ earlier, I wouldn't have missed the morning lecture.",
      ar: "If I _____ earlier, I wouldn't have missed the morning lecture.",
    },
    options: [
      { text: "woke up" },
      { text: "had woken up", correct: true },
      { text: "have woken up" },
      { text: "would wake up" },
    ],
  },
  {
    id: 3,
    question: {
      en: "Which word best completes the executive statement: 'The Board will _____ the proposal at next week's meeting.'",
      ms: "Perkataan manakah yang paling sesuai: 'The Board will _____ the proposal at next week's meeting.'",
      ar: "أي كلمة تكمل الجملة بشكل صحيح: 'The Board will _____ the proposal at next week's meeting.'",
    },
    options: [
      { text: "deliberate", correct: true },
      { text: "deliberation" },
      { text: "deliberately" },
      { text: "deliberating" },
    ],
  },
  {
    id: 4,
    question: {
      en: "By this time next year, Sarah _____ her master's degree in Kuala Lumpur.",
      ms: "By this time next year, Sarah _____ her master's degree in Kuala Lumpur.",
      ar: "By this time next year, Sarah _____ her master's degree in Kuala Lumpur.",
    },
    options: [
      { text: "will complete" },
      { text: "will be completed" },
      { text: "will have completed", correct: true },
      { text: "has completed" },
    ],
  },
  {
    id: 5,
    question: {
      en: "The director asked whether we had _____ to all client inquiries.",
      ms: "The director asked whether we had _____ to all client inquiries.",
      ar: "The director asked whether we had _____ to all client inquiries.",
    },
    options: [
      { text: "responded", correct: true },
      { text: "respond" },
      { text: "responding" },
      { text: "response" },
    ],
  },
];

interface TestResult {
  score: number;
  total: number;
  level: string;
  recommended: string;
  date: string;
}

export function DiagnosticPlacementTest() {
  const { t, language, isRTL } = useLanguage();
  const [testState, setTestState] = useState<"idle" | "quiz" | "result">("idle");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [savedResult, setSavedResult] = useState<TestResult | null>(null);

  // Load saved result from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("bidi_placement_test_result");
      if (stored) {
        setSavedResult(JSON.parse(stored));
        setTestState("result");
      }
    } catch (e) {
      console.warn("localStorage is blocked in this environment");
    }
  }, []);

  const handleStart = () => {
    setAnswers({});
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setTestState("quiz");
  };

  const handleSelectOption = (optIdx: number) => {
    setSelectedAnswer(optIdx);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;
    
    const newAnswers = { ...answers, [currentIdx]: selectedAnswer };
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentIdx < PLACEMENT_QUESTIONS.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Calculate score
      let score = 0;
      Object.entries(newAnswers).forEach(([qIdx, ansIdx]) => {
        const question = PLACEMENT_QUESTIONS[Number(qIdx)];
        if (question && question.options[ansIdx]?.correct) {
          score++;
        }
      });

      // Map score to CEFR and Course recommendations
      let level = "Beginner (A1)";
      let recommended = "General English Foundation";

      if (score === 5) {
        level = "Advanced (C1)";
        recommended = "IELTS Preparation / Business English Elite";
      } else if (score >= 4) {
        level = "Upper-Intermediate (B2)";
        recommended = "Advanced Speaking / IELTS Excellence";
      } else if (score >= 3) {
        level = "Intermediate (B1)";
        recommended = "General English Intermediate";
      } else if (score >= 2) {
        level = "Elementary (A2)";
        recommended = "General English Elementary";
      }

      const result: TestResult = {
        score,
        total: PLACEMENT_QUESTIONS.length,
        level,
        recommended,
        date: new Date().toLocaleDateString(),
      };

      try {
        localStorage.setItem("bidi_placement_test_result", JSON.stringify(result));
      } catch (e) {
        console.warn("localStorage is blocked in this environment");
      }

      setSavedResult(result);
      setTestState("result");
    }
  };

  const handleReset = () => {
    try {
      localStorage.removeItem("bidi_placement_test_result");
    } catch (e) {
      console.warn("localStorage is blocked in this environment");
    }
    setSavedResult(null);
    setTestState("idle");
  };

  const q = PLACEMENT_QUESTIONS[currentIdx]!;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden transition-all duration-300">
      
      {/* Idle / Welcome State */}
      {testState === "idle" && (
        <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold">
              <Sparkles size={12} className="animate-pulse" />
              <span>Diagnostic Level Audit</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {language === "ms"
                ? "Sahkan Tahap Penguasaan Bahasa Inggeris Anda"
                : language === "ar"
                ? "تقييم مستوى لغتك الإنجليزية"
                : "Evaluate Your English Competency"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-2xl">
              {language === "ms"
                ? "Ambil penilaian pantas 5 soalan kami untuk menganggarkan tahap CEFR anda dan dapatkan cadangan modul pembelajaran yang sesuai."
                : language === "ar"
                ? "أجب عن 5 أسئلة سريعة لتحديد مستوى لغتك الإنجليزية والحصول على التوصيات الدراسية المناسبة لك."
                : "Complete our quick 5-question evaluation. It measures your core syntactic comprehension and maps you to an ideal learning course track."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              id="start-placement-test-btn"
              onClick={handleStart}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-all flex items-center gap-2 text-sm shadow-xs"
            >
              <span>
                {language === "ms"
                  ? "Mulakan Penilaian"
                  : language === "ar"
                  ? "ابدأ التقييم"
                  : "Start Evaluation"}
              </span>
              <ChevronRight size={16} className={isRTL ? "rotate-180" : ""} />
            </Button>
          </div>
        </div>
      )}

      {/* Quiz State */}
      {testState === "quiz" && (
        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Question {currentIdx + 1} of {PLACEMENT_QUESTIONS.length}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {language === "ms"
                  ? "Penilaian Tahap Bahasa"
                  : language === "ar"
                  ? "تقييم مستوى اللغة"
                  : "English Evaluation"}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Clock size={13} />
              <span>~2 mins left</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / PLACEMENT_QUESTIONS.length) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          <div className="space-y-4">
            <p className="text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
              {q.question[language] || q.question.en}
            </p>

            {/* Options */}
            <div className="grid grid-cols-1 gap-3">
              {q.options.map((option, idx) => {
                const isSelected = selectedAnswer === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`text-start p-4 rounded-xl border transition-all duration-200 text-sm flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-50/50 border-blue-600 text-blue-900 dark:bg-blue-950/30 dark:border-blue-500 dark:text-blue-100"
                        : "border-slate-200/80 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span>{option.text}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500"
                          : "border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controls Footer */}
          <div className="flex justify-end pt-2">
            <Button
              disabled={selectedAnswer === null}
              onClick={handleNext}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-6 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              <span>{currentIdx === PLACEMENT_QUESTIONS.length - 1 ? "Finish Test" : "Next Question"}</span>
              <ChevronRight size={14} className={`ms-1.5 ${isRTL ? "rotate-180" : ""}`} />
            </Button>
          </div>
        </div>
      )}

      {/* Result State */}
      {testState === "result" && savedResult && (
        <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-stretch justify-between gap-6 divide-y md:divide-y-0 md:divide-x rtl:md:divide-x-reverse dark:divide-slate-800/60 divide-slate-100">
          
          {/* Level Assessment Card Left */}
          <div className="flex-1 space-y-4 md:pe-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <CheckCircle2 size={12} />
              <span>Assessment Completed</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Estimated CEFR English Level
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center text-2xl font-black shadow-inner">
                {savedResult.level.match(/\(([^)]+)\)/)?.[1] || "B1"}
              </div>
              <div>
                <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {savedResult.level}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Diagnostic Score: <bdi dir="ltr">{savedResult.score}/{savedResult.total}</bdi> <bdi dir="ltr">({Math.round((savedResult.score / savedResult.total) * 100)}%)</bdi> · Tested on <bdi dir="ltr">{savedResult.date}</bdi>
                </p>
              </div>
            </div>
          </div>

          {/* Recommended Track Card Right */}
          <div className="flex-1 pt-6 md:pt-0 md:ps-6 flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Recommended Study Pathway
              </span>
              <div className="flex items-start gap-2 text-slate-800 dark:text-slate-100 mt-1">
                <Award size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {savedResult.recommended}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Based on your evaluation, we recommend this curriculum path at Pavilion Embassy to maximize speaking proficiency and fluency.
                  </p>
                </div>
              </div>
            </div>

            {/* Action controls */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleReset}
                variant="outline"
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 border-slate-200 hover:bg-slate-50 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800 px-3 py-1.5 h-8 rounded-lg"
              >
                <RefreshCw size={12} />
                <span>Retake Test</span>
              </Button>
            </div>
          </div>

        </div>
      )}

    </section>
  );
}

export default DiagnosticPlacementTest;

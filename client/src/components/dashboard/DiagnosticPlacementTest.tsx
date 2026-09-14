import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, CheckCircle, HelpCircle, Loader2, Award, ChevronRight, ChevronLeft, RefreshCw } from "lucide-react";

export function DiagnosticPlacementTest() {
  const { language, isRTL } = useLanguage();
  const [activeTestId, setActiveTestId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attemptResult, setAttemptResult] = useState<any>(null);

  const testsQuery = trpc.placementTests.list.useQuery();
  const testMutation = trpc.placementTests.submitAttempt.useMutation();

  const handleStartTest = (testId: number) => {
    setActiveTestId(testId);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setIsSubmitted(false);
    setAttemptResult(null);
  };

  const handleSelectAnswer = (questionId: number, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleNext = (totalQuestions: number) => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async (questions: any[]) => {
    if (!activeTestId) return;

    const result = await testMutation.mutateAsync({
      testId: activeTestId,
      answers,
    });

    setAttemptResult(result);
    setIsSubmitted(true);
  };

  const resetAll = () => {
    setActiveTestId(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setIsSubmitted(false);
    setAttemptResult(null);
  };

  if (testsQuery.isLoading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-slate-100 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
        <div className="h-4 bg-slate-100 rounded w-full" />
      </div>
    );
  }

  const tests = testsQuery.data || [];

  // 1. SELECT TEST SCREEN
  if (!activeTestId) {
    return (
      <div className="p-6 sm:p-8 bg-white rounded-xl border border-[#d9cbb8] shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-[#173fad]/10 text-[#173fad] rounded-lg">
            <BookOpen size={22} />
          </div>
          <div>
            <span className="text-xs font-bold text-[#173fad] uppercase tracking-wider block">
              {language === "ms" ? "Ujian Diagnostik Pintar" : language === "ar" ? "الاختبار التشخيصي الذكي" : "Diagnostic Assessments"}
            </span>
            <h2 className="text-xl font-extrabold text-[#10253e] mt-1">
              {language === "ms" ? "Ujian Penempatan Bahasa" : language === "ar" ? "اختبار تحديد المستوى اللغوي" : "Interactive Language Placement"}
            </h2>
            <p className="text-sm text-[#53657a] mt-1">
              {language === "ms" 
                ? "Kenal pasti tahap CEFR anda dengan ujian pintar kami untuk mendapatkan cadangan kursus yang paling sesuai." 
                : language === "ar" 
                ? "اكتشف مستواك وفق الإطار الأوروبي المرجعي (CEFR) من خلال اختبار تشخيصي دقيق للحصول على توصية بالبرنامج الدراسي الأنسب." 
                : "Diagnose your exact CEFR level (A1 - C1) instantly. Unlocks personalized course matching and custom modules."}
            </p>
          </div>
        </div>

        <div className="grid gap-4 mt-6">
          {tests.map(test => (
            <div key={test.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-xl border border-[#d9cbb8] hover:border-[#173fad] bg-[#fcfbfa] hover:bg-slate-50 transition-all gap-4">
              <div>
                <span className="px-2.5 py-1 bg-[#173fad]/10 text-[#173fad] text-xs font-extrabold rounded-full">
                  {test.language}
                </span>
                <h3 className="text-md font-extrabold text-[#10253e] mt-2">{test.title}</h3>
                <p className="text-xs text-[#708098] mt-1">
                  {language === "ms" ? "10 Soalan Aneka Pilihan • Masa diusyorkan: 15 min" : language === "ar" ? "١٠ أسئلة اختيار من متعدد • الوقت المقترح: ١٥ دقيقة" : "10 Interactive MCQ • Recommended: 15 mins"}
                </p>
              </div>
              <button
                onClick={() => handleStartTest(test.id)}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#173fad] hover:bg-[#102c7e] text-white text-sm font-extrabold rounded-lg shadow transition-colors min-h-[44px]"
              >
                {language === "ms" ? "Mula Ujian" : language === "ar" ? "ابدأ الاختبار" : "Start Placement"}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeTest = tests.find(t => t.id === activeTestId);
  const questions = activeTest ? JSON.parse(activeTest.questionsJson) : [];
  const currentQuestion = questions[currentQuestionIndex];

  // 2. RESULTS SCREEN
  if (isSubmitted && attemptResult) {
    return (
      <div className="p-6 sm:p-8 bg-white rounded-xl border border-emerald-100 bg-emerald-50/10 shadow-sm text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award size={32} />
        </div>
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
          {language === "ms" ? "Tahniah! Keputusan Selesai" : language === "ar" ? "تهانينا! اكتمل الاختبار" : "Placement Results"}
        </span>
        <h2 className="text-2xl font-extrabold text-[#10253e] mt-1">
          {language === "ms" ? "Tahap Penempatan Bahasa Anda" : language === "ar" ? "مستوى تحديد المستوى اللغوي الخاص بك" : "Your Evaluated CEFR Placement"}
        </h2>

        <div className="my-8 max-w-md mx-auto p-6 bg-white border border-[#d9cbb8] rounded-2xl shadow-sm">
          <div className="text-5xl font-extrabold text-[#173fad]">{attemptResult.cefrLevel}</div>
          <p className="text-xs text-[#708098] mt-1.5 uppercase tracking-wide font-semibold">
            {language === "ms" ? `Skor Ujian: ${attemptResult.score} / ${attemptResult.maxScore}` : language === "ar" ? `النتيجة: ${attemptResult.score} / ${attemptResult.maxScore}` : `Test Score: ${attemptResult.score} / ${attemptResult.maxScore}`}
          </p>
          <div className="h-px bg-slate-100 my-4" />
          <p className="text-xs text-[#708098] font-bold">
            {language === "ms" ? "Kursus Cadangan Pintar:" : language === "ar" ? "البرنامج الدراسي المقترح:" : "Recommended Programme Path:"}
          </p>
          <p className="text-md font-extrabold text-[#10253e] mt-1">
            {attemptResult.recommendedCourse}
          </p>
        </div>

        <p className="text-sm text-[#53657a] max-w-lg mx-auto">
          {language === "ms" 
            ? "Keputusan ujian ini telah direkodkan dalam fail kemasukan anda. Pegawai pendaftaran kami akan menggunakannya untuk menyusun jadual peribadi anda." 
            : language === "ar" 
            ? "تم تسجيل نتيجة هذا الاختبار في ملف القبول الخاص بك. سيستخدمها مستشار القبول لتصميم جدولك الدراسي الشخصي." 
            : "This diagnostics entry has been synchronized with your admissions file. Your advisor will refer to this for class scheduling and textbook material distributions."}
        </p>

        <button
          onClick={resetAll}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 border border-[#d9cbb8] hover:bg-slate-50 text-sm font-extrabold rounded-lg text-[#10253e] transition-colors min-h-[44px]"
        >
          <RefreshCw size={16} />
          {language === "ms" ? "Ambil Ujian Lain" : language === "ar" ? "أعد اختبارًا آخر" : "Take Another Test"}
        </button>
      </div>
    );
  }

  // 3. QUIZ INTERACTIVE VIEW
  const totalQuestions = questions.length;
  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="p-6 sm:p-8 bg-white rounded-xl border border-[#d9cbb8] shadow-sm">
      {/* Quiz Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold text-[#173fad]">
            {activeTest?.title}
          </span>
          <p className="text-sm text-[#708098] mt-0.5">
            {language === "ms" ? `Soalan ${currentQuestionIndex + 1} daripada ${totalQuestions}` : language === "ar" ? `السؤال ${currentQuestionIndex + 1} من ${totalQuestions}` : `Question ${currentQuestionIndex + 1} of ${totalQuestions}`}
          </p>
        </div>
        <button
          onClick={resetAll}
          className="text-xs font-extrabold text-red-600 hover:underline min-h-[44px]"
        >
          {language === "ms" ? "Keluar Ujian" : language === "ar" ? "إنهاء الاختبار" : "Exit Quiz"}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-6">
        <div 
          className="h-full bg-[#173fad] transition-all duration-300" 
          style={{ width: `${progressPercent}%` }} 
        />
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div className="my-6">
          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
            Level: {currentQuestion.level}
          </span>
          <h3 className="text-md sm:text-lg font-extrabold text-[#10253e] mt-2 mb-4 leading-relaxed">
            {currentQuestion.text}
          </h3>

          <div className="grid gap-3">
            {currentQuestion.options.map((opt: string) => {
              const isSelected = answers[currentQuestion.id] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleSelectAnswer(currentQuestion.id, opt)}
                  className={`w-full text-left p-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-between min-h-[44px] ${
                    isSelected 
                      ? "border-[#173fad] bg-[#173fad]/5 text-[#173fad] font-extrabold" 
                      : "border-[#d9cbb8] bg-white text-[#10253e] hover:bg-slate-50"
                  }`}
                  style={{ textAlign: isRTL ? "right" : "left" }}
                >
                  <span>{opt}</span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected ? "border-[#173fad] bg-[#173fad] text-white" : "border-slate-300 bg-white"
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
        <button
          onClick={handlePrev}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 border border-[#d9cbb8] rounded-lg text-xs sm:text-sm font-extrabold text-[#10253e] hover:bg-slate-50 transition-all disabled:opacity-35 min-h-[44px] inline-flex items-center gap-1.5"
        >
          <ChevronLeft size={16} className={isRTL ? "rotate-180" : ""} />
          {language === "ms" ? "Kembali" : language === "ar" ? "السابق" : "Previous"}
        </button>

        {currentQuestionIndex === totalQuestions - 1 ? (
          <button
            onClick={() => handleSubmit(questions)}
            disabled={testMutation.isPending || !answers[currentQuestion.id]}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-extrabold shadow-md transition-all disabled:opacity-35 min-h-[44px] inline-flex items-center gap-1.5"
          >
            {testMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {language === "ms" ? "Mengira..." : language === "ar" ? "جاري الحساب..." : "Grading..."}
              </>
            ) : (
              <>
                {language === "ms" ? "Hantar Jawapan" : language === "ar" ? "إنهاء وإرسال" : "Submit Test"}
                <CheckCircle size={16} />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => handleNext(totalQuestions)}
            disabled={!answers[currentQuestion.id]}
            className="px-6 py-2 bg-[#173fad] hover:bg-[#102c7e] text-white rounded-lg text-xs sm:text-sm font-extrabold shadow-md transition-all disabled:opacity-35 min-h-[44px] inline-flex items-center gap-1.5"
          >
            {language === "ms" ? "Seterusnya" : language === "ar" ? "التالي" : "Next"}
            <ChevronRight size={16} className={isRTL ? "rotate-180" : ""} />
          </button>
        )}
      </div>
    </div>
  );
}

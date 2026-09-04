import { Award, CheckCircle2, ChevronRight, Clock, HelpCircle, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/translations";

interface Question {
  id: number;
  question: Record<Language, string>;
  options: { text: string; correct?: boolean }[];
  explanation?: Record<Language, string>;
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

export function OnlinePlacementTestModal({ isOpen, onClose, onBookConsultation }: { isOpen: boolean; onClose: () => void; onBookConsultation?: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const { t, language, isRTL } = useLanguage();

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentQ = PLACEMENT_QUESTIONS[currentIdx];
  const totalQ = PLACEMENT_QUESTIONS.length;

  const handleSelect = (optionIdx: number) => {
    setSelectedAnswers(prev => ({ ...prev, [currentIdx]: optionIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    PLACEMENT_QUESTIONS.forEach((q, idx) => {
      const chosen = selectedAnswers[idx];
      if (chosen !== undefined && q.options[chosen]?.correct) {
        score++;
      }
    });
    return score;
  };

  const getEvaluation = (score: number) => {
    if (score >= 4) {
      return {
        level: language === "ms" ? "Pertengahan Atas / Lanjutan (B2–C1)" : language === "ar" ? "فوق المتوسط / متقدم (B2–C1)" : "Upper-Intermediate / Advanced (B2–C1)",
        recommendedCourse: language === "ms" ? "Bimbingan Premium IELTS atau Bahasa Inggeris Perniagaan Eksekutif" : language === "ar" ? "تدريب آيلتس المتميز أو الإنجليزية التنفيذية للأعمال" : "IELTS Premium Coaching or Executive Business English",
        description: language === "ms" ? "Anda mempunyai penguasaan struktur tatabahasa yang kukuh! Anda bersedia untuk mencapai skor IELTS tinggi atau program eksekutif di Pavilion Embassy." : language === "ar" ? "لديك فهم هيكلي قوي للغة الإنجليزية! أنت مؤهل تماماً لتحقيق درجات عالية في اختبار الآيلتس أو الانضمام لبرامج المحادثة التنفيذية في بافيليون إمباسي." : "You have a strong structural grasp of English! You are well-positioned for high-score IELTS mastery or executive presentation programs at Pavilion Embassy.",
        nextIntake: language === "ms" ? "Kemasukan Ogos / September 2026 Dibuka" : language === "ar" ? "باب القبول مفتوح لدفعة أغسطس / سبتمبر 2026" : "August / September 2026 Intake Available",
      };
    }
    if (score >= 2) {
      return {
        level: language === "ms" ? "Pertengahan (B1)" : language === "ar" ? "متوسط (B1)" : "Intermediate (B1)",
        recommendedCourse: language === "ms" ? "Bahasa Inggeris Umum (3 hingga 6 Bulan Intensif) atau IELTS Express" : language === "ar" ? "اللغة الإنجليزية العامة (3 إلى 6 أشهر مكثفة) أو آيلتس إكسبريس" : "General English (3 to 6 Months Intensive) or IELTS Express",
        description: language === "ms" ? "Anda mempunyai asas yang mantap! Kami mengesyorkan kursus Bahasa Inggeris Komunikatif untuk memperluas kelancaran bertutur, simpulan bahasa, dan ketepatan penulisan." : language === "ar" ? "لديك أساس جيد! نوصي ببرنامج اللغة الإنجليزية العامة التفاعلي لتعزيز طلاقتك الشفهية، المصطلحات، ودقة الكتابة." : "You have a solid foundation! We recommend our communicative General English course to expand your natural spoken flow, idioms, and writing precision.",
        nextIntake: language === "ms" ? "Sesi baharu bermula pada 1hb setiap bulan" : language === "ar" ? "تبدأ الدورات الجديدة في اليوم الأول من كل شهر" : "New term begins 1st of every month",
      };
    }
    return {
      level: language === "ms" ? "Asas / Permulaan (A1–A2)" : language === "ar" ? "تأسيسي / مبتدئ (A1–A2)" : "Elementary / Foundation (A1–A2)",
      recommendedCourse: language === "ms" ? "Penguasaan Bahasa Inggeris Umum (6 hingga 12 Bulan)" : language === "ar" ? "إتقان الإنجليزية العامة (6 إلى 12 شهراً)" : "General English Mastery (6 to 12 Months)",
      description: language === "ms" ? "Permulaan yang hebat! Tenaga pengajar dwibahasa dan penutur jati kami akan membina keyakinan bertutur, perbendaharaan kata, dan kemahiran perbualan harian anda." : language === "ar" ? "بداية ممتازة! سيساعدك أساتذتنا من المتحدثين الأصليين والخبراء في بناء ثقتك بتكوين الجمل، وتوسيع مفرداتك ومهارات المحادثة اليومية." : "A great starting point! Our patient native & bilingual educators will build your sentence confidence, vocabulary, and daily conversational skills.",
      nextIntake: language === "ms" ? "Pendaftaran segera dibuka" : language === "ar" ? "التسجيل الفوري متاح الآن" : "Immediate enrolment available",
    };
  };

  const score = calculateScore();
  const evalResult = getEvaluation(score);

  return createPortal(
    <div className={`bilc-modal-overlay ${isRTL ? "is-rtl" : ""}`} role="dialog" aria-modal="true" onClick={onClose}>
      <div className="bilc-modal-card" onClick={e => e.stopPropagation()}>
        <button type="button" className="bilc-modal-close-btn" onClick={onClose} aria-label="Close Placement Test">
          <X size={20} />
        </button>

        {!submitted ? (
          <div>
            <div className="bilc-modal-header">
              <div className="bilc-modal-badge">
                <Sparkles size={14} />
                <span>
                  {language === "ms"
                    ? "Ujian Penempatan Dalam Talian Percuma"
                    : language === "ar"
                    ? "اختبار تحديد المستوى المجاني عبر الإنترنت"
                    : "Free Online Placement Test · Fast Evaluation"}
                </span>
              </div>
              <h2>
                {language === "ms"
                  ? "Penilai Tahap Bahasa Inggeris Pantas"
                  : language === "ar"
                  ? "مقياس مستوى اللغة الإنجليزية السريع"
                  : "Quick English Level Evaluator"}
              </h2>
              <p>
                {language === "ms"
                  ? "Jawab 5 soalan tatabahasa & perbendaharaan kata untuk melihat anggaran tahap CEFR dan laluan pengajian yang disyorkan."
                  : language === "ar"
                  ? "أجب عن 5 أسئلة سريعة في القواعد والمفردات لمعرفة مستواك التقديري وفق الإطار الأوروبي (CEFR) والمسار الأكاديمي الموصى به."
                  : "Answer 5 quick grammar & vocabulary questions to see your estimated CEFR level and recommended study pathway."}
              </p>
            </div>

            <div className="bilc-test-progress-bar">
              <div className="bilc-progress-track">
                <div className="bilc-progress-fill" style={{ width: `${((currentIdx + 1) / totalQ) * 100}%` }} />
              </div>
              <span className="bilc-test-step-label">
                {language === "ms"
                  ? `Soalan ${currentIdx + 1} daripada ${totalQ}`
                  : language === "ar"
                  ? `السؤال ${currentIdx + 1} من ${totalQ}`
                  : `Question ${currentIdx + 1} of ${totalQ}`}
              </span>
            </div>

            <div className="bilc-question-body">
              <p className="bilc-question-text">{currentQ.question[language] || currentQ.question.en}</p>
              <div className="bilc-question-options">
                {currentQ.options.map((opt, oIdx) => (
                  <button
                    key={opt.text}
                    type="button"
                    className={`bilc-option-row ${selectedAnswers[currentIdx] === oIdx ? "is-selected" : ""}`}
                    onClick={() => handleSelect(oIdx)}
                  >
                    <span className="bilc-option-letter">{String.fromCharCode(65 + oIdx)}</span>
                    <span className="bilc-option-label">{opt.text}</span>
                    {selectedAnswers[currentIdx] === oIdx && <CheckCircle2 size={18} className="bilc-check-icon-active" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="bilc-modal-footer">
              <button
                type="button"
                className="bilc-nav-btn"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(i => i - 1)}
              >
                {language === "ms" ? "Sebelumnya" : language === "ar" ? "السابق" : "Previous"}
              </button>

              {currentIdx < totalQ - 1 ? (
                <button
                  type="button"
                  className="simple-button"
                  disabled={selectedAnswers[currentIdx] === undefined}
                  onClick={() => setCurrentIdx(i => i + 1)}
                >
                  {language === "ms" ? "Soalan Seterusnya" : language === "ar" ? "السؤال التالي" : "Next Question"} <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="simple-button"
                  disabled={selectedAnswers[currentIdx] === undefined}
                  onClick={() => setSubmitted(true)}
                >
                  {language === "ms" ? "Dapatkan Keputusan" : language === "ar" ? "عرض نتيجة التقييم" : "Get Evaluation Results"} <Award size={16} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bilc-test-result-view">
            <div className="bilc-result-header">
              <div className="bilc-score-circle">
                <strong>{score} / {totalQ}</strong>
                <span>{language === "ms" ? "Skor" : language === "ar" ? "النتيجة" : "Score"}</span>
              </div>
              <div>
                <span className="bilc-rec-tag">
                  {language === "ms" ? "Penilaian Selesai" : language === "ar" ? "اكتمل التقييم" : "Evaluation Complete"}
                </span>
                <h3>
                  {language === "ms" ? "Anggaran Tahap:" : language === "ar" ? "المستوى التقديري:" : "Estimated Level:"} {evalResult.level}
                </h3>
                <p className="text-sm text-slate-600">{evalResult.description}</p>
              </div>
            </div>

            <div className="bilc-rec-course-card">
              <span className="bilc-rec-small">
                {language === "ms" ? "Disyorkan Untuk Anda" : language === "ar" ? "موصى به لك" : "Recommended For You"}
              </span>
              <h4>{evalResult.recommendedCourse}</h4>
              <p className="bilc-intake-note">{evalResult.nextIntake}</p>
            </div>

            <div className="bilc-result-cta-grid">
              <a
                href={`https://wa.me/60367310449?text=${encodeURIComponent(`Hello Bilingual Idol! I completed your free Online Placement Test. My score is ${score}/${totalQ} (${evalResult.level}). I'd like to book my official evaluation.`)}`}
                target="_blank"
                rel="noreferrer"
                className="simple-button bilc-wa-btn"
              >
                {language === "ms"
                  ? "💬 Hantar Keputusan ke WhatsApp Kemasukan"
                  : language === "ar"
                  ? "💬 إرسال النتيجة عبر واتساب إلى القبول"
                  : "💬 WhatsApp Results to Admissions"}
              </a>

              <Link href="/enroll" className="simple-button simple-button-quiet" onClick={onClose}>
                {t("nav.enrollNow")}
              </Link>
            </div>

            <p className="bilc-disclaimer-text">
              {language === "ms"
                ? "* Nota: Penilaian pantas dalam talian ini memberikan anggaran awal. Penempatan rasmi untuk peruntukan kelas disahkan secara bersemuka di Pavilion Embassy atau melalui ujian Zoom bersama fakulti akademik kami."
                : language === "ar"
                ? "* ملاحظة: هذا التقييم السريع عبر الإنترنت يوفر تقديراً أولياً. يتم تأكيد تحديد المستوى الرسمي لتوزيع الفصول حضورياً في بافيليون إمباسي أو عبر اختبار زووم مباشر مع هيئتنا التدريسية الأكاديمية."
                : "* Note: This quick online evaluation provides an initial estimate. Official placement for class allocation is verified in person at Pavilion Embassy or via live Zoom test with our academic faculty."}
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}


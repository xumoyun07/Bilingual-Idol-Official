import { Globe2, Quote, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/translations";

interface Testimonial {
  name: string;
  country: Record<Language, string>;
  flag: string;
  duration: Record<Language, string>;
  course: Record<Language, string>;
  quotes: Record<Language, string>;
  quoteOriginal: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Talas",
    country: {
      en: "Uzbekistan",
      ms: "Uzbekistan",
      ar: "أوزبكستان",
    },
    flag: "🇺🇿",
    duration: {
      en: "6 Months Intensive",
      ms: "6 Bulan Intensif",
      ar: "6 أشهر مكثفة",
    },
    course: {
      en: "General English & Academic Writing",
      ms: "Bahasa Inggeris Umum & Penulisan Akademik",
      ar: "اللغة الإنجليزية العامة والكتابة الأكاديمية",
    },
    quotes: {
      en: "I have been studying in this class for nearly 6 months. In these 6 months, I learned so much, especially in grammar and writing. At the beginning, my writing was very weak. After structured assessments and guided practice, I made massive progress. The instructors are exceptional, and every lesson is genuinely captivating!",
      ms: "Saya telah belajar di kelas ini selama hampir 6 bulan. Dalam tempoh ini, saya belajar banyak perkara, terutamanya tatabahasa dan penulisan. Pada awalnya, penulisan saya agak lemah. Selepas penilaian berstruktur dan latihan berpandu, saya mencapai kemajuan yang besar. Tenaga pengajar amat hebat dan setiap pelajaran sangat menarik!",
      ar: "درست في هذا المعهد لما يقرب من 6 أشهر، وتعلمت خلالها الكثير خاصة في القواعد والكتابة الأكاديمية. في البداية كانت كتابتي ضعيفة، ولكن بفضل التقييمات المستمرة والتدريب الموجه، أحرزت تقدماً هائلاً. المدرسون رائعون والدروس ممتعة ومحفزة للغاية!",
    },
    quoteOriginal:
      "我在这个班级已经学习了将近六个月。在这六个月里，我学到了很多东西，尤其是语法和写作。一开始，我的写作很差。经过一些测试和练习后，我进步很大。老师们也非常优秀，课堂内容很有趣，让我即使在上课时也始终充满活力。",
  },
  {
    name: "Omar Alrimi",
    country: {
      en: "Yemen",
      ms: "Yaman",
      ar: "اليمن",
    },
    flag: "🇾🇪",
    duration: {
      en: "Academic Pathway",
      ms: "Laluan Akademik",
      ar: "المسار الأكاديمي",
    },
    course: {
      en: "Fluency & IELTS Preparation",
      ms: "Kelancaran & Persediaan IELTS",
      ar: "طلاقة المحادثة والتحضير للآيلتس",
    },
    quotes: {
      en: "BILC is truly outstanding! It not only helped me master English but supported me in every aspect of settling into Kuala Lumpur. Through BILC, we communicate effectively with zero hesitation. What I love most is the opportunity to meet people from diverse cultures and backgrounds and learn together.",
      ms: "BILC benar-benar cemerlang! Ia bukan sahaja membantu saya menguasai Bahasa Inggeris, malah membantu saya dalam setiap aspek penyesuaian diri di Kuala Lumpur. Di BILC, kami dapat berkomunikasi dengan yakin tanpa ragu-ragu. Apa yang paling saya sukai ialah peluang bertemu rakan dari pelbagai latar belakang dan budaya.",
      ar: "معهد BILC متميز واستثنائي بكل المقاييس! لم يساعدني في إتقان اللغة الإنجليزية فحسب، بل ساندني في كل تفاصيل الاستقرار في كوالالمبور. بفضل المعهد، أصبحنا نتحدث بطلاقة وبدون أي تردد، والأجمل هو التعرف على أصدقاء من ثقافات متنوعة والتعلم معاً.",
    },
    quoteOriginal:
      "BILC 非常棒，它不仅帮助我学习英语，还在各方面给予了帮助。通过 BILC，我们能够更有效地与他人沟通，毫不害羞地分享自己的想法。我们学到了不同的观点，也提升了英语口语能力。我最喜欢 BILC 的一点是，我们有机会结识来自不同文化和背景的人。",
  },
  {
    name: "Venice Yang",
    country: {
      en: "China",
      ms: "China",
      ar: "الصين",
    },
    flag: "🇨🇳",
    duration: {
      en: "Intensive Program",
      ms: "Program Intensif",
      ar: "البرنامج المكثف",
    },
    course: {
      en: "Conversational & Professional English",
      ms: "Bahasa Inggeris Perbualan & Profesional",
      ar: "المحادثة والإنجليزية المهنية",
    },
    quotes: {
      en: "I have learned so much in class. The teachers are incredibly friendly and supportive. Studying at Bilingual Idol is wonderful—the instructors keep the lessons lively, engaging, and enjoyable without losing academic depth. I love this course and know anyone joining will love it too.",
      ms: "Saya telah banyak belajar di dalam kelas. Guru-guru sangat ramah dan memberi sokongan padu. Belajar di Bilingual Idol amat menyeronokkan—tenaga pengajar sentiasa memastikan suasana kelas ceria dan interaktif di samping mengekalkan kualiti akademik yang tinggi. Saya amat mengesyorkannya kepada sesiapa sahaja.",
      ar: "استفدت كثيراً في الفصول الدراسية، والأساتذة ودودون ومتعاونون للغاية. تجربة الدراسة في بايلينجوال آيدول رائعة حقاً، حيث يحرص المدرسون على جعل الدروس حيوية وتفاعلية وممتعة مع الحفاظ على العمق الأكاديمي. أوصي بهذا البرنامج بشدة لكل من يريد تعلم الإنجليزية.",
    },
    quoteOriginal:
      "我在课堂上学到了很多东西。老师们非常友好。在这里学习非常棒。老师在课堂上营造轻松幽默的氛围，让课堂充满趣味与动力。我很喜欢这门课，也相信其他人会喜欢这门课。",
  },
];

export function VerifiedTestimonials() {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const { t, isRTL, language } = useLanguage();

  return (
    <section className={`simple-section bilc-testimonials-section ${isRTL ? "is-rtl" : ""}`} id="student-testimonials">
      <div className="bilc-testimonials-header">
        <div className="bilc-pricing-tag">
          <Globe2 size={16} />
          <span>
            {language === "ms"
              ? "Kisah Kejayaan Pelajar"
              : language === "ar"
              ? "تجارب وقصص نجاح طلابنا"
              : "Student Stories · Verified Reviews"}
          </span>
        </div>
        <h2>{t("home.testimonialsTitle")}</h2>
        <p>{t("home.testimonialsSubtitle")}</p>
      </div>

      <div className="bilc-testimonials-grid">
        {TESTIMONIALS.map((tItem, idx) => {
          const countryName = tItem.country[language] || tItem.country.en;
          const courseName = tItem.course[language] || tItem.course.en;
          const quoteText = tItem.quotes[language] || tItem.quotes.en;
          return (
            <div
              key={tItem.name}
              className={`bilc-testimonial-card ${activeIdx === idx ? "is-featured" : ""}`}
              onClick={() => setActiveIdx(idx)}
            >
              <div className="bilc-testimonial-top">
                <div className="bilc-stars-row">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={15} className="bilc-star-icon" fill="currentColor" />
                  ))}
                </div>
                <Quote size={24} className="bilc-quote-icon" />
              </div>

              <p className="bilc-testimonial-text">"{quoteText}"</p>
              <p className="bilc-testimonial-original">“{tItem.quoteOriginal}”</p>

              <div className="bilc-testimonial-author">
                <div className="bilc-flag-circle">{tItem.flag}</div>
                <div>
                  <strong>{tItem.name}</strong>
                  <span className="bilc-author-country">{countryName} · {courseName}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Box */}
      <div className="bilc-testimonial-cta-banner">
        <div className="bilc-cta-copy">
          <h3>
            {language === "ms"
              ? "Bersedia untuk Membina Kisah Kejayaan Anda?"
              : language === "ar"
              ? "هل أنت مستعد لبدء قصة نجاحك؟"
              : "Ready to Write Your Success Story?"}
          </h3>
          <p>
            {language === "ms"
              ? "Jadualkan ujian penempatan atau berunding dengan pasukan akademik kami di Pavilion Embassy Kuala Lumpur."
              : language === "ar"
              ? "احجز اختبار تحديد المستوى أو استشر فريقنا الأكاديمي في بافيليون إمباسي كوالالمبور."
              : "Schedule a placement test or consult with our academic team at Pavilion Embassy Kuala Lumpur."}
          </p>
        </div>
        <div className="bilc-cta-actions">
          <Link href="/contact" className="simple-button simple-button-quiet min-h-[44px]">
            {t("nav.contactUs")}
          </Link>
          <Link href="/enroll" className="simple-button min-h-[44px]">
            {t("nav.enrollNow")}
          </Link>
        </div>
      </div>
    </section>
  );
}


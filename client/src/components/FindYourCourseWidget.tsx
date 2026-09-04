import { ArrowRight, BookOpen, Compass, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/translations";

interface StepOption {
  id: string;
  label: Record<Language, string>;
  sublabel: Record<Language, string>;
  icon?: string;
}

export function FindYourCourseWidget({ onOpenPlacementTest, onOpenBooking }: { onOpenPlacementTest?: () => void; onOpenBooking?: (initialReason?: string) => void }) {
  const [step, setStep] = useState<number>(1);
  const [who, setWho] = useState<string>("");
  const [goal, setGoal] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const { t, language, isRTL } = useLanguage();

  const whoOptions: StepOption[] = [
    {
      id: "international",
      label: {
        en: "International Student",
        ms: "Pelajar Antarabangsa",
        ar: "طالب دولي",
      },
      sublabel: {
        en: "Planning to study in Malaysia with EMGS Visa",
        ms: "Merancang untuk belajar di Malaysia dengan Visa Pelajar EMGS",
        ar: "التخطيط للدراسة في ماليزيا مع تأشيرة طالب EMGS",
      },
      icon: "🌏",
    },
    {
      id: "adult",
      label: {
        en: "Adult Learner",
        ms: "Pelajar Dewasa",
        ar: "متعلم بالغ",
      },
      sublabel: {
        en: "Everyday fluency, confidence & lifestyle",
        ms: "Kelancaran harian, keyakinan dan gaya hidup",
        ar: "الطلاقة اليومية، الثقة بالنفس وأسلوب الحياة",
      },
      icon: "🎓",
    },
    {
      id: "professional",
      label: {
        en: "Corporate / Professional",
        ms: "Korporat / Profesional",
        ar: "شركات ومحترفون",
      },
      sublabel: {
        en: "Career advancement & executive communication",
        ms: "Kemajuan kerjaya & komunikasi eksekutif",
        ar: "التقدم الوظيفي والتواصل التنفيذي الاحترافي",
      },
      icon: "💼",
    },
    {
      id: "teen_child",
      label: {
        en: "Teen / Junior Learner",
        ms: "Remaja / Kanak-kanak",
        ar: "ناشئون ويافعون",
      },
      sublabel: {
        en: "School support & summer language camps",
        ms: "Sokongan sekolah & kem bahasa musim panas",
        ar: "دعم المناهج المدرسية والمخيمات اللغوية الصيفية",
      },
      icon: "🧸",
    },
  ];

  const goalOptions: StepOption[] = [
    {
      id: "ielts",
      label: {
        en: "IELTS Certification",
        ms: "Pensijilan IELTS",
        ar: "شهادة اختبار الآيلتس",
      },
      sublabel: {
        en: "Targeting Band 6.5 - 8.0 for University or Migration",
        ms: "Sasaran Band 6.5 - 8.0 untuk Universiti atau Imigresen",
        ar: "استهداف درجة 6.5 - 8.0 للدخول الجامعي أو الهجرة",
      },
      icon: "🎯",
    },
    {
      id: "fluency",
      label: {
        en: "General English Mastery",
        ms: "Penguasaan Bahasa Inggeris Umum",
        ar: "إتقان اللغة الإنجليزية العامة",
      },
      sublabel: {
        en: "Speaking, listening, grammar and real-world confidence",
        ms: "Pertuturan, pendengaran, tatabahasa dan keyakinan nyata",
        ar: "المحادثة، الاستماع، القواعد وبناء الثقة في التواصل الواقعي",
      },
      icon: "🗣️",
    },
    {
      id: "business",
      label: {
        en: "Executive Business English",
        ms: "Bahasa Inggeris Perniagaan Eksekutif",
        ar: "الإنجليزية للأعمال التنفيذية",
      },
      sublabel: {
        en: "Presentations, negotiations and corporate leadership",
        ms: "Persembahan, rundingan dan kepimpinan korporat",
        ar: "العروض التقديمية، التفاوض ومهارات القيادة الإدارية",
      },
      icon: "📈",
    },
    {
      id: "camp",
      label: {
        en: "Summer Camp / Short Course",
        ms: "Kem Musim Panas / Kursus Pendek",
        ar: "المخيم الصيفي / دورة قصيرة مكثفة",
      },
      sublabel: {
        en: "2–4 weeks intensive language & cultural exploration",
        ms: "2–4 minggu penerokaan bahasa & budaya intensif",
        ar: "2 إلى 4 أسابيع من تعلم اللغة المكثف والأنشطة الثقافية",
      },
      icon: "☀️",
    },
    {
      id: "world_lang",
      label: {
        en: "World Language (Mandarin / Malay / Arabic)",
        ms: "Bahasa Dunia (Mandarin / Melayu / Arab)",
        ar: "لغات عالمية (ماندارين / ملايو / عربي)",
      },
      sublabel: {
        en: "Learning a second global or regional language",
        ms: "Mempelajari bahasa global atau serantau kedua",
        ar: "تعلم لغة عالمية ثانية أو إقليمية مع متحدثين أصليين",
      },
      icon: "🌐",
    },
  ];

  const levelOptions: StepOption[] = [
    {
      id: "beginner",
      label: {
        en: "Complete Beginner (A1)",
        ms: "Pemula Lengkap (A1)",
        ar: "مبتدئ تماماً (A1)",
      },
      sublabel: {
        en: "Little to no prior English experience",
        ms: "Sedikit atau tiada pengalaman Bahasa Inggeris terdahulu",
        ar: "معرفة قليلة جداً أو بدون خبرة سابقة في اللغة الإنجليزية",
      },
      icon: "🌱",
    },
    {
      id: "elementary",
      label: {
        en: "Elementary (A2)",
        ms: "Tahap Asas (A2)",
        ar: "تأسيسي (A2)",
      },
      sublabel: {
        en: "Understand basic phrases, need speaking practice",
        ms: "Faham frasa asas, perlukan latihan bertutur",
        ar: "فهم العبارات البسيطة مع الحاجة للتدريب على التحدث",
      },
      icon: "🌿",
    },
    {
      id: "intermediate",
      label: {
        en: "Intermediate (B1–B2)",
        ms: "Pertengahan (B1–B2)",
        ar: "متوسط (B1–B2)",
      },
      sublabel: {
        en: "Good foundation, want natural fluency and precision",
        ms: "Asas kukuh, inginkan kelancaran semula jadi & ketepatan",
        ar: "أساس متين، والهدف طلاقة طبيعية ودقة لغوية أعلى",
      },
      icon: "🌳",
    },
    {
      id: "advanced",
      label: {
        en: "Upper-Intermediate / Advanced (C1)",
        ms: "Pertengahan Atas / Lanjutan (C1)",
        ar: "فوق المتوسط / متقدم (C1)",
      },
      sublabel: {
        en: "Refining nuanced academic or professional style",
        ms: "Memperhalusi gaya akademik atau profesional yang bernuansa",
        ar: "صقل الأسلوب الأكاديمي والمهني المتقدم والتعبيرات المعقدة",
      },
      icon: "⭐",
    },
    {
      id: "not_sure",
      label: {
        en: "Not sure / Need assessment",
        ms: "Tidak pasti / Perlu penilaian",
        ar: "غير متأكد / أحتاج تقييماً",
      },
      sublabel: {
        en: "Take our free 3-minute placement evaluation",
        ms: "Ambil penilaian penempatan percuma 3 minit kami",
        ar: "خوض اختبار تحديد المستوى السريع في 3 دقائق",
      },
      icon: "❓",
    },
  ];

  const handleReset = () => {
    setStep(1);
    setWho("");
    setGoal("");
    setLevel("");
  };

  // Determine Recommendation based on selections
  const getRecommendation = () => {
    if (goal === "ielts") {
      return {
        title: language === "ms" ? "Persediaan IELTS (Intensif atau Ekspres)" : language === "ar" ? "التحضير لاختبار الآيلتس (مكثف أو سريع)" : "IELTS Preparation (Intensive or Express)",
        category: language === "ms" ? "Akademik & Persediaan Peperiksaan" : language === "ar" ? "الأكاديمية والتحضير للاختبارات" : "Academic & Exam Preparation",
        description: language === "ms" ? "Bimbingan komprehensif merangkumi Mendengar, Membaca, Menulis dan Bertutur dengan peperiksaan percubaan rasmi." : language === "ar" ? "تدريب شامل يغطي مهارات الاستماع والقراءة والكتابة والمحادثة مع اختبارات تجريبية مطابقة ورعاية أكاديمية مركزة." : "Comprehensive coaching covering Listening, Reading, Writing and Speaking with authentic mock exams and score guarantees.",
        tuition: "RM 3,500 – RM 9,900",
        duration: language === "ms" ? "4 hingga 12 Minggu (40 - 120 Jam)" : language === "ar" ? "4 إلى 12 أسبوعاً (40 - 120 ساعة)" : "4 to 12 Weeks (40 - 120 Hours)",
        highlight: language === "ms" ? "Termasuk Ujian Penempatan Rasmi, Penilaian Diagnostik & Buku Teks" : language === "ar" ? "يشمل اختبار تحديد المستوى الرسمي والتقييم التشخيصي والمواد التعليمية" : "Includes Official Placement Test, Diagnostic Assessment & Materials",
        slug: "ielts-preparation",
      };
    }
    if (goal === "business" || who === "professional") {
      return {
        title: language === "ms" ? "Bahasa Inggeris Eksekutif & Komunikasi Perniagaan" : language === "ar" ? "اللغة الإنجليزية التنفيذية وتواصل الأعمال" : "Executive English & Business Communication",
        category: language === "ms" ? "Program Eksekutif" : language === "ar" ? "البرامج التنفيذية" : "Executive Programs",
        description: language === "ms" ? "Disesuaikan untuk profesional korporat dan diplomat. Kuasai pembentangan perniagaan, rundingan dan etika profesional." : language === "ar" ? "مصمم خصيصاً للمدراء والمهنيين والدبلوماسيين. إتقان العروض التقديمية وقيادة الاجتماعات وإتيكيت المراسلات والتفاوض." : "Tailored for professionals and diplomats. Master business presentations, meeting leadership, email etiquette, and negotiation rhetoric.",
        tuition: "RM 3,800 – RM 6,600",
        duration: language === "ms" ? "1 hingga 2 Bulan" : language === "ar" ? "1 إلى 2 شهر" : "1 to 2 Months",
        highlight: language === "ms" ? "Akses Lounge Eksekutif Peribadi di Pavilion Embassy" : language === "ar" ? "دخول حصري إلى صالة رجال الأعمال التنفيذية في بافيليون إمباسي" : "Private Executive Lounge Access at Pavilion Embassy",
        slug: "business-english",
      };
    }
    if (goal === "camp" || who === "teen_child") {
      return {
        title: language === "ms" ? "Kem Musim Panas Antarabangsa / Bahasa Inggeris Junior" : language === "ar" ? "المخيم الصيفي الدولي / الإنجليزية لليافعين" : "International Summer Camp / Junior English",
        category: language === "ms" ? "Kem Belia & Musim Panas" : language === "ar" ? "مخيمات الشباب والصيف" : "Youth & Summer Camps",
        description: language === "ms" ? "Pembelajaran interaktif penuh bertenaga digabungkan dengan lawatan budaya KL, bengkel kepimpinan dan sijil tamat kursus." : language === "ar" ? "تعليم تفاعلي مليء بالحيوية مدمج بجولات ثقافية في كوالالمبور وورش عمل قيادية وشهادات تخرج معتمدة." : "High-energy interactive learning paired with KL cultural excursions, leadership workshops, and certified graduation.",
        tuition: "RM 4,400 – RM 7,600",
        duration: language === "ms" ? "2 hingga 4 Minggu" : language === "ar" ? "2 إلى 4 أسابيع" : "2 to 4 Weeks",
        highlight: language === "ms" ? "Termasuk Kelas Bahasa Inggeris, Lawatan Aktiviti, Bahan & Sijil" : language === "ar" ? "يشمل الدروس اللغوية والرحلات الترفيهية والمواد والشهادات" : "Includes English Classes, Activity Trips, Materials & Certificates",
        slug: "kids-english",
      };
    }
    if (goal === "world_lang") {
      return {
        title: language === "ms" ? "Bahasa Dunia (Mandarin / Melayu / Arab / Jepun)" : language === "ar" ? "اللغات العالمية (الماندارين / الملايو / العربية / اليابانية)" : "World Languages (Mandarin / Malay / Arabic / Japanese)",
        category: language === "ms" ? "Program Bahasa Asing" : language === "ar" ? "برامج اللغات الأجنبية" : "Foreign Language Programs",
        description: language === "ms" ? "Pembelajaran bahasa secara mendalam yang disampaikan oleh pengajar penutur jati. Pelajari kelancaran perbualan dan tatabahasa." : language === "ar" ? "تعليم لغوي غامر يقدمه أساتذة من المتحدثين الأصليين. اكتساب طلاقة المحادثة والتعمق الثقافي والقواعد." : "Immersive language learning delivered by native instructors. Learn conversational fluency, cultural nuances, and grammar.",
        tuition: language === "ms" ? "Panduan yuran atas pertanyaan" : language === "ar" ? "الرسوم حسب البرنامج عند الاستفسار" : "Fee guidance on enquiry",
        duration: language === "ms" ? "Modul fleksibel" : language === "ar" ? "وحدات دراسية مرنة" : "Flexible modules",
        highlight: language === "ms" ? "Format interaktif 1-dengan-1 VIP atau kumpulan kecil" : language === "ar" ? "تدريب فردي خاص (VIP) أو مجموعات صغيرة تفاعلية" : "1-on-1 VIP or small group interactive formats",
        slug: "mandarin",
      };
    }
    // Default / General English
    if (who === "international") {
      return {
        title: language === "ms" ? "Bahasa Inggeris Umum Jangka Panjang (Intensif 5 Hari/Seminggu)" : language === "ar" ? "برنامج اللغة الإنجليزية العامة طويل الأمد (مكثف 5 أيام/أسبوع)" : "Long-Term General English (Intensive 5 Days/Week)",
        category: language === "ms" ? "Bahasa Inggeris Intensif Sepenuh Masa" : language === "ar" ? "برنامج مكثف بدوام كامل" : "Full-Time Intensive English",
        description: language === "ms" ? "Laluan imersif terulung untuk pelajar antarabangsa di Kuala Lumpur dengan sokongan visa pelajar rasmi EMGS." : language === "ar" ? "المسار الأفضل للدراسة بدوام كامل للطلاب الدوليين في كوالالمبور مع دعم تأشيرة الطالب المعتمدة من EMGS." : "The premier full-time immersive pathway for international students in Kuala Lumpur with official EMGS student visa support.",
        tuition: "RM 7,900 (3 Mos) · RM 14,100 (6 Mos) · RM 23,400 (12 Mos)",
        duration: language === "ms" ? "3, 6, 9 atau 12 Bulan" : language === "ar" ? "3، 6، 9 أو 12 شهراً" : "3, 6, 9 or 12 Months",
        highlight: language === "ms" ? "Sokongan Penuh Pemprosesan Visa + Pengambilan VIP Lapangan Terbang KLIA" : language === "ar" ? "دعم كامل لمعاملات التأشيرة + خدمة استقبال VIP من مطار كوالالمبور" : "Full Visa Processing Support + KLIA Airport VIP Pickup",
        slug: "general-english",
      };
    }
    return {
      title: language === "ms" ? "Penguasaan Bahasa Inggeris Umum (Keyakinan & Kelancaran)" : language === "ar" ? "إتقان الإنجليزية العامة (الثقة والطلاقة)" : "General English Mastery (Confidence & Fluency)",
      category: language === "ms" ? "Komunikasi Bahasa Inggeris" : language === "ar" ? "التواصل باللغة الإنجليزية" : "English Communication",
      description: language === "ms" ? "Bina asas pertuturan, pendengaran dan tatabahasa yang kukuh di bilik darjah pintar Pavilion Embassy kami." : language === "ar" ? "بناء أساس متين في التحدث والاستماع والقواعد داخل فصولنا الذكية في بافيليون إمباسي." : "Build strong speaking, listening, and grammar foundations in our boutique Pavilion Embassy smart classrooms.",
      tuition: language === "ms" ? "Daripada RM 2,950 / Bulan" : language === "ar" ? "ابتداءً من 2,950 رينغيت / شهرياً" : "From RM 2,950 / Month",
      duration: language === "ms" ? "1 hingga 12 Bulan" : language === "ar" ? "1 إلى 12 شهراً" : "1 to 12 Months",
      highlight: language === "ms" ? "Kelas bersaiz kecil & metodologi pengajaran komunikatif" : language === "ar" ? "فصول بأعداد محدودة ومنهجية تدريس تفاعلية حديثة" : "Small classes & communicative teaching methodology",
      slug: "general-english",
    };
  };

  const rec = getRecommendation();

  return (
    <section className={`bilc-finder-section ${isRTL ? "is-rtl" : ""}`} id="find-your-course">
      <div className="bilc-finder-header">
        <div className="bilc-finder-tag">
          <Compass size={16} />
          <span>
            {language === "ms"
              ? "Panduan Interaktif Kursus"
              : language === "ar"
              ? "المستشار التفاعلي لاختيار الدورة"
              : "Interactive Guidance · Course Matcher"}
          </span>
        </div>
        <h2>
          {language === "ms"
            ? "Cari Kursus Anda yang Disyorkan dalam 30 Saat."
            : language === "ar"
            ? "اعثر على دورتك الموصى بها في 30 ثانية فقط."
            : "Find Your Recommended Course in 30 Seconds."}
        </h2>
        <p>
          {language === "ms"
            ? "Tidak pasti program mana yang sesuai dengan matlamat dan jadual anda? Jawab 3 soalan ringkas untuk menerima cadangan diperibadikan."
            : language === "ar"
            ? "لست متأكداً أي البرامج تناسب أهدافك وجدولك الزمني؟ أجب عن 3 أسئلة سريعة للحصول على توصية مخصصة بناءً على مناهجنا لعام 2026."
            : "Not sure which programme matches your goals and schedule? Answer 3 quick questions to receive a personalised recommendation based on our official 2026 curriculum."}
        </p>
      </div>

      <div className="bilc-finder-card">
        {/* Progress Bar */}
        <div className="bilc-finder-progress-bar">
          <div className="bilc-progress-track">
            <div className="bilc-progress-fill" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
          <div className="bilc-progress-labels">
            <span className={step >= 1 ? "is-active" : ""}>
              <span className="bilc-step-num">1</span>
              <span className="bilc-step-dot-text">{language === "ms" ? ". Profil Pelajar" : language === "ar" ? ". ملف المتعلم" : ". Learner Profile"}</span>
            </span>
            <span className={step >= 2 ? "is-active" : ""}>
              <span className="bilc-step-num">2</span>
              <span className="bilc-step-dot-text">{language === "ms" ? ". Matlamat Utama" : language === "ar" ? ". الهدف الأساسي" : ". Target Goal"}</span>
            </span>
            <span className={step >= 3 ? "is-active" : ""}>
              <span className="bilc-step-num">3</span>
              <span className="bilc-step-dot-text">{language === "ms" ? ". Tahap Semasa" : language === "ar" ? ". المستوى الحالي" : ". Current Level"}</span>
            </span>
            <span className={step === 4 ? "is-active" : ""}>
              <span className="bilc-step-num">4</span>
              <span className="bilc-step-dot-text">{language === "ms" ? ". Cadangan Kursus" : language === "ar" ? ". التوصية المخصصة" : ". Recommendation"}</span>
            </span>
          </div>
        </div>

        {/* Step 1: Who are you? */}
        {step === 1 && (
          <div className="bilc-finder-step-body">
            <h3>{language === "ms" ? "Langkah 1: Untuk siapa kursus ini?" : language === "ar" ? "الخطوة 1: لمن هذه الدورة التدريبية؟" : "Step 1: Who is this course for?"}</h3>
            <p className="bilc-step-subtitle">
              {language === "ms"
                ? "Pilih kategori pelajar anda untuk menyesuaikan kurikulum dan bantuan visa:"
                : language === "ar"
                ? "حدد فئة المتعلم لتخصيص خطة المنهج والدعم الأكاديمي والتأشيرة:"
                : "Select your learner category to tailor the curriculum and visa assistance:"}
            </p>
            <div className="bilc-options-grid">
              {whoOptions.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  className={`bilc-option-card ${who === opt.id ? "is-selected" : ""}`}
                  onClick={() => {
                    setWho(opt.id);
                    setStep(2);
                  }}
                >
                  <span className="bilc-opt-icon">{opt.icon}</span>
                  <div className="bilc-opt-text">
                    <strong>{opt.label[language] || opt.label.en}</strong>
                    <span>{opt.sublabel[language] || opt.sublabel.en}</span>
                  </div>
                  <ArrowRight size={16} className={`bilc-opt-arrow ${isRTL ? "rotate-180" : ""}`} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: What is your primary goal? */}
        {step === 2 && (
          <div className="bilc-finder-step-body">
            <div className="flex items-center justify-between">
              <h3>{language === "ms" ? "Langkah 2: Apakah matlamat utama anda?" : language === "ar" ? "الخطوة 2: ما هو هدفك الأساسي؟" : "Step 2: What is your primary objective?"}</h3>
              <button type="button" className="bilc-back-btn" onClick={() => setStep(1)}>
                {language === "ms" ? "← Kembali" : language === "ar" ? "→ السابق" : "← Back"}
              </button>
            </div>
            <p className="bilc-step-subtitle">
              {language === "ms"
                ? "Apa yang ingin anda capai di Bilingual Idol Language Centre?"
                : language === "ar"
                ? "ما الذي ترغب في تحقيقه في معهد بايلينجوال آيدول؟"
                : "What would you like to accomplish at Bilingual Idol?"}
            </p>
            <div className="bilc-options-grid">
              {goalOptions.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  className={`bilc-option-card ${goal === opt.id ? "is-selected" : ""}`}
                  onClick={() => {
                    setGoal(opt.id);
                    setStep(3);
                  }}
                >
                  <span className="bilc-opt-icon">{opt.icon}</span>
                  <div className="bilc-opt-text">
                    <strong>{opt.label[language] || opt.label.en}</strong>
                    <span>{opt.sublabel[language] || opt.sublabel.en}</span>
                  </div>
                  <ArrowRight size={16} className={`bilc-opt-arrow ${isRTL ? "rotate-180" : ""}`} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: What is your estimated level? */}
        {step === 3 && (
          <div className="bilc-finder-step-body">
            <div className="flex items-center justify-between">
              <h3>{language === "ms" ? "Langkah 3: Apakah tahap Bahasa Inggeris anda sekarang?" : language === "ar" ? "الخطوة 3: ما هو مستواك الحالي في اللغة الإنجليزية؟" : "Step 3: What is your current English level?"}</h3>
              <button type="button" className="bilc-back-btn" onClick={() => setStep(2)}>
                {language === "ms" ? "← Kembali" : language === "ar" ? "→ السابق" : "← Back"}
              </button>
            </div>
            <p className="bilc-step-subtitle">
              {language === "ms"
                ? "Anggaran membantu kami mengesyorkan modul permulaan dan tarikh kemasukan terbaik:"
                : language === "ar"
                ? "يساعدنا التقدير في اقتراح الوحدة الدراسية المثالية وتاريخ البدء المناسب:"
                : "An estimate helps us recommend the optimal starting module and intake date:"}
            </p>
            <div className="bilc-options-grid">
              {levelOptions.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  className={`bilc-option-card ${level === opt.id ? "is-selected" : ""}`}
                  onClick={() => {
                    setLevel(opt.id);
                    setStep(4);
                  }}
                >
                  <span className="bilc-opt-icon">{opt.icon}</span>
                  <div className="bilc-opt-text">
                    <strong>{opt.label[language] || opt.label.en}</strong>
                    <span>{opt.sublabel[language] || opt.sublabel.en}</span>
                  </div>
                  <ArrowRight size={16} className={`bilc-opt-arrow ${isRTL ? "rotate-180" : ""}`} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Result / Recommendation */}
        {step === 4 && (
          <div className="bilc-finder-result-body">
            <div className="bilc-result-badge-row">
              <span className="bilc-rec-tag">{language === "ms" ? "Disyorkan untuk anda" : language === "ar" ? "موصى به لك خصيصاً" : "Recommended for you"}</span>
              <span className="bilc-intake-tag">{language === "ms" ? "Kemasukan Ogos / September 2026 Dibuka" : language === "ar" ? "القبول مفتوح لدفعة أغسطس / سبتمبر 2026" : "August / September 2026 Intake Open"}</span>
            </div>

            <div className="bilc-result-content">
              <div className="bilc-result-main">
                <span className="bilc-result-cat">{rec.category}</span>
                <h2>{rec.title}</h2>
                <p className="bilc-result-desc">{rec.description}</p>

                <div className="bilc-result-meta-grid">
                  <div className="bilc-meta-box">
                    <span>{language === "ms" ? "Tempoh Pengajian" : language === "ar" ? "مدة الدراسة" : "Duration"}</span>
                    <strong>{rec.duration}</strong>
                  </div>
                  <div className="bilc-meta-box">
                    <span>{language === "ms" ? "Yuran Rasmi" : language === "ar" ? "الرسوم الرسمية" : "Official Tuition"}</span>
                    <strong>{rec.tuition}</strong>
                  </div>
                  <div className="bilc-meta-box">
                    <span>{language === "ms" ? "Ciri Utama" : language === "ar" ? "أبرز المزايا" : "Key Highlight"}</span>
                    <strong>{rec.highlight}</strong>
                  </div>
                </div>

                <div className="bilc-result-actions">
                  <Link href={`/programs/${rec.slug}`} className="simple-button">
                    {language === "ms" ? "Lihat Butiran Kursus" : language === "ar" ? "تفاصيل البرنامج" : "View Course Details"} <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
                  </Link>

                  {onOpenPlacementTest && (
                    <button
                      type="button"
                      className="simple-button simple-button-quiet"
                      onClick={onOpenPlacementTest}
                    >
                      <Sparkles size={16} /> {language === "ms" ? "Ambil Ujian Penempatan Percuma" : language === "ar" ? "اختبار تحديد المستوى المجاني" : "Take Free Placement Test"}
                    </button>
                  )}

                  {onOpenBooking && (
                    <button
                      type="button"
                      className="simple-button simple-button-quiet whitespace-nowrap"
                      onClick={() => onOpenBooking(rec.title)}
                    >
                      <BookOpen size={16} />{" "}
                      {language === "ms"
                        ? "Tempah Lawatan Kampus"
                        : language === "ar"
                        ? "حجز جولة في الحرم الجامعي"
                        : t("nav.bookTour", undefined, "Book Campus Tour")}
                    </button>
                  )}

                  <a
                    href={`https://wa.me/60367310449?text=${encodeURIComponent(`Hello Bilingual Idol, I used your Course Finder and would like information about: ${rec.title} (${rec.tuition}).`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bilc-wa-direct-btn"
                  >
                    💬 {language === "ms" ? "WhatsApp Penasihat" : language === "ar" ? "مستشار واتساب" : "WhatsApp Advisor"}
                  </a>
                </div>
              </div>

              <div className="bilc-result-sidebar">
                <div className="bilc-recap-box">
                  <h4>{language === "ms" ? "Pilihan Anda:" : language === "ar" ? "خياراتك المحددة:" : "Your Selections:"}</h4>
                  <ul>
                    <li>
                      <span>{language === "ms" ? "Profil:" : language === "ar" ? "الملف:" : "Profile:"}</span>{" "}
                      <strong>
                        {whoOptions.find(o => o.id === who)?.label[language] || whoOptions.find(o => o.id === who)?.label.en || "Learner"}
                      </strong>
                    </li>
                    <li>
                      <span>{language === "ms" ? "Matlamat:" : language === "ar" ? "الهدف:" : "Goal:"}</span>{" "}
                      <strong>
                        {goalOptions.find(o => o.id === goal)?.label[language] || goalOptions.find(o => o.id === goal)?.label.en || "Fluency"}
                      </strong>
                    </li>
                    <li>
                      <span>{language === "ms" ? "Tahap:" : language === "ar" ? "المستوى:" : "Level:"}</span>{" "}
                      <strong>
                        {levelOptions.find(o => o.id === level)?.label[language] || levelOptions.find(o => o.id === level)?.label.en || "To be evaluated"}
                      </strong>
                    </li>
                  </ul>
                  <button type="button" className="bilc-restart-btn" onClick={handleReset}>
                    <RefreshCw size={14} /> {language === "ms" ? "Mula Semula" : language === "ar" ? "إعادة البدء" : "Start Over"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


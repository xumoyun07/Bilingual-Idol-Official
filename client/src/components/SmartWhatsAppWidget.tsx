import { X } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/translations";

interface WhatsAppTopic {
  id: string;
  icon: string;
  titles: Record<Language, string>;
  descs: Record<Language, string>;
  msgs: Record<Language, string>;
}

const WHATSAPP_TOPICS: WhatsAppTopic[] = [
  {
    id: "general",
    icon: "📚",
    titles: {
      en: "Course & 2026 Price Enquiry",
      ms: "Pertanyaan Kursus & Yuran 2026",
      ar: "استفسار عن الدورات وأسعار 2026",
    },
    descs: {
      en: "Ask about tuition fees, timetables and course catalogs",
      ms: "Tanya tentang yuran pengajian, jadual & katalog kursus",
      ar: "استفسر عن الرسوم والجداول الدراسية وكتالوج البرامج",
    },
    msgs: {
      en: "Hello Bilingual Idol, I would like to inquire about your 2026 courses, fees, and schedule at Pavilion Embassy.",
      ms: "Salam Bilingual Idol, saya ingin bertanya mengenai kursus, yuran dan jadual 2026 di Pavilion Embassy.",
      ar: "مرحباً بايلينجوال آيدول، أود الاستفسار عن دورات 2026 والرسوم وجداول الحصص في بافيليون إمباسي.",
    },
  },
  {
    id: "international",
    icon: "✈️",
    titles: {
      en: "International Student & Visa",
      ms: "Pelajar Antarabangsa & Visa",
      ar: "شؤون الطلاب الدوليين والفيزا",
    },
    descs: {
      en: "EMGS student visa support, accommodation & airport transfer",
      ms: "Sokongan visa pelajar EMGS, penginapan & ketibaan",
      ar: "دعم تأشيرة EMGS والسكن الجامعي والاستقبال من المطار",
    },
    msgs: {
      en: "Hello! I am an international student planning to study English at Bilingual Idol Malaysia. I would like details about EMGS visas and enrolment.",
      ms: "Hai! Saya seorang pelajar antarabangsa yang merancang untuk belajar Bahasa Inggeris di Bilingual Idol Malaysia. Saya ingin maklumat lanjut tentang visa EMGS.",
      ar: "مرحباً! أنا طالب دولي أخطط لدراسة اللغة الإنجليزية في بايلينجوال آيدول ماليزيا. أود معرفة تفاصيل فيزا EMGS وإجراءات القبول.",
    },
  },
  {
    id: "ielts",
    icon: "🎯",
    titles: {
      en: "IELTS Preparation Coaching",
      ms: "Bimbingan Persediaan IELTS",
      ar: "دورات التحضير لاختبار الآيلتس",
    },
    descs: {
      en: "Express 4w, Intensive 8w, Premium 12w coaching",
      ms: "Pakej Ekspres 4 minggu, Intensif 8 minggu, Premium 12 minggu",
      ar: "باقات مكثفة 4، 8، و12 أسبوعاً مع تدريب امتحاني مباشر",
    },
    msgs: {
      en: "Hello Bilingual Idol! I want to prepare for the IELTS exam. Please share details regarding your upcoming IELTS intakes and diagnostic test.",
      ms: "Hai Bilingual Idol! Saya ingin membuat persediaan untuk peperiksaan IELTS. Sila kongsikan maklumat pengambilan terdekat dan ujian diagnostik.",
      ar: "مرحباً بايلينجوال آيدول! أود التحضير لاختبار الآيلتس. يرجى تزويدي بمواعيد الدورات القادمة واختبار تحديد المستوى.",
    },
  },
  {
    id: "camp",
    icon: "☀️",
    titles: {
      en: "Summer Camps & Kids Programs",
      ms: "Kem Musim Panas & Program Kanak-kanak",
      ar: "المخيمات الصيفية وبرامج الصغار",
    },
    descs: {
      en: "Junior English, International Camp & Leadership Programs",
      ms: "Bahasa Inggeris Junior, Kem Antarabangsa & Kepimpinan",
      ar: "إنجليزية للصغار، مخيمات دولية وبرامج قيادية",
    },
    msgs: {
      en: "Hello! I would like information about the upcoming Summer Camps and youth programmes at Bilingual Idol.",
      ms: "Hai! Saya ingin maklumat mengenai Kem Musim Panas dan program belia yang akan datang di Bilingual Idol.",
      ar: "مرحباً! أود الحصول على معلومات حول المخيمات الصيفية القادمة وبرامج الشباب في بايلينجوال آيدول.",
    },
  },
  {
    id: "placement",
    icon: "📝",
    titles: {
      en: "Book Free Placement Test",
      ms: "Tempah Ujian Penempatan Percuma",
      ar: "حجز اختبار تحديد مستوى مجاني",
    },
    descs: {
      en: "Schedule a diagnostic test in person or via Zoom",
      ms: "Jadualkan ujian diagnostik secara bersemuka atau melalui Zoom",
      ar: "حدد موعداً للاختبار حضورياً أو عبر تطبيق زووم",
    },
    msgs: {
      en: "Hello Admissions, I would like to schedule a free Placement Test to evaluate my English level.",
      ms: "Salam Pegawai Kemasukan, saya ingin menjadualkan Ujian Penempatan percuma untuk menilai tahap Bahasa Inggeris saya.",
      ar: "مرحباً قسم القبول، أود حجز موعد لاختبار تحديد المستوى المجاني لتقييم لغتي الإنجليزية.",
    },
  },
];

function WhatsAppIcon({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="bilc-wa-icon"
    >
      <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.276-.1-.476-.15-.677.15-.2.301-.777.979-.953 1.18-.175.2-.351.225-.652.075-.301-.15-1.27-.468-2.42-1.493-.894-.798-1.498-1.784-1.674-2.085-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.2-.301.301-.502.1-.2.05-.376-.025-.526-.075-.15-.677-1.632-.928-2.235-.245-.588-.494-.508-.677-.518-.175-.008-.376-.01-.577-.01-.2 0-.527.075-.803.376s-1.054 1.03-1.054 2.511c0 1.482 1.079 2.911 1.23 3.112.15.2 2.124 3.244 5.145 4.549.718.311 1.279.497 1.716.636.722.23 1.379.197 1.898.12.579-.086 1.78-.727 2.03-1.43.251-.703.251-1.305.176-1.43-.075-.126-.276-.201-.577-.351z" />
      <path d="M12.004 2c-5.518 0-9.996 4.478-9.996 9.996 0 1.764.46 3.486 1.334 5.004L2 22l5.13-1.308c1.472.802 3.13 1.228 4.874 1.228 5.518 0 9.996-4.478 9.996-9.996S17.522 2 12.004 2zm0 18.258c-1.503 0-2.975-.405-4.256-1.171l-.305-.181-3.045.776.812-2.968-.198-.316c-.84-1.338-1.284-2.889-1.284-4.398 0-4.553 3.705-8.258 8.276-8.258 4.571 0 8.276 3.705 8.276 8.258 0 4.553-3.705 8.258-8.276 8.258z" />
    </svg>
  );
}

export function SmartWhatsAppWidget() {
  const { language, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChat = (message: string) => {
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/60367310449?text=${encoded}`;
    window.open(url, "_blank", "noreferrer");
    setIsOpen(false);
  };

  return (
    <div className={`bilc-wa-floating-dock ${isRTL ? "is-rtl" : ""}`}>
      {isOpen && (
        <div className="bilc-wa-popup" role="dialog" aria-label="Smart WhatsApp Chat Selection">
          <div className="bilc-wa-popup-header">
            <div className="flex items-center gap-2">
              <div className="bilc-wa-avatar">
                <WhatsAppIcon size={18} />
              </div>
              <div>
                <strong>
                  {language === "ms"
                    ? "Kemasukan Bilingual Idol"
                    : language === "ar"
                    ? "قسم القبول والتسجيل"
                    : "Bilingual Idol Admissions"}
                </strong>
                <p>
                  {language === "ms"
                    ? "Pavilion Embassy · Membalas dalam beberapa minit"
                    : language === "ar"
                    ? "بافيليون إمباسي · الرد عادة خلال دقائق"
                    : "Pavilion Embassy · Typically replies within minutes"}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="bilc-wa-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label={language === "ar" ? "إغلاق قائمة الواتساب" : language === "ms" ? "Tutup Menu WhatsApp" : "Close WhatsApp Menu"}
            >
              <X size={18} />
            </button>
          </div>

          <div className="bilc-wa-popup-body">
            <p className="bilc-wa-prompt">
              {language === "ms"
                ? "Bagaimanakah pasukan kemasukan kami boleh membantu anda hari ini?"
                : language === "ar"
                ? "كيف يمكن لفريق القبول مساعدتك اليوم؟"
                : "How can our admissions team assist you today?"}
            </p>
            <div className="bilc-wa-topics-list">
              {WHATSAPP_TOPICS.map(topic => {
                const topicTitle = topic.titles[language] || topic.titles.en;
                const topicDesc = topic.descs[language] || topic.descs.en;
                const topicMsg = topic.msgs[language] || topic.msgs.en;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    className="bilc-wa-topic-item"
                    onClick={() => handleOpenChat(topicMsg)}
                  >
                    <span className="bilc-topic-emoji">{topic.icon}</span>
                    <div className="bilc-topic-copy">
                      <strong>{topicTitle}</strong>
                      <span>{topicDesc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bilc-wa-popup-footer">
            <span>Direct WhatsApp: +60 3-6731 0449</span>
          </div>
        </div>
      )}

      <button
        type="button"
        className={`bilc-wa-trigger-btn ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={language === "ar" ? "تواصل معنا عبر واتساب" : language === "ms" ? "Hubungi kami melalui WhatsApp" : "Chat with Bilingual Idol on WhatsApp"}
        title={language === "ar" ? "تواصل عبر واتساب" : language === "ms" ? "WhatsApp Kemasukan" : "Chat with Admissions on WhatsApp"}
      >
        <span className="bilc-wa-glow-halo" aria-hidden="true" />
        {isOpen ? (
          <X size={24} className="bilc-wa-icon" />
        ) : (
          <WhatsAppIcon size={28} />
        )}
      </button>
    </div>
  );
}


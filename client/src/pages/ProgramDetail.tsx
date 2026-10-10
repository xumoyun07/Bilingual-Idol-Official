import { ArrowLeft, ArrowRight, CalendarClock, Clock3, GraduationCap, Landmark, WalletCards } from "lucide-react";
import { Link, useRoute } from "wouter";
import { PublicLayout } from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { languageLabel } from "@/lib/enumLabels";

const programImageBySlug: Record<string, string> = {
  "general-english": "/media/prog_general_english.webp",
  "kids-english": "/media/prog_kids_english.webp",
  "speaking-conversation": "/media/prog_speaking.webp",
  "ielts-preparation": "/media/prog_ielts.webp",
  "bahasa-melayu": "/media/prog_world_languages.webp",
  "mandarin": "/media/prog_world_languages.webp",
  "arabic": "/media/prog_world_languages.webp",
  "japanese": "/media/prog_world_languages.webp",
  "korean": "/media/prog_world_languages.webp",
  "business-english": "/media/prog_business.webp",
};

export default function ProgramDetail() {
  const [, params] = useRoute("/programs/:slug");
  const { t, isRTL, language, seedText } = useLanguage();
  const record = trpc.content.publicProgram.useQuery({ slug: params?.slug ?? "" }, { enabled: Boolean(params?.slug) });
  const media = trpc.media.publicList.useQuery();
  const detailMedia = (media.data ?? []).find(item => item.slot === "programme_detail");

  if (record.isLoading) {
    return (
      <PublicLayout>
        <div className="simple-route-page simple-route-section">
          <div className="simple-loading-row" />
        </div>
      </PublicLayout>
    );
  }

  const programme = record.data;
  if (!programme) {
    return (
      <PublicLayout>
        <div className={`simple-route-page simple-route-section ${isRTL ? "is-rtl" : ""}`}>
          <div className="simple-empty-state">
            <p>{language === "ms" ? "Maklumat program belum tersedia." : language === "ar" ? "تفاصيل البرنامج غير متوفرة حالياً." : "Programme details are not available yet."}</p>
            <Link href="/programs" className="simple-text-link">
              <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} /> {language === "ms" ? "Kembali ke senarai program" : language === "ar" ? "العودة للبرامج" : "Back to programmes"}
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Перевод контента из БД: seed.programs.<slug>.<поле>.
  // Никаких регулярных выражений — если перевода нет, показывается английский оригинал.
  const seedSlug = params?.slug ?? programme.slug;
  const seedValue = (field: string, fallback: string) => seedText(["programs", seedSlug, field], fallback);
  /** Перевод технических enum-значений (category, language): сырое значение
   *  остаётся для логики, на экран идёт подпись из локалей. */
  const enumT = (key: string, fallback: string) => t(key, undefined, fallback);

  const facts = [
    { icon: GraduationCap, label: language === "ms" ? "Kumpulan Sasaran" : language === "ar" ? "الفئة العمرية" : "Learner group", value: seedValue("ageGroup", programme.ageGroup) },
    { icon: Landmark, label: language === "ms" ? "Tahap" : language === "ar" ? "المستوى" : "Level", value: seedValue("level", programme.level) },
    { icon: Clock3, label: language === "ms" ? "Tempoh" : language === "ar" ? "المدة" : "Duration", value: seedValue("duration", programme.duration) },
    { icon: CalendarClock, label: language === "ms" ? "Jadual" : language === "ar" ? "الجدول" : "Schedule", value: seedValue("schedule", programme.schedule) },
    { icon: WalletCards, label: language === "ms" ? "Yuran" : language === "ar" ? "الرسوم" : "Fees", value: seedValue("fees", programme.fees) },
  ];

  const bannerImageSrc = (params?.slug && programImageBySlug[params.slug]) || detailMedia?.publicUrl || "/media/prog_speaking.webp";
  const bannerImageAlt = detailMedia?.altText || `${programme.title} learning sessions at Bilingual Idol`;

  return (
    <PublicLayout>
      <div id="program-detail-page-container" data-page="program-detail" className={`simple-route-page program-detail-page page-program-detail pb-20 md:pb-0 ${isRTL ? "is-rtl" : ""}`}>
        <header id="program-detail-hero-header" className="simple-route-header simple-route-header--programmes simple-route-header--program-detail">
          <div className="simple-route-header-copy">
            <Link href="/programs" className="simple-text-link">
              <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} /> {language === "ms" ? "Semua program" : language === "ar" ? "جميع البرامج" : "All programmes"}
            </Link>
            <p className="simple-eyebrow mt-4">{languageLabel(programme.language, enumT)} {language === "ms" ? "Program" : language === "ar" ? "برنامج" : "programme"}</p>
            <h1>{seedValue("title", programme.title)}</h1>
            <p className="simple-route-header-description">{seedValue("description", programme.description)}</p>
          </div>
          <div className="simple-route-header-media" aria-label={language === "ar" ? `صورة ${programme.title}` : language === "ms" ? `Gambar ${programme.title}` : `${programme.title} photo`}>
            <img src={bannerImageSrc} alt={bannerImageAlt} loading="lazy" decoding="async" />
          </div>
        </header>

        <section id="program-detail-layout-section" className="simple-route-section simple-detail-layout hidden md:grid">
          <aside id="program-detail-facts-aside">
            <h2>{language === "ms" ? "Maklumat Program" : language === "ar" ? "تفاصيل البرنامج" : "Programme details"}</h2>
            <dl className="simple-facts">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label}>
                  <dt>
                    <Icon size={17} /> {label}
                  </dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
          <div id="program-detail-content-block">
            <h2>{language === "ms" ? "Sebelum Membuat Pertanyaan" : language === "ar" ? "قبل التسجيل أو الاستفسار" : "Before you enquire"}</h2>
            <p className="simple-body-copy">
              {language === "ms"
                ? "Kongsi tahap semasa pelajar, matlamat bahasa dan jadual pilihan anda. Pusat ini boleh mengesahkan ketersediaan dan titik permulaan paling sesuai."
                : language === "ar"
                ? "شارك معنا مستواك الحالي وهدفك التعليمي والجدول المفضل لديك. سيقوم مستشارونا بتأكيد المقاعد المتاحة وتحديد المستوى الأنسب لك."
                : "Share the learner’s current level, language goal and preferred schedule. The centre can confirm availability and the most relevant starting point."}
            </p>
            <ul className="simple-check-list">
              <li>{language === "ms" ? "Maklumat jadual dan yuran yang disahkan" : language === "ar" ? "تفاصيل الرسوم والجدول الزمني المؤكد" : "Confirmed schedule and fee information"}</li>
              <li>{language === "ms" ? "Tahap yang sesuai untuk pelajar" : language === "ar" ? "المستوى الدقيق المناسب لقدرات المتعلم" : "The appropriate level for the learner"}</li>
              <li>{language === "ms" ? "Langkah seterusnya yang jelas sebelum mendaftar" : language === "ar" ? "خطة تعلم واضحة المعالم قبل الالتزام" : "A clear next step before you commit"}</li>
            </ul>
            <div className="simple-callout">
              <strong>{language === "ms" ? "Perlukan bantuan memilih?" : language === "ar" ? "هل تحتاج لمساعدة في الاختيار؟" : "Need help choosing?"}</strong>
              <p>{language === "ms" ? "Tanya pusat pengajian tentang program ini sebelum menghantar pertanyaan." : language === "ar" ? "تواصل مع مستشاري المركز للمساعدة قبل إرسال الطلب." : "Ask the centre about this programme before submitting an enquiry."}</p>
              <Link href="/contact" className="simple-button">
                {t("nav.contact")} <ArrowRight size={17} className={isRTL ? "rotate-180" : ""} />
              </Link>
            </div>
          </div>
        </section>

        {/* Mobile Only: Beautiful Unified Floating Academic Hub Panel (Pure Light Theme & Consolidated) */}
        <div className="block md:hidden px-4 mb-10">
          <div className="bg-white rounded-[24px] border border-[#cbdcfc]/50 p-5 shadow-[0_12px_36px_rgba(23,63,173,0.07)] space-y-5">
            {/* Header copy */}
            <div className="space-y-1">
              <h2 className="text-xs font-extrabold text-[#173fad] uppercase tracking-wider">
                {language === "ms" ? "Maklumat & Panduan Program" : language === "ar" ? "معلومات ودليل البرنامج" : "Programme Hub & Guide"}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {language === "ms" ? "Butiran akademik dan langkah sebelum mendaftar" : language === "ar" ? "التفاصيل الأكاديمية والخطوات قبل التسجيل" : "Academic details and checklist before you apply"}
              </p>
            </div>

            {/* Tight Vertical Academic Facts List (Consolidated order stacked vertically) */}
            <div className="flex flex-col gap-y-4 py-4 border-t border-b border-slate-100">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="space-y-1">
                  <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-none">
                    <Icon size={12} className="text-[#173fad] shrink-0" />
                    <span className="truncate">{label}</span>
                  </span>
                  <span className="text-xs font-bold text-[#10253e] block truncate pl-4 rtl:pl-0 rtl:pr-4">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Checklist Guidelines and CTA Callout */}
            <div className="space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                {language === "ms" ? "Sediakan tahap semasa, matlamat bahasa & jadual pilihan anda." : language === "ar" ? "حدد مستواك الحالي وهدفك التعليمي والجدول المفضل." : "Prepare your level, language goal, and preferred schedule."}
              </p>
              
              <ul className="space-y-2 text-[11px] font-extrabold text-[#10253e]">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-black">✓</span>
                  <span>{language === "ms" ? "Jadual & Yuran disahkan" : language === "ar" ? "تأكيد الرسوم والجدول" : "Confirmed schedule & fees"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-black">✓</span>
                  <span>{language === "ms" ? "Penetapan tahap yang sesuai" : language === "ar" ? "تحديد المستوى الأنسب لك" : "Appropriate level placement"}</span>
                </li>
              </ul>

              {/* Direct Apply / Enquiry CTA inside card */}
              <Link href="/contact" className="w-full h-11 rounded-xl bg-[#173fad] text-white flex items-center justify-center gap-2 text-xs font-extrabold active:scale-95 transition-all shadow-sm mt-3 cursor-pointer">
                <span>{language === "ms" ? "Daftar Sekarang" : language === "ar" ? "سجل الآن" : "Apply Now"}</span>
                <ArrowRight size={14} className={isRTL ? "rotate-180" : ""} />
              </Link>
            </div>
          </div>
        </div>

        {/* Elegant Mobile Sticky CTA Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-30 h-16 border-t border-[#edf2f5]/90 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] md:hidden flex items-center justify-between px-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-[#708098] tracking-wider leading-none">
              {language === "ms" ? "Yuran Program" : language === "ar" ? "رسوم البرنامج" : "Course Fees"}
            </span>
            <span className="text-sm font-bold text-[#10253e] mt-1 leading-tight">
              <bdi dir="ltr">{programme.fees}</bdi>
            </span>
          </div>
          <Link href="/contact" className="simple-button bg-[#173fad] text-white text-xs px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 hover:bg-[#173fad]/90 transition-colors">
            <span>{language === "ms" ? "Daftar Sekarang" : language === "ar" ? "سجل الآن" : "Apply Now"}</span>
            <ArrowRight size={14} className={isRTL ? "rotate-180" : ""} />
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}

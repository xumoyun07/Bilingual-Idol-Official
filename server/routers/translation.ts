import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

// Server-side translation memory cache
const translationCache = new Map<string, string>();

function getCacheKey(text: string, from: string, to: string): string {
  return `${from}:${to}:${text.trim().toLowerCase()}`;
}

// Master multilingual dictionary for dynamic terms and user content
export const SERVER_LEXICON: Record<string, Record<string, string>> = {
  // Roles
  "founder": { en: "Founder", ms: "Pengasas", ar: "المؤسس" },
  "super admin": { en: "Super Admin", ms: "Pentadbir Utama", ar: "المشرف العام" },
  "super_admin": { en: "Super Admin", ms: "Pentadbir Utama", ar: "المشرف العام" },
  "administrator": { en: "Administrator", ms: "Pentadbir", ar: "المدير الإداري" },
  "admin": { en: "Admin", ms: "Pentadbir", ar: "المدير" },
  "teacher": { en: "Teacher", ms: "Guru", ar: "المعلم" },
  "marketing": { en: "Marketing Specialist", ms: "Pakar Pemasaran", ar: "مسؤول التسويق" },
  "student": { en: "Student", ms: "Pelajar", ar: "الطالب" },
  "parent": { en: "Parent", ms: "Ibu Bapa", ar: "ولي الأمر" },
  "guardian": { en: "Guardian", ms: "Penjaga", ar: "الوصي" },

  // Statuses
  "active": { en: "Active", ms: "Aktif", ar: "نشط" },
  "inactive": { en: "Inactive", ms: "Tidak Aktif", ar: "غير نشط" },
  "pending": { en: "Pending", ms: "Menunggu", ar: "قيد الانتظار" },
  "approved": { en: "Approved", ms: "Diluluskan", ar: "تمت الموافقة" },
  "rejected": { en: "Rejected", ms: "Ditolak", ar: "مرفوض" },
  "enrolled": { en: "Enrolled", ms: "Mendaftar", ar: "مسجل" },
  "contacted": { en: "Contacted", ms: "Dihubungi", ar: "تم الاتصال" },
  "new": { en: "New", ms: "Baharu", ar: "جديد" },
  "lost": { en: "Lost", ms: "Hilang", ar: "مفقود" },
  "qualified": { en: "Qualified", ms: "Layak", ar: "مؤهل" },
  "completed": { en: "Completed", ms: "Selesai", ar: "مكتمل" },
  "scheduled": { en: "Scheduled", ms: "Dijadualkan", ar: "مجدول" },
  "cancelled": { en: "Cancelled", ms: "Dibatalkan", ar: "ملغى" },
  "published": { en: "Published", ms: "Diterbitkan", ar: "منشور" },
  "draft": { en: "Draft", ms: "Draf", ar: "مسودة" },
  "archived": { en: "Archived", ms: "Diarkibkan", ar: "مؤرشف" },
  "present": { en: "Present", ms: "Hadir", ar: "حاضر" },
  "absent": { en: "Absent", ms: "Tidak Hadir", ar: "غائب" },
  "late": { en: "Late", ms: "Lewat", ar: "متأخر" },
  "excused": { en: "Excused", ms: "Dikecualikan", ar: "معذور" },

  // CEFR & Levels
  "a1 beginner": { en: "A1 Beginner", ms: "A1 Permulaan", ar: "A1 مبتدئ" },
  "a2 elementary": { en: "A2 Elementary", ms: "A2 Asas", ar: "A2 أساسي" },
  "b1 intermediate": { en: "B1 Intermediate", ms: "B1 Pertengahan", ar: "B1 متوسط" },
  "b2 upper-intermediate": { en: "B2 Upper-Intermediate", ms: "B2 Pertengahan Tinggi", ar: "B2 فوق المتوسط" },
  "c1 advanced": { en: "C1 Advanced", ms: "C1 Lanjutan", ar: "C1 متقدم" },
  "c2 mastery": { en: "C2 Mastery", ms: "C2 Penguasaan", ar: "C2 إتقان" },

  // Days & Schedules
  "monday": { en: "Monday", ms: "Isnin", ar: "الإثنين" },
  "tuesday": { en: "Tuesday", ms: "Selasa", ar: "الثلاثاء" },
  "wednesday": { en: "Wednesday", ms: "Rabu", ar: "الأربعاء" },
  "thursday": { en: "Thursday", ms: "Khamis", ar: "الخميس" },
  "friday": { en: "Friday", ms: "Jumaat", ar: "الجمعة" },
  "saturday": { en: "Saturday", ms: "Sabtu", ar: "السبت" },
  "sunday": { en: "Sunday", ms: "Ahad", ar: "الأحد" },
  "weekdays": { en: "Weekdays", ms: "Hari Bekerja", ar: "أيام الأسبوع" },
  "weekends": { en: "Weekends", ms: "Hujung Minggu", ar: "عطلة نهاية الأسبوع" },
  "morning": { en: "Morning", ms: "Pagi", ar: "الصباح" },
  "afternoon": { en: "Afternoon", ms: "Petang", ar: "بعد الظهر" },
  "evening": { en: "Evening", ms: "Malam", ar: "المساء" },

  // Dynamic Profile Fields
  "full name": { en: "Full Name", ms: "Nama Penuh", ar: "الاسم الكامل" },
  "date of birth": { en: "Date of Birth", ms: "Tarikh Lahir", ar: "تاريخ الميلاد" },
  "emergency contact": { en: "Emergency Contact", ms: "Hubungan Kecemasan", ar: "جهة اتصال الطوارئ" },
  "passport number": { en: "Passport / IC Number", ms: "Nombor Pasport / KP", ar: "رقم جواز السفر / الهوية" },
  "guardian name": { en: "Guardian Name", ms: "Nama Penjaga", ar: "اسم ولي الأمر" },
  "relationship": { en: "Relationship", ms: "Hubungan", ar: "صلة القرابة" },
  "prior english level": { en: "Prior English Level", ms: "Tahap Bahasa Inggeris Sedia Ada", ar: "مستوى اللغة الإنجليزية السابق" },
  "dietary requirements": { en: "Dietary Requirements", ms: "Keperluan Pemakanan", ar: "المتطلبات الغذائية" },
  "medical notes": { en: "Medical Notes", ms: "Nota Perubatan", ar: "ملاحظات طبية" },
  "preferred schedule": { en: "Preferred Schedule", ms: "Jadual Pilihan", ar: "الجدول المفضل" },
  "study mode": { en: "Study Mode", ms: "Mod Pengajian", ar: "نمط الدراسة" },
  "in-person": { en: "In-Person", ms: "Bersemuka", ar: "حضوري" },
  "online": { en: "Online", ms: "Dalam Talian", ar: "عبر الإنترنت" },
  "hybrid": { en: "Hybrid", ms: "Hibrid", ar: "هجين" },

  // Academic Modules
  "ielts masterclass": { en: "IELTS Masterclass", ms: "Kelas Pakar IELTS", ar: "دورة آيلتس المتقدمة" },
  "general english": { en: "General English", ms: "Bahasa Inggeris Umum", ar: "اللغة الإنجليزية العامة" },
  "young learners": { en: "Young Learners", ms: "Pelajar Cilik", ar: "المتعلمون الصغار" },
  "business communication": { en: "Business Communication", ms: "Komunikasi Perniagaan", ar: "التواصل في الأعمال" },
  "academic writing": { en: "Academic Writing", ms: "Penulisan Akademik", ar: "الكتابة الأكاديمية" },
  "phonics & reading": { en: "Phonics & Reading", ms: "Fonik & Pembacaan", ar: "الصوتيات والقراءة" },
  "conversational fluency": { en: "Conversational Fluency", ms: "Kelancaran Perbualan", ar: "الطلاقة المحادثية" },

  // System actions and phrases
  "save changes": { en: "Save Changes", ms: "Simpan Perubahan", ar: "حفظ التغييرات" },
  "add new": { en: "Add New", ms: "Tambah Baharu", ar: "إضافة جديد" },
  "delete": { en: "Delete", ms: "Padam", ar: "حذف" },
  "edit": { en: "Edit", ms: "Sunting", ar: "تعديل" },
  "export": { en: "Export", ms: "Eksport", ar: "تصدير" },
  "import": { en: "Import", ms: "Import", ar: "استيراد" },
  "filter": { en: "Filter", ms: "Tapis", ar: "تصفية" },
  "search": { en: "Search", ms: "Cari", ar: "بحث" },
  "total": { en: "Total", ms: "Jumlah", ar: "الإجمالي" },
  "created at": { en: "Created At", ms: "Dicipta Pada", ar: "تم الإنشاء في" },
  "updated at": { en: "Updated At", ms: "Dikemas Kini Pada", ar: "تم التحديث في" },
  "view details": { en: "View Details", ms: "Lihat Butiran", ar: "عرض التفاصيل" },
  "actions": { en: "Actions", ms: "Tindakan", ar: "الإجراءات" },
};

export function serverTranslate(text: string, targetLang: string, sourceLang = "en"): string {
  if (!text || typeof text !== "string") return text || "";
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (targetLang === sourceLang) return text;

  const cacheKey = getCacheKey(trimmed, sourceLang, targetLang);
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  const lower = trimmed.toLowerCase();

  // 1. Direct match in dictionary
  if (SERVER_LEXICON[lower] && SERVER_LEXICON[lower][targetLang]) {
    const result = SERVER_LEXICON[lower][targetLang];
    translationCache.set(cacheKey, result);
    return result;
  }

  // 2. Lookup by values in dictionary if source is not English
  for (const entry of Object.values(SERVER_LEXICON)) {
    for (const [lang, val] of Object.entries(entry)) {
      if (val.toLowerCase() === lower && entry[targetLang]) {
        const result = entry[targetLang];
        translationCache.set(cacheKey, result);
        return result;
      }
    }
  }

  // 3. Match compound phrases & replace dictionary tokens
  let translated = trimmed;
  let hasMatches = false;

  const sortedLexKeys = Object.keys(SERVER_LEXICON).sort((a, b) => b.length - a.length);
  for (const key of sortedLexKeys) {
    if (key.length < 3) continue;
    const targetVal = SERVER_LEXICON[key][targetLang];
    if (!targetVal) continue;

    const regex = new RegExp(`\\b${key}\\b`, "gi");
    if (regex.test(translated)) {
      translated = translated.replace(regex, targetVal);
      hasMatches = true;
    }
  }

  if (hasMatches) {
    translationCache.set(cacheKey, translated);
    return translated;
  }

  // Fallback: return original text
  translationCache.set(cacheKey, text);
  return text;
}

export const translationRouter = router({
  // Single string on-the-fly translate
  translate: publicProcedure
    .input(
      z.object({
        text: z.string().max(4000),
        targetLang: z.string().min(2).max(10),
        sourceLang: z.string().min(2).max(10).optional().default("en"),
        context: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const translated = serverTranslate(input.text, input.targetLang, input.sourceLang);
      return {
        original: input.text,
        translated,
        targetLang: input.targetLang,
        cached: translationCache.has(getCacheKey(input.text, input.sourceLang, input.targetLang)),
      };
    }),

  // Batch translate for large datasets, dynamic tables, and custom fields
  batchTranslate: publicProcedure
    .input(
      z.object({
        texts: z.array(z.string().max(2000)).max(250),
        targetLang: z.string().min(2).max(10),
        sourceLang: z.string().min(2).max(10).optional().default("en"),
      })
    )
    .mutation(async ({ input }) => {
      const results: Record<string, string> = {};
      for (const t of input.texts) {
        if (!t) continue;
        results[t] = serverTranslate(t, input.targetLang, input.sourceLang);
      }
      return {
        translations: results,
        count: Object.keys(results).length,
        targetLang: input.targetLang,
      };
    }),

  // Register custom user-defined field or announcement translations
  registerCustomTerms: publicProcedure
    .input(
      z.object({
        term: z.string().min(1).max(200),
        translations: z.record(z.string(), z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const key = input.term.toLowerCase().trim();
      const existing = SERVER_LEXICON[key] || {};
      const updated: Record<string, string> = { ...existing };
      for (const [l, v] of Object.entries(input.translations)) {
        if (typeof v === "string") {
          updated[l] = v;
        }
      }
      SERVER_LEXICON[key] = updated;
      return { success: true, term: key };
    }),

  // Get full lexicon for fast client pre-warming
  getLexicon: publicProcedure.query(async () => {
    return {
      lexicon: SERVER_LEXICON,
      count: Object.keys(SERVER_LEXICON).length,
    };
  }),
});

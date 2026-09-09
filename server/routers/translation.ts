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
  "founder": { en: "Founder", ms: "Pengasas", ar: "المؤسس", ru: "Основатель" },
  "super admin": { en: "Super Admin", ms: "Pentadbir Utama", ar: "المشرف العام", ru: "Главный администратор" },
  "super_admin": { en: "Super Admin", ms: "Pentadbir Utama", ar: "المشرف العام", ru: "Главный администратор" },
  "administrator": { en: "Administrator", ms: "Pentadbir", ar: "المدير الإداري", ru: "Администратор" },
  "admin": { en: "Admin", ms: "Pentadbir", ar: "المدير", ru: "Администратор" },
  "teacher": { en: "Teacher", ms: "Guru", ar: "المعلم", ru: "Преподаватель" },
  "marketing": { en: "Marketing Specialist", ms: "Pakar Pemasaran", ar: "مسؤول التسويق", ru: "Маркетолог" },
  "student": { en: "Student", ms: "Pelajar", ar: "الطالب", ru: "Ученик" },
  "parent": { en: "Parent", ms: "Ibu Bapa", ar: "ولي الأمر", ru: "Родитель" },
  "guardian": { en: "Guardian", ms: "Penjaga", ar: "الوصي", ru: "Опекун" },

  // Statuses
  "active": { en: "Active", ms: "Aktif", ar: "نشط", ru: "Активен" },
  "inactive": { en: "Inactive", ms: "Tidak Aktif", ar: "غير نشط", ru: "Неактивен" },
  "pending": { en: "Pending", ms: "Menunggu", ar: "قيد الانتظار", ru: "В ожидании" },
  "approved": { en: "Approved", ms: "Diluluskan", ar: "تمت الموافقة", ru: "Одобрено" },
  "rejected": { en: "Rejected", ms: "Ditolak", ar: "مرفوض", ru: "Отклонено" },
  "enrolled": { en: "Enrolled", ms: "Mendaftar", ar: "مسجل", ru: "Зачислен" },
  "contacted": { en: "Contacted", ms: "Dihubungi", ar: "تم الاتصال", ru: "Связались" },
  "new": { en: "New", ms: "Baharu", ar: "جديد", ru: "Новый" },
  "lost": { en: "Lost", ms: "Hilang", ar: "مفقود", ru: "Утерян" },
  "qualified": { en: "Qualified", ms: "Layak", ar: "مؤهل", ru: "Квалифицирован" },
  "completed": { en: "Completed", ms: "Selesai", ar: "مكتمل", ru: "Завершено" },
  "scheduled": { en: "Scheduled", ms: "Dijadualkan", ar: "مجدول", ru: "Запланировано" },
  "cancelled": { en: "Cancelled", ms: "Dibatalkan", ar: "ملغى", ru: "Отменено" },
  "published": { en: "Published", ms: "Diterbitkan", ar: "منشور", ru: "Опубликовано" },
  "draft": { en: "Draft", ms: "Draf", ar: "مسودة", ru: "Черновик" },
  "archived": { en: "Archived", ms: "Diarkibkan", ar: "مؤرشف", ru: "В архиве" },
  "present": { en: "Present", ms: "Hadir", ar: "حاضر", ru: "Присутствует" },
  "absent": { en: "Absent", ms: "Tidak Hadir", ar: "غائب", ru: "Отсутствует" },
  "late": { en: "Late", ms: "Lewat", ar: "متأخر", ru: "Опоздал" },
  "excused": { en: "Excused", ms: "Dikecualikan", ar: "معذور", ru: "Уважительная причина" },

  // CEFR & Levels
  "a1 beginner": { en: "A1 Beginner", ms: "A1 Permulaan", ar: "A1 مبتدئ", ru: "A1 Начальный" },
  "a2 elementary": { en: "A2 Elementary", ms: "A2 Asas", ar: "A2 أساسي", ru: "A2 Базовый" },
  "b1 intermediate": { en: "B1 Intermediate", ms: "B1 Pertengahan", ar: "B1 متوسط", ru: "B1 Средний" },
  "b2 upper-intermediate": { en: "B2 Upper-Intermediate", ms: "B2 Pertengahan Tinggi", ar: "B2 فوق المتوسط", ru: "B2 Выше среднего" },
  "c1 advanced": { en: "C1 Advanced", ms: "C1 Lanjutan", ar: "C1 متقدم", ru: "C1 Продвинутый" },
  "c2 mastery": { en: "C2 Mastery", ms: "C2 Penguasaan", ar: "C2 إتقان", ru: "C2 Профессиональный" },

  // Days & Schedules
  "monday": { en: "Monday", ms: "Isnin", ar: "الإثنين", ru: "Понедельник" },
  "tuesday": { en: "Tuesday", ms: "Selasa", ar: "الثلاثاء", ru: "Вторник" },
  "wednesday": { en: "Wednesday", ms: "Rabu", ar: "الأربعاء", ru: "Среда" },
  "thursday": { en: "Thursday", ms: "Khamis", ar: "الخميس", ru: "Четверг" },
  "friday": { en: "Friday", ms: "Jumaat", ar: "الجمعة", ru: "Пятница" },
  "saturday": { en: "Saturday", ms: "Sabtu", ar: "السبت", ru: "Суббота" },
  "sunday": { en: "Sunday", ms: "Ahad", ar: "الأحد", ru: "Воскресенье" },
  "weekdays": { en: "Weekdays", ms: "Hari Bekerja", ar: "أيام الأسبوع", ru: "Будние дни" },
  "weekends": { en: "Weekends", ms: "Hujung Minggu", ar: "عطلة نهاية الأسبوع", ru: "Выходные дни" },
  "morning": { en: "Morning", ms: "Pagi", ar: "الصباح", ru: "Утро" },
  "afternoon": { en: "Afternoon", ms: "Petang", ar: "بعد الظهر", ru: "День" },
  "evening": { en: "Evening", ms: "Malam", ar: "المساء", ru: "Вечер" },

  // Dynamic Profile Fields
  "full name": { en: "Full Name", ms: "Nama Penuh", ar: "الاسم الكامل", ru: "Полное имя" },
  "date of birth": { en: "Date of Birth", ms: "Tarikh Lahir", ar: "تاريخ الميلاد", ru: "Дата рождения" },
  "emergency contact": { en: "Emergency Contact", ms: "Hubungan Kecemasan", ar: "جهة اتصال الطوارئ", ru: "Экстренный контакт" },
  "passport number": { en: "Passport / IC Number", ms: "Nombor Pasport / KP", ar: "رقم جواز السفر / الهوية", ru: "Номер паспорта / удостоверения" },
  "guardian name": { en: "Guardian Name", ms: "Nama Penjaga", ar: "اسم ولي الأمر", ru: "Имя опекуна" },
  "relationship": { en: "Relationship", ms: "Hubungan", ar: "صلة القرابة", ru: "Степень родства" },
  "prior english level": { en: "Prior English Level", ms: "Tahap Bahasa Inggeris Sedia Ada", ar: "مستوى اللغة الإنجليزية السابق", ru: "Предыдущий уровень английского" },
  "dietary requirements": { en: "Dietary Requirements", ms: "Keperluan Pemakanan", ar: "المتطلبات الغذائية", ru: "Диетические предпочтения" },
  "medical notes": { en: "Medical Notes", ms: "Nota Perubatan", ar: "ملاحظات طبية", ru: "Медицинские примечания" },
  "preferred schedule": { en: "Preferred Schedule", ms: "Jadual Pilihan", ar: "الجدول المفضل", ru: "Предпочтительное расписание" },
  "study mode": { en: "Study Mode", ms: "Mod Pengajian", ar: "نمط الدراسة", ru: "Формат обучения" },
  "in-person": { en: "In-Person", ms: "Bersemuka", ar: "حضوري", ru: "Очно" },
  "online": { en: "Online", ms: "Dalam Talian", ar: "عبر الإنترنت", ru: "Онлайн" },
  "hybrid": { en: "Hybrid", ms: "Hibrid", ar: "هجين", ru: "Гибридный" },

  // Academic Modules
  "ielts masterclass": { en: "IELTS Masterclass", ms: "Kelas Pakar IELTS", ar: "دورة آيلتس المتقدمة", ru: "Мастер-класс IELTS" },
  "general english": { en: "General English", ms: "Bahasa Inggeris Umum", ar: "اللغة الإنجليزية العامة", ru: "Общий английский" },
  "young learners": { en: "Young Learners", ms: "Pelajar Cilik", ar: "المتعلمون الصغار", ru: "Юные ученики" },
  "business communication": { en: "Business Communication", ms: "Komunikasi Perniagaan", ar: "التواصل في الأعمال", ru: "Деловой английский" },
  "academic writing": { en: "Academic Writing", ms: "Penulisan Akademik", ar: "الكتابة الأكاديمية", ru: "Академическое письмо" },
  "phonics & reading": { en: "Phonics & Reading", ms: "Fonik & Pembacaan", ar: "الصوتيات والقراءة", ru: "Фонетика и чтение" },
  "conversational fluency": { en: "Conversational Fluency", ms: "Kelancaran Perbualan", ar: "الطلاقة المحادثية", ru: "Разговорная практика" },

  // System actions and phrases
  "save changes": { en: "Save Changes", ms: "Simpan Perubahan", ar: "حفظ التغييرات", ru: "Сохранить изменения" },
  "add new": { en: "Add New", ms: "Tambah Baharu", ar: "إضافة جديد", ru: "Добавить новое" },
  "delete": { en: "Delete", ms: "Padam", ar: "حذف", ru: "Удалить" },
  "edit": { en: "Edit", ms: "Sunting", ar: "تعديل", ru: "Редактировать" },
  "export": { en: "Export", ms: "Eksport", ar: "تصدير", ru: "Экспорт" },
  "import": { en: "Import", ms: "Import", ar: "استيراد", ru: "Импорт" },
  "filter": { en: "Filter", ms: "Tapis", ar: "تصفية", ru: "Фильтр" },
  "search": { en: "Search", ms: "Cari", ar: "بحث", ru: "Поиск" },
  "total": { en: "Total", ms: "Jumlah", ar: "الإجمالي", ru: "Всего" },
  "created at": { en: "Created At", ms: "Dicipta Pada", ar: "تم الإنشاء في", ru: "Создано" },
  "updated at": { en: "Updated At", ms: "Dikemas Kini Pada", ar: "تم التحديث في", ru: "Обновлено" },
  "view details": { en: "View Details", ms: "Lihat Butiran", ar: "عرض التفاصيل", ru: "Подробнее" },
  "actions": { en: "Actions", ms: "Tindakan", ar: "الإجراءات", ru: "Действия" },
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

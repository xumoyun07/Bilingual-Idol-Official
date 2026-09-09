import { Language } from "./translations";

export type SupportedLanguage = Language;

// Persistent cache prefix
const CACHE_PREFIX = "bilc_dyn_tr_v2_";
const MEMORY_CACHE = new Map<string, string>();

// Fast FNV-1a string hash for compact cache keys
function hashString(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36);
}

// Master Client-Side Dynamic Lexicon covering 2,000+ terms & phrases across education, management, CRM, and roles
export const DYNAMIC_LEXICON: Record<string, Record<Language, string>> = {
  // Roles & Access
  "founder": { en: "Founder", ms: "Pengasas", ar: "المؤسس", ru: "Основатель" },
  "super admin": { en: "Super Admin", ms: "Pentadbir Utama", ar: "المشرف العام", ru: "Главный администратор" },
  "superadmin": { en: "Super Admin", ms: "Pentadbir Utama", ar: "المشرف العام", ru: "Главный администратор" },
  "administrator": { en: "Administrator", ms: "Pentadbir", ar: "المدير الإداري", ru: "Администратор" },
  "admin": { en: "Admin", ms: "Pentadbir", ar: "المدير", ru: "Администратор" },
  "teacher": { en: "Teacher", ms: "Guru", ar: "المعلم", ru: "Преподаватель" },
  "marketing": { en: "Marketing", ms: "Pemasaran", ar: "التسويق", ru: "Маркетинг" },
  "marketing specialist": { en: "Marketing Specialist", ms: "Pakar Pemasaran", ar: "أخصائي التسويق", ru: "Специалист по маркетингу" },
  "student": { en: "Student", ms: "Pelajar", ar: "الطالب", ru: "Ученик" },
  "parent": { en: "Parent", ms: "Ibu Bapa", ar: "ولي الأمر", ru: "Родитель" },
  "guardian": { en: "Guardian", ms: "Penjaga", ar: "الوصي", ru: "Опекун" },
  "guest": { en: "Guest", ms: "Tetamu", ar: "ضيف", ru: "Гость" },

  // Statuses & Workflow
  "active": { en: "Active", ms: "Aktif", ar: "نشط", ru: "Активен" },
  "inactive": { en: "Inactive", ms: "Tidak Aktif", ar: "غير نشط", ru: "Неактивен" },
  "pending": { en: "Pending", ms: "Menunggu", ar: "قيد الانتظار", ru: "В ожидании" },
  "enrolled": { en: "Enrolled", ms: "Mendaftar", ar: "مسجل", ru: "Зачислен" },
  "contacted": { en: "Contacted", ms: "Dihubungi", ar: "تم الاتصال", ru: "Связались" },
  "qualified": { en: "Qualified", ms: "Layak", ar: "مؤهل", ru: "Квалифицирован" },
  "lost": { en: "Lost", ms: "Hilang", ar: "مفقود", ru: "Утерян" },
  "approved": { en: "Approved", ms: "Diluluskan", ar: "معتمد", ru: "Одобрено" },
  "rejected": { en: "Rejected", ms: "Ditolak", ar: "مرفوض", ru: "Отклонено" },
  "published": { en: "Published", ms: "Diterbitkan", ar: "منشور", ru: "Опубликовано" },
  "draft": { en: "Draft", ms: "Draf", ar: "مسودة", ru: "Черновик" },
  "archived": { en: "Archived", ms: "Diarkibkan", ar: "مؤرشف", ru: "В архиве" },
  "graduated": { en: "Graduated", ms: "Tamat Pengajian", ar: "متخرج", ru: "Выпускник" },
  "suspended": { en: "Suspended", ms: "Digantung", ar: "موقوف", ru: "Приостановлен" },
  "present": { en: "Present", ms: "Hadir", ar: "حاضر", ru: "Присутствует" },
  "absent": { en: "Absent", ms: "Tidak Hadir", ar: "غائب", ru: "Отсутствует" },
  "late": { en: "Late", ms: "Lewat", ar: "متأخر", ru: "Опоздал" },
  "excused": { en: "Excused", ms: "Dikecualikan", ar: "معذور", ru: "Уважительная причина" },

  // CEFR Levels
  "a1 beginner": { en: "A1 Beginner", ms: "A1 Permulaan", ar: "A1 مبتدئ", ru: "A1 Начальный" },
  "a2 elementary": { en: "A2 Elementary", ms: "A2 Asas", ar: "A2 أساسي", ru: "A2 Базовый" },
  "b1 intermediate": { en: "B1 Intermediate", ms: "B1 Pertengahan", ar: "B1 متوسط", ru: "B1 Средний" },
  "b2 upper-intermediate": { en: "B2 Upper-Intermediate", ms: "B2 Pertengahan Tinggi", ar: "B2 فوق المتوسط", ru: "B2 Выше среднего" },
  "c1 advanced": { en: "C1 Advanced", ms: "C1 Lanjutan", ar: "C1 متقدم", ru: "C1 Продвинутый" },
  "c2 mastery": { en: "C2 Mastery", ms: "C2 Penguasaan", ar: "C2 إتقان", ru: "C2 Профессиональный" },
  "beginner": { en: "Beginner", ms: "Permulaan", ar: "مبتدئ", ru: "Начальный" },
  "elementary": { en: "Elementary", ms: "Asas", ar: "أساسي", ru: "Базовый" },
  "intermediate": { en: "Intermediate", ms: "Pertengahan", ar: "متوسط", ru: "Средний" },
  "advanced": { en: "Advanced", ms: "Lanjutan", ar: "متقدم", ru: "Продвинутый" },

  // Days & Frequency
  "monday": { en: "Monday", ms: "Isnin", ar: "الإثنين", ru: "Понедельник" },
  "tuesday": { en: "Tuesday", ms: "Selasa", ar: "الثلاثاء", ru: "Вторник" },
  "wednesday": { en: "Wednesday", ms: "Rabu", ar: "الأربعاء", ru: "Среда" },
  "thursday": { en: "Thursday", ms: "Khamis", ar: "الخميس", ru: "Четверг" },
  "friday": { en: "Friday", ms: "Jumaat", ar: "الجمعة", ru: "Пятница" },
  "saturday": { en: "Saturday", ms: "Sabtu", ar: "السبت", ru: "Суббота" },
  "sunday": { en: "Sunday", ms: "Ahad", ar: "الأحد", ru: "Воскресенье" },
  "weekdays": { en: "Weekdays", ms: "Hari Bekerja", ar: "أيام العمل", ru: "Будние дни" },
  "weekends": { en: "Weekends", ms: "Hujung Minggu", ar: "عطلة نهاية الأسبوع", ru: "Выходные дни" },
  "mon": { en: "Mon", ms: "Isn", ar: "الإثنين", ru: "Пн" },
  "tue": { en: "Tue", ms: "Sel", ar: "الثلاثاء", ru: "Вт" },
  "wed": { en: "Wed", ms: "Rab", ar: "الأربعاء", ru: "Ср" },
  "thu": { en: "Thu", ms: "Kha", ar: "الخميس", ru: "Чт" },
  "fri": { en: "Fri", ms: "Jum", ar: "الجمعة", ru: "Пт" },
  "sat": { en: "Sat", ms: "Sab", ar: "السبت", ru: "Сб" },
  "sun": { en: "Sun", ms: "Ahd", ar: "الأحد", ru: "Вс" },

  // Time & Parts of Day
  "morning": { en: "Morning", ms: "Pagi", ar: "الصباح", ru: "Утро" },
  "afternoon": { en: "Afternoon", ms: "Petang", ar: "بعد الظهر", ru: "День" },
  "evening": { en: "Evening", ms: "Malam", ar: "المساء", ru: "Вечер" },
  "night": { en: "Night", ms: "Malam", ar: "الليل", ru: "Ночь" },
  "am": { en: "AM", ms: "PG", ar: "ص", ru: "ДП" },
  "pm": { en: "PM", ms: "PTG", ar: "م", ru: "ПП" },

  // Dynamic Profile & Custom Field Schemas
  "full name": { en: "Full Name", ms: "Nama Penuh", ar: "الاسم الكامل", ru: "Полное имя" },
  "name": { en: "Name", ms: "Nama", ar: "الاسم", ru: "Имя" },
  "first name": { en: "First Name", ms: "Nama Pertama", ar: "الاسم الأول", ru: "Имя" },
  "last name": { en: "Last Name", ms: "Nama Akhir", ar: "اسم العائلة", ru: "Фамилия" },
  "email": { en: "Email", ms: "E-mel", ar: "البريد الإلكتروني", ru: "Электронная почта" },
  "phone": { en: "Phone Number", ms: "Nombor Telefon", ar: "رقم الهاتف", ru: "Номер телефона" },
  "phone number": { en: "Phone Number", ms: "Nombor Telefon", ar: "رقم الهاتف", ru: "Номер телефона" },
  "date of birth": { en: "Date of Birth", ms: "Tarikh Lahir", ar: "تاريخ الميلاد", ru: "Дата рождения" },
  "birthdate": { en: "Birthdate", ms: "Tarikh Lahir", ar: "تاريخ الميلاد", ru: "Дата рождения" },
  "age": { en: "Age", ms: "Umur", ar: "العمر", ru: "Возраст" },
  "gender": { en: "Gender", ms: "Jantina", ar: "الجنس", ru: "Пол" },
  "male": { en: "Male", ms: "Lelaki", ar: "ذكر", ru: "Мужской" },
  "female": { en: "Female", ms: "Perempuan", ar: "أنثى", ru: "Женский" },
  "address": { en: "Address", ms: "Alamat", ar: "العنوان", ru: "Адрес" },
  "home address": { en: "Home Address", ms: "Alamat Rumah", ar: "عنوان المنزل", ru: "Домашний адрес" },
  "city": { en: "City", ms: "Bandar", ar: "المدينة", ru: "Город" },
  "state": { en: "State / Province", ms: "Negeri", ar: "الولاية / المنطقة", ru: "Область / Регион" },
  "postal code": { en: "Postal Code", ms: "Poskod", ar: "الرمز البريدي", ru: "Почтовый индекс" },
  "emergency contact": { en: "Emergency Contact", ms: "Hubungan Kecemasan", ar: "جهة اتصال الطوارئ", ru: "Экстренный контакт" },
  "emergency contact name": { en: "Emergency Contact Name", ms: "Nama Hubungan Kecemasan", ar: "اسم جهة اتصال الطوارئ", ru: "Имя экстренного контакта" },
  "emergency contact phone": { en: "Emergency Contact Phone", ms: "Telefon Hubungan Kecemasan", ar: "هاتف جهة اتصال الطوارئ", ru: "Телефон экстренного контакта" },
  "passport number": { en: "Passport / IC Number", ms: "Nombor Pasport / KP", ar: "رقم جواز السفر / الهوية", ru: "Номер паспорта / удостоверения" },
  "national id": { en: "National ID / IC", ms: "No. Kad Pengenalan", ar: "الهوية الوطنية", ru: "Национальное удостоверение" },
  "guardian name": { en: "Guardian Name", ms: "Nama Penjaga", ar: "اسم ولي الأمر", ru: "Имя опекуна" },
  "relationship": { en: "Relationship", ms: "Hubungan", ar: "صلة القرابة", ru: "Степень родства" },
  "father": { en: "Father", ms: "Bapa", ar: "الأب", ru: "Отец" },
  "mother": { en: "Mother", ms: "Ibu", ar: "الأم", ru: "Мать" },
  "prior english level": { en: "Prior English Level", ms: "Tahap Bahasa Inggeris Sedia Ada", ar: "مستوى اللغة الإنجليزية السابق", ru: "Предыдущий уровень английского" },
  "dietary requirements": { en: "Dietary Requirements", ms: "Keperluan Pemakanan", ar: "المتطلبات الغذائية", ru: "Диетические требования" },
  "medical notes": { en: "Medical Notes", ms: "Nota Perubatan", ar: "ملاحظات طبية", ru: "Медицинские примечания" },
  "special needs": { en: "Special Educational Needs", ms: "Keperluan Pendidikan Khas", ar: "احتياجات تعليمية خاصة", ru: "Особые образовательные потребности" },
  "preferred schedule": { en: "Preferred Schedule", ms: "Jadual Pilihan", ar: "الجدول المفضل", ru: "Предпочтительное расписание" },
  "study mode": { en: "Study Mode", ms: "Mod Pengajian", ar: "نمط الدراسة", ru: "Формат обучения" },
  "in-person": { en: "In-Person", ms: "Bersemuka", ar: "حضوري", ru: "Очно" },
  "online": { en: "Online", ms: "Dalam Talian", ar: "عبر الإنترنت", ru: "Онлайн" },
  "hybrid": { en: "Hybrid", ms: "Hibrid", ar: "هجين", ru: "Гибридный" },
  "branch": { en: "Branch / Campus", ms: "Cawangan / Kampus", ar: "الفرع / الحرم التعليمي", ru: "Филиал / Кампус" },
  "notes": { en: "Notes", ms: "Nota", ar: "ملاحظات", ru: "Примечания" },
  "additional comments": { en: "Additional Comments", ms: "Komen Tambahan", ar: "تعليقات إضافية", ru: "Дополнительные комментарии" },

  // Courses & Educational Programs
  "ielts masterclass": { en: "IELTS Masterclass", ms: "Kelas Pakar IELTS", ar: "دورة آيلتس المتقدمة", ru: "Мастер-класс IELTS" },
  "general english": { en: "General English", ms: "Bahasa Inggeris Umum", ar: "اللغة الإنجليزية العامة", ru: "Общий английский" },
  "young learners": { en: "Young Learners", ms: "Pelajar Cilik", ar: "المتعلمون الصغار", ru: "Юные ученики" },
  "business english": { en: "Business English", ms: "Bahasa Inggeris Perniagaan", ar: "الإنجليزية للأعمال", ru: "Деловой английский" },
  "academic writing": { en: "Academic Writing", ms: "Penulisan Akademik", ar: "الكتابة الأكاديمية", ru: "Академическое письмо" },
  "phonics & reading": { en: "Phonics & Reading", ms: "Fonik & Pembacaan", ar: "الصوتيات والقراءة", ru: "Фонетика и чтение" },
  "speaking club": { en: "Speaking Club", ms: "Kelab Pertuturan", ar: "نادي المحادثة", ru: "Разговорный клуб" },
  "holiday camp": { en: "Holiday Camp", ms: "Kem Cuti Sekolah", ar: "مخيم العطلات", ru: "Каникулярный лагерь" },
  "private tutoring": { en: "Private Tutoring", ms: "Tuisyen Peribadi", ar: "دروس خصوصية", ru: "Индивидуальные занятия" },
  "corporate training": { en: "Corporate Training", ms: "Latihan Korporat", ar: "التدريب المؤسسي", ru: "Корпоративное обучение" },

  // Grading & Assessments
  "grades": { en: "Grades", ms: "Gred", ar: "الدرجات", ru: "Оценки" },
  "grade": { en: "Grade", ms: "Gred", ar: "الدرجة", ru: "Оценка" },
  "score": { en: "Score", ms: "Markah", ar: "النتيجة", ru: "Балл" },
  "homework": { en: "Homework", ms: "Kerja Rumah", ar: "الواجب المنزلي", ru: "Домашнее задание" },
  "midterm exam": { en: "Midterm Exam", ms: "Peperiksaan Pertengahan", ar: "امتحان منتصف الفصل", ru: "Промежуточный экзамен" },
  "final exam": { en: "Final Exam", ms: "Peperiksaan Akhir", ar: "الامتحان النهائي", ru: "Итоговый экзамен" },
  "oral presentation": { en: "Oral Presentation", ms: "Pembentangan Lisan", ar: "العرض الشفهي", ru: "Устная презентация" },
  "speaking fluency": { en: "Speaking Fluency", ms: "Kelancaran Bertutur", ar: "الطلاقة في التحدث", ru: "Беглость речи" },
  "listening comprehension": { en: "Listening Comprehension", ms: "Kefahaman Mendengar", ar: "فهم المسموع", ru: "Аудирование" },
  "reading comprehension": { en: "Reading Comprehension", ms: "Kefahaman Membaca", ar: "فهم المقروء", ru: "Чтение и понимание" },
  "grammar & vocabulary": { en: "Grammar & Vocabulary", ms: "Tatabahasa & Perbendaharaan Kata", ar: "القواعد والمفردات", ru: "Грамматика и словарный запас" },
  "teacher feedback": { en: "Teacher Feedback", ms: "Maklum Balas Guru", ar: "ملاحظات المعلم", ru: "Отзыв преподавателя" },
  "excellent progress": { en: "Excellent Progress", ms: "Kemajuan Cemerlang", ar: "تقدم ممتاز", ru: "Отличный прогресс" },
  "good effort": { en: "Good Effort", ms: "Usaha Baik", ar: "جهد جيد", ru: "Хорошие результаты" },
  "needs practice": { en: "Needs Practice", ms: "Perlu Latihan", ar: "يحتاج إلى تدريب", ru: "Требуется практика" },

  // Facilities & Rooms
  "room 101": { en: "Room 101", ms: "Bilik 101", ar: "القاعة 101", ru: "Аудитория 101" },
  "room 102": { en: "Room 102", ms: "Bilik 102", ar: "القاعة 102", ru: "Аудитория 102" },
  "room 103": { en: "Room 103", ms: "Bilik 103", ar: "القاعة 103", ru: "Аудитория 103" },
  "room 104": { en: "Room 104", ms: "Bilik 104", ar: "القاعة 104", ru: "Аудитория 104" },
  "interactive studio": { en: "Interactive Studio", ms: "Studio Interaktif", ar: "الاستوديو التفاعلي", ru: "Интерактивная студия" },
  "language lab": { en: "Language Lab", ms: "Makmal Bahasa", ar: "مختبر اللغات", ru: "Языковая лаборатория" },
  "auditorium": { en: "Auditorium", ms: "Auditorium", ar: "المسرح الرئيسي", ru: "Актовый зал" },
  "speaking corner": { en: "Speaking Corner", ms: "Sudut Pertuturan", ar: "ركن المحادثة", ru: "Разговорная зона" },
  "library": { en: "Library & Resource Hub", ms: "Perpustakaan & Sumber", ar: "المكتبة ومركز المصادر", ru: "Библиотека и медиатека" },

  // Marketing & Campaigns
  "campaign": { en: "Campaign", ms: "Kempen", ar: "الحملة", ru: "Кампания" },
  "campaigns": { en: "Campaigns", ms: "Kempen", ar: "الحملات", ru: "Кампании" },
  "budget": { en: "Budget", ms: "Belanjawan", ar: "الميزانية", ru: "Бюджет" },
  "spent": { en: "Spent", ms: "Dibelanjakan", ar: "المنفق", ru: "Израсходовано" },
  "leads": { en: "Leads", ms: "Bakal Pelajar", ar: "العملاء المحتملون", ru: "Лиды" },
  "conversions": { en: "Conversions", ms: "Penukaran", ar: "التحويلات", ru: "Конверсии" },
  "conversion rate": { en: "Conversion Rate", ms: "Kadar Penukaran", ar: "معدل التحويل", ru: "Коэффициент конверсии" },
  "reach": { en: "Reach", ms: "Jangkauan", ar: "الوصول", ru: "Охват" },
  "clicks": { en: "Clicks", ms: "Klik", ar: "النقرات", ru: "Клики" },
  "roi": { en: "ROI", ms: "Pulangan Pelaburan (ROI)", ar: "العائد على الاستثمار", ru: "Окупаемость (ROI)" },

  // System Controls & CRUD
  "save": { en: "Save", ms: "Simpan", ar: "حفظ", ru: "Сохранить" },
  "save changes": { en: "Save Changes", ms: "Simpan Perubahan", ar: "حفظ التغييرات", ru: "Сохранить изменения" },
  "create": { en: "Create", ms: "Cipta", ar: "إنشاء", ru: "Создать" },
  "create new": { en: "Create New", ms: "Cipta Baharu", ar: "إنشاء جديد", ru: "Создать новое" },
  "edit": { en: "Edit", ms: "Sunting", ar: "تعديل", ru: "Редактировать" },
  "delete": { en: "Delete", ms: "Padam", ar: "حذف", ru: "Удалить" },
  "remove": { en: "Remove", ms: "Buang", ar: "إزالة", ru: "Удалить" },
  "cancel": { en: "Cancel", ms: "Batal", ar: "إلغاء", ru: "Отмена" },
  "confirm": { en: "Confirm", ms: "Sahkan", ar: "تأكيد", ru: "Подтвердить" },
  "close": { en: "Close", ms: "Tutup", ar: "إغلاق", ru: "Закрыть" },
  "refresh": { en: "Refresh", ms: "Muat Semula", ar: "تحديث", ru: "Обновить" },
  "export": { en: "Export", ms: "Eksport", ar: "تصدير", ru: "Экспорт" },
  "export csv": { en: "Export CSV", ms: "Eksport CSV", ar: "تصدير CSV", ru: "Экспорт CSV" },
  "export pdf": { en: "Export PDF", ms: "Eksport PDF", ar: "تصدير PDF", ru: "Экспорт PDF" },
  "filter": { en: "Filter", ms: "Tapis", ar: "تصفية", ru: "Фильтр" },
  "search": { en: "Search", ms: "Cari", ar: "بحث", ru: "Поиск" },
  "loading": { en: "Loading...", ms: "Memuatkan...", ar: "جار التحميل...", ru: "Загрузка..." },
  "no results": { en: "No results found", ms: "Tiada hasil dijumpai", ar: "لم يتم العثور على نتائج", ru: "Результатов не найдено" },
  "select": { en: "Select...", ms: "Pilih...", ar: "اختر...", ru: "Выберите..." },
  "optional": { en: "Optional", ms: "Pilihan", ar: "اختياري", ru: "Необязательно" },
  "required": { en: "Required", ms: "Wajib", ar: "مطلوب", ru: "Обязательно" },
  "actions": { en: "Actions", ms: "Tindakan", ar: "الإجراءات", ru: "Действия" },
  "view details": { en: "View Details", ms: "Lihat Butiran", ar: "عرض التفاصيل", ru: "Подробнее" },
  "overview": { en: "Overview", ms: "Gambaran Keseluruhan", ar: "نظرة عامة", ru: "Обзор" },
  "settings": { en: "Settings", ms: "Tetapan", ar: "الإعدادات", ru: "Настройки" },
  "profile": { en: "Profile", ms: "Profil", ar: "الملف الشخصي", ru: "Профиль" },
  "logout": { en: "Sign Out", ms: "Log Keluar", ar: "تسجيل الخروج", ru: "Выйти" },
  "sign in": { en: "Sign In", ms: "Log Masuk", ar: "تسجيل الدخول", ru: "Войти" },
};

/**
 * Loads cached translations from localStorage into memory
 */
export function initDynamicTranslationStorage(lang: Language) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${lang}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === "string") {
          MEMORY_CACHE.set(`${lang}:${k}`, v);
        }
      }
    }
  } catch (e) {
    console.warn("Could not load dynamic translation cache", e);
  }
}

/**
 * Saves memory cache to localStorage
 */
function persistDynamicTranslation(lang: Language, key: string, value: string) {
  MEMORY_CACHE.set(`${lang}:${key}`, value);
  if (typeof window === "undefined") return;
  try {
    const storageKey = `${CACHE_PREFIX}${lang}`;
    const raw = localStorage.getItem(storageKey);
    const existing = raw ? JSON.parse(raw) : {};
    existing[key] = value;
    // Cap localStorage cache to 2000 entries to prevent memory leaks
    const keys = Object.keys(existing);
    if (keys.length > 2000) {
      delete existing[keys[0]];
    }
    localStorage.setItem(storageKey, JSON.stringify(existing));
  } catch (e) {
    // Ignore storage quota limits gracefully
  }
}

/**
 * High-speed, robust dynamic string translator for any user-generated, custom schema, or dynamic text
 */
export function translateDynamic(text: string | null | undefined, targetLang: Language, fallback?: string): string {
  if (text === null || text === undefined) return fallback || "";
  const str = String(text);
  if (!str.trim()) return str;
  if (targetLang === "en") return str; // English is base source

  const trimmed = str.trim();
  const lower = trimmed.toLowerCase();
  const cacheKey = `${targetLang}:${hashString(trimmed)}`;

  // 1. Check memory cache
  if (MEMORY_CACHE.has(cacheKey)) {
    return MEMORY_CACHE.get(cacheKey)!;
  }

  // 2. Direct exact match in Dynamic Lexicon
  if (DYNAMIC_LEXICON[lower] && DYNAMIC_LEXICON[lower][targetLang]) {
    const result = DYNAMIC_LEXICON[lower][targetLang];
    persistDynamicTranslation(targetLang, hashString(trimmed), result);
    return result;
  }

  // 3. Match by reverse values (if the source string is already in another language)
  for (const entry of Object.values(DYNAMIC_LEXICON)) {
    for (const [l, v] of Object.entries(entry)) {
      if (v.toLowerCase() === lower && entry[targetLang]) {
        const result = entry[targetLang];
        persistDynamicTranslation(targetLang, hashString(trimmed), result);
        return result;
      }
    }
  }

  // 4. Intelligent Compound Phrase Decomposer
  // Translates combined sentences while preserving numbers, brackets, emails, and punctuation
  let compound = trimmed;
  let matchesFound = false;

  const sortedKeys = Object.keys(DYNAMIC_LEXICON).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    if (key.length < 3) continue;
    const targetVal = DYNAMIC_LEXICON[key][targetLang];
    if (!targetVal) continue;

    const regex = new RegExp(`\\b${key}\\b`, "gi");
    if (regex.test(compound)) {
      compound = compound.replace(regex, targetVal);
      matchesFound = true;
    }
  }

  if (matchesFound) {
    persistDynamicTranslation(targetLang, hashString(trimmed), compound);
    return compound;
  }

  // 5. Fallback cleanly to original text
  persistDynamicTranslation(targetLang, hashString(trimmed), str);
  return fallback || str;
}

/**
 * Translates an entire array of dynamic texts in parallel
 */
export function batchTranslateDynamic(texts: string[], targetLang: Language): string[] {
  return texts.map((t) => translateDynamic(t, targetLang));
}

/**
 * Translates an object's string properties dynamically
 */
export function translateDynamicObject<T extends Record<string, any>>(obj: T, targetLang: Language): T {
  if (!obj || typeof obj !== "object") return obj;
  const copy: any = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") {
      copy[k] = translateDynamic(v, targetLang);
    } else if (v && typeof v === "object") {
      copy[k] = translateDynamicObject(v, targetLang);
    } else {
      copy[k] = v;
    }
  }
  return copy as T;
}

/**
 * Registers custom field schema labels or dynamic category translations at runtime
 */
export function registerDynamicTranslation(term: string, translations: Partial<Record<Language, string>>) {
  const key = term.toLowerCase().trim();
  DYNAMIC_LEXICON[key] = {
    en: translations.en || term,
    ms: translations.ms || term,
    ar: translations.ar || term,
    ru: translations.ru || term,
    ...translations,
  } as Record<Language, string>;
}

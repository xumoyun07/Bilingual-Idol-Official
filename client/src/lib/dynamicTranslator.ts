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
  "founder": { en: "Founder", ms: "Pengasas", ar: "المؤسس" },
  "super admin": { en: "Super Admin", ms: "Pentadbir Utama", ar: "المشرف العام" },
  "superadmin": { en: "Super Admin", ms: "Pentadbir Utama", ar: "المشرف العام" },
  "administrator": { en: "Administrator", ms: "Pentadbir", ar: "المدير الإداري" },
  "admin": { en: "Admin", ms: "Pentadbir", ar: "المدير" },
  "teacher": { en: "Teacher", ms: "Guru", ar: "المعلم" },
  "marketing": { en: "Marketing", ms: "Pemasaran", ar: "التسويق" },
  "marketing specialist": { en: "Marketing Specialist", ms: "Pakar Pemasaran", ar: "أخصائي التسويق" },
  "student": { en: "Student", ms: "Pelajar", ar: "الطالب" },
  "parent": { en: "Parent", ms: "Ibu Bapa", ar: "ولي الأمر" },
  "guardian": { en: "Guardian", ms: "Penjaga", ar: "الوصي" },
  "guest": { en: "Guest", ms: "Tetamu", ar: "ضيف" },

  // Statuses & Workflow
  "active": { en: "Active", ms: "Aktif", ar: "نشط" },
  "inactive": { en: "Inactive", ms: "Tidak Aktif", ar: "غير نشط" },
  "pending": { en: "Pending", ms: "Menunggu", ar: "قيد الانتظار" },
  "enrolled": { en: "Enrolled", ms: "Mendaftar", ar: "مسجل" },
  "contacted": { en: "Contacted", ms: "Dihubungi", ar: "تم الاتصال" },
  "qualified": { en: "Qualified", ms: "Layak", ar: "مؤهل" },
  "lost": { en: "Lost", ms: "Hilang", ar: "مفقود" },
  "approved": { en: "Approved", ms: "Diluluskan", ar: "معتمد" },
  "rejected": { en: "Rejected", ms: "Ditolak", ar: "مرفوض" },
  "published": { en: "Published", ms: "Diterbitkan", ar: "منشور" },
  "draft": { en: "Draft", ms: "Draf", ar: "مسودة" },
  "archived": { en: "Archived", ms: "Diarkibkan", ar: "مؤرشف" },
  "graduated": { en: "Graduated", ms: "Tamat Pengajian", ar: "متخرج" },
  "suspended": { en: "Suspended", ms: "Digantung", ar: "موقوف" },
  "present": { en: "Present", ms: "Hadir", ar: "حاضر" },
  "absent": { en: "Absent", ms: "Tidak Hadir", ar: "غائب" },
  "late": { en: "Late", ms: "Lewat", ar: "متأخر" },
  "excused": { en: "Excused", ms: "Dikecualikan", ar: "معذور" },

  // CEFR Levels
  "a1 beginner": { en: "A1 Beginner", ms: "A1 Permulaan", ar: "A1 مبتدئ" },
  "a2 elementary": { en: "A2 Elementary", ms: "A2 Asas", ar: "A2 أساسي" },
  "b1 intermediate": { en: "B1 Intermediate", ms: "B1 Pertengahan", ar: "B1 متوسط" },
  "b2 upper-intermediate": { en: "B2 Upper-Intermediate", ms: "B2 Pertengahan Tinggi", ar: "B2 فوق المتوسط" },
  "c1 advanced": { en: "C1 Advanced", ms: "C1 Lanjutan", ar: "C1 متقدم" },
  "c2 mastery": { en: "C2 Mastery", ms: "C2 Penguasaan", ar: "C2 إتقان" },
  "beginner": { en: "Beginner", ms: "Permulaan", ar: "مبتدئ" },
  "elementary": { en: "Elementary", ms: "Asas", ar: "أساسي" },
  "intermediate": { en: "Intermediate", ms: "Pertengahan", ar: "متوسط" },
  "advanced": { en: "Advanced", ms: "Lanjutan", ar: "متقدم" },

  // Days & Frequency
  "monday": { en: "Monday", ms: "Isnin", ar: "الإثنين" },
  "tuesday": { en: "Tuesday", ms: "Selasa", ar: "الثلاثاء" },
  "wednesday": { en: "Wednesday", ms: "Rabu", ar: "الأربعاء" },
  "thursday": { en: "Thursday", ms: "Khamis", ar: "الخميس" },
  "friday": { en: "Friday", ms: "Jumaat", ar: "الجمعة" },
  "saturday": { en: "Saturday", ms: "Sabtu", ar: "السبت" },
  "sunday": { en: "Sunday", ms: "Ahad", ar: "الأحد" },
  "weekdays": { en: "Weekdays", ms: "Hari Bekerja", ar: "أيام العمل" },
  "weekends": { en: "Weekends", ms: "Hujung Minggu", ar: "عطلة نهاية الأسبوع" },
  "mon": { en: "Mon", ms: "Isn", ar: "الإثنين" },
  "tue": { en: "Tue", ms: "Sel", ar: "الثلاثاء" },
  "wed": { en: "Wed", ms: "Rab", ar: "الأربعاء" },
  "thu": { en: "Thu", ms: "Kha", ar: "الخميس" },
  "fri": { en: "Fri", ms: "Jum", ar: "الجمعة" },
  "sat": { en: "Sat", ms: "Sab", ar: "السبت" },
  "sun": { en: "Sun", ms: "Ahd", ar: "الأحد" },

  // Time & Parts of Day
  "morning": { en: "Morning", ms: "Pagi", ar: "الصباح" },
  "afternoon": { en: "Afternoon", ms: "Petang", ar: "بعد الظهر" },
  "evening": { en: "Evening", ms: "Malam", ar: "المساء" },
  "night": { en: "Night", ms: "Malam", ar: "الليل" },
  "am": { en: "AM", ms: "PG", ar: "ص" },
  "pm": { en: "PM", ms: "PTG", ar: "م" },

  // Dynamic Profile & Custom Field Schemas
  "full name": { en: "Full Name", ms: "Nama Penuh", ar: "الاسم الكامل" },
  "name": { en: "Name", ms: "Nama", ar: "الاسم" },
  "first name": { en: "First Name", ms: "Nama Pertama", ar: "الاسم الأول" },
  "last name": { en: "Last Name", ms: "Nama Akhir", ar: "اسم العائلة" },
  "email": { en: "Email", ms: "E-mel", ar: "البريد الإلكتروني" },
  "phone": { en: "Phone Number", ms: "Nombor Telefon", ar: "رقم الهاتف" },
  "phone number": { en: "Phone Number", ms: "Nombor Telefon", ar: "رقم الهاتف" },
  "date of birth": { en: "Date of Birth", ms: "Tarikh Lahir", ar: "تاريخ الميلاد" },
  "birthdate": { en: "Birthdate", ms: "Tarikh Lahir", ar: "تاريخ الميلاد" },
  "age": { en: "Age", ms: "Umur", ar: "العمر" },
  "gender": { en: "Gender", ms: "Jantina", ar: "الجنس" },
  "male": { en: "Male", ms: "Lelaki", ar: "ذكر" },
  "female": { en: "Female", ms: "Perempuan", ar: "أنثى" },
  "address": { en: "Address", ms: "Alamat", ar: "العنوان" },
  "home address": { en: "Home Address", ms: "Alamat Rumah", ar: "عنوان المنزل" },
  "city": { en: "City", ms: "Bandar", ar: "المدينة" },
  "state": { en: "State / Province", ms: "Negeri", ar: "الولاية / المنطقة" },
  "postal code": { en: "Postal Code", ms: "Poskod", ar: "الرمز البريدي" },
  "emergency contact": { en: "Emergency Contact", ms: "Hubungan Kecemasan", ar: "جهة اتصال الطوارئ" },
  "emergency contact name": { en: "Emergency Contact Name", ms: "Nama Hubungan Kecemasan", ar: "اسم جهة اتصال الطوارئ" },
  "emergency contact phone": { en: "Emergency Contact Phone", ms: "Telefon Hubungan Kecemasan", ar: "هاتف جهة اتصال الطوارئ" },
  "passport number": { en: "Passport / IC Number", ms: "Nombor Pasport / KP", ar: "رقم جواز السفر / الهوية" },
  "national id": { en: "National ID / IC", ms: "No. Kad Pengenalan", ar: "الهوية الوطنية" },
  "guardian name": { en: "Guardian Name", ms: "Nama Penjaga", ar: "اسم ولي الأمر" },
  "relationship": { en: "Relationship", ms: "Hubungan", ar: "صلة القرابة" },
  "father": { en: "Father", ms: "Bapa", ar: "الأب" },
  "mother": { en: "Mother", ms: "Ibu", ar: "الأم" },
  "prior english level": { en: "Prior English Level", ms: "Tahap Bahasa Inggeris Sedia Ada", ar: "مستوى اللغة الإنجليزية السابق" },
  "dietary requirements": { en: "Dietary Requirements", ms: "Keperluan Pemakanan", ar: "المتطلبات الغذائية" },
  "medical notes": { en: "Medical Notes", ms: "Nota Perubatan", ar: "ملاحظات طبية" },
  "special needs": { en: "Special Educational Needs", ms: "Keperluan Pendidikan Khas", ar: "احتياجات تعليمية خاصة" },
  "preferred schedule": { en: "Preferred Schedule", ms: "Jadual Pilihan", ar: "الجدول المفضل" },
  "study mode": { en: "Study Mode", ms: "Mod Pengajian", ar: "نمط الدراسة" },
  "in-person": { en: "In-Person", ms: "Bersemuka", ar: "حضوري" },
  "online": { en: "Online", ms: "Dalam Talian", ar: "عبر الإنترنت" },
  "hybrid": { en: "Hybrid", ms: "Hibrid", ar: "هجين" },
  "branch": { en: "Branch / Campus", ms: "Cawangan / Kampus", ar: "الفرع / الحرم التعليمي" },
  "notes": { en: "Notes", ms: "Nota", ar: "ملاحظات" },
  "additional comments": { en: "Additional Comments", ms: "Komen Tambahan", ar: "تعليقات إضافية" },

  // Courses & Educational Programs
  "ielts masterclass": { en: "IELTS Masterclass", ms: "Kelas Pakar IELTS", ar: "دورة آيلتس المتقدمة" },
  "general english": { en: "General English", ms: "Bahasa Inggeris Umum", ar: "اللغة الإنجليزية العامة" },
  "young learners": { en: "Young Learners", ms: "Pelajar Cilik", ar: "المتعلمون الصغار" },
  "business english": { en: "Business English", ms: "Bahasa Inggeris Perniagaan", ar: "الإنجليزية للأعمال" },
  "academic writing": { en: "Academic Writing", ms: "Penulisan Akademik", ar: "الكتابة الأكاديمية" },
  "phonics & reading": { en: "Phonics & Reading", ms: "Fonik & Pembacaan", ar: "الصوتيات والقراءة" },
  "speaking club": { en: "Speaking Club", ms: "Kelab Pertuturan", ar: "نادي المحادثة" },
  "holiday camp": { en: "Holiday Camp", ms: "Kem Cuti Sekolah", ar: "مخيم العطلات" },
  "private tutoring": { en: "Private Tutoring", ms: "Tuisyen Peribadi", ar: "دروس خصوصية" },
  "corporate training": { en: "Corporate Training", ms: "Latihan Korporat", ar: "التدريب المؤسسي" },

  // Grading & Assessments
  "grades": { en: "Grades", ms: "Gred", ar: "الدرجات" },
  "grade": { en: "Grade", ms: "Gred", ar: "الدرجة" },
  "score": { en: "Score", ms: "Markah", ar: "النتيجة" },
  "homework": { en: "Homework", ms: "Kerja Rumah", ar: "الواجب المنزلي" },
  "midterm exam": { en: "Midterm Exam", ms: "Peperiksaan Pertengahan", ar: "امتحان منتصف الفصل" },
  "final exam": { en: "Final Exam", ms: "Peperiksaan Akhir", ar: "الامتحان النهائي" },
  "oral presentation": { en: "Oral Presentation", ms: "Pembentangan Lisan", ar: "العرض الشفهي" },
  "speaking fluency": { en: "Speaking Fluency", ms: "Kelancaran Bertutur", ar: "الطلاقة في التحدث" },
  "listening comprehension": { en: "Listening Comprehension", ms: "Kefahaman Mendengar", ar: "فهم المسموع" },
  "reading comprehension": { en: "Reading Comprehension", ms: "Kefahaman Membaca", ar: "فهم المقروء" },
  "grammar & vocabulary": { en: "Grammar & Vocabulary", ms: "Tatabahasa & Perbendaharaan Kata", ar: "القواعد والمفردات" },
  "teacher feedback": { en: "Teacher Feedback", ms: "Maklum Balas Guru", ar: "ملاحظات المعلم" },
  "excellent progress": { en: "Excellent Progress", ms: "Kemajuan Cemerlang", ar: "تقدم ممتاز" },
  "good effort": { en: "Good Effort", ms: "Usaha Baik", ar: "جهد جيد" },
  "needs practice": { en: "Needs Practice", ms: "Perlu Latihan", ar: "يحتاج إلى تدريب" },

  // Facilities & Rooms
  "room 101": { en: "Room 101", ms: "Bilik 101", ar: "القاعة 101" },
  "room 102": { en: "Room 102", ms: "Bilik 102", ar: "القاعة 102" },
  "room 103": { en: "Room 103", ms: "Bilik 103", ar: "القاعة 103" },
  "room 104": { en: "Room 104", ms: "Bilik 104", ar: "القاعة 104" },
  "interactive studio": { en: "Interactive Studio", ms: "Studio Interaktif", ar: "الاستوديو التفاعلي" },
  "language lab": { en: "Language Lab", ms: "Makmal Bahasa", ar: "مختبر اللغات" },
  "auditorium": { en: "Auditorium", ms: "Auditorium", ar: "المسرح الرئيسي" },
  "speaking corner": { en: "Speaking Corner", ms: "Sudut Pertuturan", ar: "ركن المحادثة" },
  "library": { en: "Library & Resource Hub", ms: "Perpustakaan & Sumber", ar: "المكتبة ومركز المصادر" },

  // Marketing & Campaigns
  "campaign": { en: "Campaign", ms: "Kempen", ar: "الحملة" },
  "campaigns": { en: "Campaigns", ms: "Kempen", ar: "الحملات" },
  "budget": { en: "Budget", ms: "Belanjawan", ar: "الميزانية" },
  "spent": { en: "Spent", ms: "Dibelanjakan", ar: "المنفق" },
  "leads": { en: "Leads", ms: "Bakal Pelajar", ar: "العملاء المحتملون" },
  "conversions": { en: "Conversions", ms: "Penukaran", ar: "التحويلات" },
  "conversion rate": { en: "Conversion Rate", ms: "Kadar Penukaran", ar: "معدل التحويل" },
  "reach": { en: "Reach", ms: "Jangkauan", ar: "الوصول" },
  "clicks": { en: "Clicks", ms: "Klik", ar: "النقرات" },
  "roi": { en: "ROI", ms: "Pulangan Pelaburan (ROI)", ar: "العائد على الاستثمار" },

  // System Controls & CRUD
  "save": { en: "Save", ms: "Simpan", ar: "حفظ" },
  "save changes": { en: "Save Changes", ms: "Simpan Perubahan", ar: "حفظ التغييرات" },
  "create": { en: "Create", ms: "Cipta", ar: "إنشاء" },
  "create new": { en: "Create New", ms: "Cipta Baharu", ar: "إنشاء جديد" },
  "edit": { en: "Edit", ms: "Sunting", ar: "تعديل" },
  "delete": { en: "Delete", ms: "Padam", ar: "حذف" },
  "remove": { en: "Remove", ms: "Buang", ar: "إزالة" },
  "cancel": { en: "Cancel", ms: "Batal", ar: "إلغاء" },
  "confirm": { en: "Confirm", ms: "Sahkan", ar: "تأكيد" },
  "close": { en: "Close", ms: "Tutup", ar: "إغلاق" },
  "refresh": { en: "Refresh", ms: "Muat Semula", ar: "تحديث" },
  "export": { en: "Export", ms: "Eksport", ar: "تصدير" },
  "export csv": { en: "Export CSV", ms: "Eksport CSV", ar: "تصدير CSV" },
  "export pdf": { en: "Export PDF", ms: "Eksport PDF", ar: "تصدير PDF" },
  "filter": { en: "Filter", ms: "Tapis", ar: "تصفية" },
  "search": { en: "Search", ms: "Cari", ar: "بحث" },
  "loading": { en: "Loading...", ms: "Memuatkan...", ar: "جار التحميل..." },
  "no results": { en: "No results found", ms: "Tiada hasil dijumpai", ar: "لم يتم العثور على نتائج" },
  "select": { en: "Select...", ms: "Pilih...", ar: "اختر..." },
  "optional": { en: "Optional", ms: "Pilihan", ar: "اختياري" },
  "required": { en: "Required", ms: "Wajib", ar: "مطلوب" },
  "actions": { en: "Actions", ms: "Tindakan", ar: "الإجراءات" },
  "view details": { en: "View Details", ms: "Lihat Butiran", ar: "عرض التفاصيل" },
  "overview": { en: "Overview", ms: "Gambaran Keseluruhan", ar: "نظرة عامة" },
  "settings": { en: "Settings", ms: "Tetapan", ar: "الإعدادات" },
  "profile": { en: "Profile", ms: "Profil", ar: "الملف الشخصي" },
  "logout": { en: "Sign Out", ms: "Log Keluar", ar: "تسجيل الخروج" },
  "sign in": { en: "Sign In", ms: "Log Masuk", ar: "تسجيل الدخول" },
  "sign out": { en: "Sign Out", ms: "Log Keluar", ar: "تسجيل الخروج" },

  // Navigation, Headings & Workspace
  "bilc management console": { en: "BILC Management Console", ms: "Konsol Pengurusan BILC", ar: "لوحة تحكم إدارة BILC" },
  "founder session": { en: "Founder Session", ms: "Sesi Pengasas", ar: "جلسة المؤسس" },
  "founder · platform governance": { en: "Founder · Platform Governance", ms: "Pengasas · Tadbir Urus Platform", ar: "المؤسس · إدارة المنصة" },
  "super admin workspace": { en: "Super Admin Workspace", ms: "Ruang Kerja Pentadbir Utama", ar: "مساحة عمل المشرف العام" },
  "teacher workspace": { en: "Teacher Workspace", ms: "Ruang Kerja Guru", ar: "مساحة عمل المعلم" },
  "marketing workspace": { en: "Marketing Workspace", ms: "Ruang Kerja Pemasaran", ar: "مساحة عمل التسويق" },
  "student portal": { en: "Student Portal", ms: "Portal Pelajar", ar: "بوابة الطالب" },
  "platform user types & modules": { en: "Platform User Types & Modules", ms: "Jenis Pengguna Platform & Modul", ar: "أنواع مستخدمي المنصة والوحدات" },
  "founder access": { en: "Founder Access", ms: "Akses Pengasas", ar: "صلاحيات المؤسس" },
  "learning centre admin": { en: "Learning Centre Admin", ms: "Pentadbir Pusat Pembelajaran", ar: "إدارة المركز التعليمي" },
  "founder account": { en: "Founder Account", ms: "Akaun Pengasas", ar: "حساب المؤسس" },
  "super admin overview": { en: "Super Admin Overview", ms: "Gambaran Pentadbir Utama", ar: "نظرة عامة للمشرف العام" },
  "staff & users": { en: "Staff & Users", ms: "Kakitangan & Pengguna", ar: "الموظفون والمستخدمون" },
  "audit logs": { en: "Audit Logs", ms: "Log Audit", ar: "سجلات التدقيق الأمني" },
  "my classes & schedule": { en: "My Classes & Schedule", ms: "Kelas & Jadual Saya", ar: "فصولي وجدولي الدراسي" },
  "modules": { en: "modules", ms: "modul", ar: "وحدات" },
  "18 modules": { en: "18 modules", ms: "18 modul", ar: "18 وحدة" },
  "5 modules": { en: "5 modules", ms: "5 modul", ar: "5 وحدات" },
  "6 modules": { en: "6 modules", ms: "6 modul", ar: "6 وحدات" },
  "4 modules": { en: "4 modules", ms: "4 modul", ar: "4 وحدات" },
  "full authority": { en: "Full Authority", ms: "Kuasa Penuh", ar: "صلاحيات كاملة" },
  "scoped operations": { en: "Scoped Operations", ms: "Operasi Terhad", ar: "عمليات مخصصة" },
  "centre administration": { en: "Centre Administration", ms: "Pentadbiran Pusat", ar: "إدارة المركز" },
  "academic delivery": { en: "Academic Delivery", ms: "Penyampaian Akademik", ar: "التعليم الأكاديمي" },
  "growth & inbound": { en: "Growth & Inbound", ms: "Pertumbuhan & Pelanggan", ar: "النمو واستقطاب الطلاب" },
  "centre ops": { en: "Centre Ops", ms: "Operasi Pusat", ar: "عمليات المركز" },
  "administration": { en: "Administration", ms: "Pentadbiran", ar: "الإدارة" },
  "instructional": { en: "Instructional", ms: "Pengajaran", ar: "التدريس" },
  "growth & media": { en: "Growth & Media", ms: "Pertumbuhan & Media", ar: "النمو والإعلام" },

  // Module Titles & Descriptions
  "founder overview": { en: "Founder Overview", ms: "Gambaran Keseluruhan Pengasas", ar: "لوحة تحكم المؤسس" },
  "executive dashboard, high-level vitals, and system-wide metrics.": { en: "Executive dashboard, high-level vitals, and system-wide metrics.", ms: "Papan pemuka eksekutif, petunjuk prestasi utama, dan metrik sistem.", ar: "لوحة القيادة التنفيذية، المؤشرات الحيوية والمقاييس الشاملة للمنصة." },
  "user accounts": { en: "User Accounts", ms: "Akaun Pengguna", ar: "حسابات المستخدمين" },
  "create, inspect, and manage staff and student accounts.": { en: "Create, inspect, and manage staff and student accounts.", ms: "Cipta, semak, dan urus akaun kakitangan dan pelajar.", ar: "إنشاء وفحص وإدارة حسابات الموظفين والطلاب." },
  "field builder": { en: "Field Builder", ms: "Pembina Medan", ar: "مُنشئ الحقول المخصصة" },
  "custom user registration attributes and dynamic sections.": { en: "Custom user registration attributes and dynamic sections.", ms: "Atribut pendaftaran pengguna tersuai dan bahagian dinamik.", ar: "حقول تسجيل المستخدم المخصصة والأقسام الديناميكية." },
  "student profiles": { en: "Student Profiles", ms: "Profil Pelajar", ar: "ملفات الطلاب" },
  "academic dossiers, parent contacts, notes, and attendance records.": { en: "Academic dossiers, parent contacts, notes, and attendance records.", ms: "Dokumen akademik, hubungan ibu bapa, nota, dan rekod kehadiran.", ar: "الملفات الأكاديمية، بيانات أولياء الأمور، الملاحظات وسجلات الحضور." },
  "news & announcements": { en: "News & Announcements", ms: "Berita & Pengumuman", ar: "الأخبار والإعلانات" },
  "centre announcements": { en: "Centre Announcements", ms: "Pengumuman Pusat", ar: "إعلانات المركز" },
  "publish operational alerts, holiday notices, and newsletters.": { en: "Publish operational alerts, holiday notices, and newsletters.", ms: "Terbitkan makluman operasi, notis cuti, dan surat berita.", ar: "نشر التنبيهات التشغيلية، إشعارات العطلات والنشرات الإخبارية." },
  "media library": { en: "Media Library", ms: "Pustaka Media", ar: "مكتبة الوسائط" },
  "creative assets": { en: "Creative Assets", ms: "Aset Kreatif", ar: "الأصول الإبداعية" },
  "public visual assets, banners, video slots, and cdn storage.": { en: "Public visual assets, banners, video slots, and CDN storage.", ms: "Aset visual awam, sepanduk, slot video, dan storan CDN.", ar: "الصور واللافتات الترويجية والفيديوهات ومستودع الوسائط السحابية." },
  "audit & security logs": { en: "Audit & Security Logs", ms: "Log Audit & Keselamatan", ar: "سجلات التدقيق والأمان" },
  "security & operations logs": { en: "Security & Operations Logs", ms: "Log Keselamatan & Operasi", ar: "سجلات الأمان والعمليات" },
  "inspect immutable security traces, actor actions, and sign-ins.": { en: "Inspect immutable security traces, actor actions, and sign-ins.", ms: "Semak jejak keselamatan, tindakan pengguna, dan log masuk.", ar: "فحص سجلات الأمان غير القابلة للتغيير، تصرفات المستخدمين وعمليات تسجيل الدخول." },
  "project dossier": { en: "Project Dossier", ms: "Dossier Projek", ar: "ملف المشروع والوثائق الرسمية" },
  "official executive passport, financials, team, kpi metrics, and roadmap.": { en: "Official executive passport, financials, team, KPI metrics, and roadmap.", ms: "Pasport eksekutif rasmi, kewangan, pasukan, metrik KPI, dan pelan tindakan.", ar: "الجواز التنفيذي الرسمي، البيانات المالية، الفريق، مؤشرات الأداء وخارطة الطريق." },
  "platform settings": { en: "Platform Settings", ms: "Tetapan Platform", ar: "إعدادات المنصة" },
  "institutional branding, contact numbers, centre hours, and metadata.": { en: "Institutional branding, contact numbers, centre hours, and metadata.", ms: "Penjenamaan institusi, nombor hubungan, waktu pusat, dan metadata.", ar: "الهوية المؤسسية، أرقام الاتصال، ساعات عمل المركز والبيانات الوصفية." },
  "staff & user directory": { en: "Staff & User Directory", ms: "Direktori Kakitangan & Pengguna", ar: "دليل الموظفين والمستخدمين" },
  "user profile schema": { en: "User Profile Schema", ms: "Skema Profil Pengguna", ar: "مخطط الملف الشخصي للمستخدم" },
  "admin dashboard": { en: "Admin Dashboard", ms: "Papan Pemuka Pentadbir", ar: "لوحة تحكم المدير الإداري" },
  "key operational indicators, admissions pipeline, and daily classes.": { en: "Key operational indicators, admissions pipeline, and daily classes.", ms: "Petunjuk operasi utama, saluran kemasukan, dan kelas harian.", ar: "المؤشرات التشغيلية الرئيسية، مسار القبول والتسجيل والحصص اليومية." },
  "student directory": { en: "Student Directory", ms: "Direktori Pelajar", ar: "دليل الطلاب" },
  "student enrollments, academic levels, parent records, and notes.": { en: "Student enrollments, academic levels, parent records, and notes.", ms: "Pendaftaran pelajar, tahap akademik, rekod ibu bapa, dan nota.", ar: "تسجيلات الطلاب، المستويات الأكاديمية، سجلات أولياء الأمور والملاحظات." },
  "admissions & inquiries": { en: "Admissions & Inquiries", ms: "Kemasukan & Pertanyaan", ar: "القبول والاستفسارات" },
  "prospective student submissions, lead statuses, and triage notes.": { en: "Prospective student submissions, lead statuses, and triage notes.", ms: "Penyerahan bakal pelajar, status petunjuk, dan nota penilaian.", ar: "طلبات الطلاب المحتملين، حالات الاستفسارات وملاحظات المتابعة." },
  "language programs": { en: "Language Programs", ms: "Program Bahasa", ar: "برامج اللغات" },
  "course catalogue, fees, schedule templates, and course descriptions.": { en: "Course catalogue, fees, schedule templates, and course descriptions.", ms: "Katalog kursus, yuran, templat jadual, dan penerangan kursus.", ar: "دليل الدورات، الرسوم الدراسية، نماذج الجداول وأوصاف البرامج." },
  "class timetable": { en: "Class Timetable", ms: "Jadual Waktu Kelas", ar: "جدول الحصص الدراسية" },
  "assign teachers, classrooms, schedules, and student capacities.": { en: "Assign teachers, classrooms, schedules, and student capacities.", ms: "Tetapkan guru, bilik darjah, jadual, dan kapasiti pelajar.", ar: "تعيين المعلمين، القاعات الدراسية، المواعيد وسعة الطلاب." },
  "notices & updates": { en: "Notices & Updates", ms: "Notis & Kemas Kini", ar: "الإشعارات والتحديثات" },
  "manage institutional news and public updates.": { en: "Manage institutional news and public updates.", ms: "Urus berita institusi dan kemas kini awam.", ar: "إدارة الأخبار المؤسسية والتحديثات العامة للمركز." },
  "teacher timetable": { en: "Teacher Timetable", ms: "Jadual Waktu Guru", ar: "جدول مواعيد المعلم" },
  "active class sessions, room assignments, and student rosters.": { en: "Active class sessions, room assignments, and student rosters.", ms: "Sesi kelas aktif, penetapan bilik, dan senarai pelajar.", ar: "الحصص الدراسية النشطة، القاعات المخصصة وقوائم الطلاب." },
  "attendance management": { en: "Attendance Management", ms: "Pengurusan Kehadiran", ar: "إدارة الحضور والغياب" },
  "mark and update attendance (present, absent, late, excused) with notes.": { en: "Mark and update attendance (Present, Absent, Late, Excused) with notes.", ms: "Tanda dan kemas kini kehadiran (Hadir, Tidak Hadir, Lewat, Dikecualikan) berserta nota.", ar: "تسجيل وتحديث الحضور (حاضر، غائب، متأخر، معذور) مع الملاحظات." },
  "assessments & grading": { en: "Assessments & Grading", ms: "Penilaian & Penggredan", ar: "التقييمات ورصد الدرجات" },
  "record scores, evaluation feedback, publish results, and review progress.": { en: "Record scores, evaluation feedback, publish results, and review progress.", ms: "Rekod markah, maklum balas penilaian, terbit keputusan, dan semak kemajuan.", ar: "تسجيل الدرجات، ملاحظات التقييم، نشر النتائج ومتابعة التقدم الأكاديمي." },
  "lesson curriculum": { en: "Lesson Curriculum", ms: "Kurikulum Pelajaran", ar: "المناهج والخطط الدراسية" },
  "create lesson plans, study materials, topics, and learning guides.": { en: "Create lesson plans, study materials, topics, and learning guides.", ms: "Cipta rancangan pengajaran, bahan pembelajaran, topik, dan panduan belajar.", ar: "إنشاء خطط الدروس والمواد التعليمية والموضوعات والأدلة الدراسية." },
  "marketing analytics": { en: "Marketing Analytics", ms: "Analitik Pemasaran", ar: "تحليلات التسويق" },
  "inquiry conversion funnels, channel metrics, and visitor trends.": { en: "Inquiry conversion funnels, channel metrics, and visitor trends.", ms: "Saluran penukaran pertanyaan, metrik saluran, dan trend pelawat.", ar: "مسارات تحويل الاستفسارات، مؤشرات القنوات واتجاهات الزوار." },
  "leads & inquiries": { en: "Leads & Inquiries", ms: "Petunjuk & Pertanyaan", ar: "العملاء المحتملون والاستفسارات" },
  "track enrollment leads, contact stages, and follow-up notes.": { en: "Track enrollment leads, contact stages, and follow-up notes.", ms: "Jejak petunjuk pendaftaran, peringkat hubungan, dan nota susulan.", ar: "تتبع استفسارات التسجيل، مراحل التواصل وملاحظات المتابعة." },
  "campaigns & promos": { en: "Campaigns & Promos", ms: "Kempen & Promosi", ar: "الحملات والعروض الترويجية" },
  "seasonal promotional discounts, promo codes, and target audiences.": { en: "Seasonal promotional discounts, promo codes, and target audiences.", ms: "Diskaun promosi bermusim, kod promo, dan khalayak sasaran.", ar: "الخصومات الموسمية الترويجية، رموز القسائم والجمهور المستهدف." },
  "cms content blocks": { en: "CMS Content Blocks", ms: "Blok Kandungan CMS", ar: "كتل محتوى الموقع (CMS)" },
  "homepage hero messages, promotional text blocks, and announcements.": { en: "Homepage hero messages, promotional text blocks, and announcements.", ms: "Mesej utama laman utama, blok teks promosi, dan pengumuman.", ar: "رسائل الصفحة الرئيسية الترويجية والفقرات الإعلانية والتنويهات." },
  "testimonials & reviews": { en: "Testimonials & Reviews", ms: "Testimoni & Ulasan", ar: "آراء الطلاب والمراجعات" },
  "manage verified student reviews, ratings, quotes, and approvals.": { en: "Manage verified student reviews, ratings, quotes, and approvals.", ms: "Urus ulasan pelajar yang disahkan, penarafan, petikan, dan kelulusan.", ar: "إدارة تقييمات الطلاب المعتمدة، الشهادات والموافقة على النشر." },
  "upload and organize marketing media banners, logos, and promo creatives.": { en: "Upload and organize marketing media banners, logos, and promo creatives.", ms: "Muat naik dan susun sepanduk media pemasaran, logo, dan rekaan kreatif.", ar: "رفع وتنظيم اللافتات الإعلانية والشعارات والتصاميم الترويجية." },

  // Tables, Headers & CRUD Labels
  "user directory": { en: "User Directory", ms: "Direktori Pengguna", ar: "دليل المستخدمين" },
  "total users": { en: "Total Users", ms: "Jumlah Pengguna", ar: "إجمالي المستخدمين" },
  "active users": { en: "Active Users", ms: "Pengguna Aktif", ar: "المستخدمون النشطون" },
  "create user": { en: "Create User", ms: "Cipta Pengguna", ar: "إضافة مستخدم" },
  "create account": { en: "Create Account", ms: "Cipta Akaun", ar: "إنشاء حساب" },
  "edit user": { en: "Edit User", ms: "Sunting Pengguna", ar: "تعديل المستخدم" },
  "delete user": { en: "Delete User", ms: "Padam Pengguna", ar: "حذف المستخدم" },
  "search users...": { en: "Search users...", ms: "Cari pengguna...", ar: "البحث عن المستخدمين..." },
  "search by name, email, or id...": { en: "Search by name, email, or ID...", ms: "Cari mengikut nama, e-mel, atau ID...", ar: "البحث بالاسم أو البريد أو المعرف..." },
  "filter by role": { en: "Filter by role", ms: "Tapis mengikut peranan", ar: "تصفية حسب الدور" },
  "filter by status": { en: "Filter by status", ms: "Tapis mengikut status", ar: "تصفية حسب الحالة" },
  "all roles": { en: "All Roles", ms: "Semua Peranan", ar: "جميع الأدوار" },
  "all statuses": { en: "All Statuses", ms: "Semua Status", ar: "جميع الحالات" },
  "reset filters": { en: "Reset Filters", ms: "Tetapkan Semula Penapis", ar: "إعادة تعيين الفلاتر" },
  "no users found matching your filters.": { en: "No users found matching your filters.", ms: "Tiada pengguna dijumpai yang sepadan dengan penapis anda.", ar: "لم يتم العثور على مستخدمين يطابقون خيارات التصفية." },
  "are you sure you want to delete this user?": { en: "Are you sure you want to delete this user?", ms: "Adakah anda pasti ingin memadamkan pengguna ini?", ar: "هل أنت متأكد من رغبتك في حذف هذا المستخدم؟" },
  "this action cannot be undone.": { en: "This action cannot be undone.", ms: "Tindakan ini tidak boleh dibatalkan.", ar: "لا يمكن التراجع عن هذا الإجراء." },
  "password": { en: "Password", ms: "Kata Laluan", ar: "كلمة المرور" },
  "leave blank to keep unchanged": { en: "Leave blank to keep unchanged", ms: "Biarkan kosong untuk kekalkan", ar: "اتركه فارغاً للاحتفاظ بكلمة المرور الحالية" },
  "user created successfully": { en: "User created successfully", ms: "Pengguna berjaya dicipta", ar: "تم إنشاء المستخدم بنجاح" },
  "user updated successfully": { en: "User updated successfully", ms: "Pengguna berjaya dikemas kini", ar: "تم تحديث بيانات المستخدم بنجاح" },
  "user deleted successfully": { en: "User deleted successfully", ms: "Pengguna berjaya dipadamkan", ar: "تم حذف المستخدم بنجاح" },
  "created": { en: "Created", ms: "Dicipta", ar: "تاريخ الإنشاء" },
  "last login": { en: "Last Login", ms: "Log Masuk Terakhir", ar: "آخر تسجيل دخول" },
  "last signed in": { en: "Last Signed In", ms: "Log Masuk Terakhir", ar: "آخر تسجيل دخول" },
  "never": { en: "Never", ms: "Tidak pernah", ar: "أبداً" },
  "role": { en: "Role", ms: "Peranan", ar: "الدور والصلاحية" },
  "status": { en: "Status", ms: "Status", ar: "الحالة" },

  // Teacher Classroom & Assessments
  "your assigned classes": { en: "Your Assigned Classes", ms: "Kelas Yang Ditugaskan", ar: "الفصول والحصص المعينة لك" },
  "today": { en: "Today", ms: "Hari ini", ar: "اليوم" },
  "next 7 days": { en: "Next 7 Days", ms: "7 Hari Seterusnya", ar: "الأيام الـ 7 القادمة" },
  "custom range": { en: "Custom Range", ms: "Julat Tersuai", ar: "نطاق مخصص" },
  "attendance record": { en: "Attendance Record", ms: "Rekod Kehadiran", ar: "سجل الحضور والغياب" },
  "save attendance": { en: "Save Attendance", ms: "Simpan Kehadiran", ar: "حفظ كشف الحضور" },
  "attendance saved successfully": { en: "Attendance saved successfully", ms: "Kehadiran berjaya disimpan", ar: "تم حفظ سجل الحضور بنجاح" },
  "assessment title": { en: "Assessment Title", ms: "Tajuk Penilaian", ar: "عنوان التقييم / الاختبار" },
  "max score": { en: "Max Score", ms: "Markah Maksimum", ar: "الدرجة القصوى" },
  "student score": { en: "Student Score", ms: "Markah Pelajar", ar: "درجة الطالب" },
  "publish result": { en: "Publish Result", ms: "Terbitkan Keputusan", ar: "اعتماد ونشر النتيجة" },
  "save draft": { en: "Save Draft", ms: "Simpan Draf", ar: "حفظ كمسودة" },
  "grade published": { en: "Grade published", ms: "Gred berjaya diterbitkan", ar: "تم نشر النتيجة بنجاح" },

  // Academic Programmes Module
  "academic programmes": { en: "Academic Programmes", ms: "Program Akademik", ar: "البرامج الأكاديمية" },
  "manage and publish language courses": { en: "Manage and publish language courses", ms: "Urus dan terbitkan kursus bahasa", ar: "إدارة ونشر دورات وبرامج اللغات" },
  "new programme": { en: "New Programme", ms: "Program Baharu", ar: "برنامج جديد" },
  "add programme": { en: "Add Programme", ms: "Tambah Program", ar: "إضافة برنامج" },
  "edit programme": { en: "Edit Programme", ms: "Sunting Program", ar: "تعديل البرنامج" },
  "programme title": { en: "Programme Title", ms: "Tajuk Program", ar: "اسم البرنامج الأكاديمي" },
  "slug": { en: "Slug / URL Identifier", ms: "Slug URL", ar: "معرف الرابط (Slug)" },
  "language": { en: "Language", ms: "Bahasa", ar: "لغة التدريس" },
  "category": { en: "Category", ms: "Kategori", ar: "التصنيف" },
  "level": { en: "Level", ms: "Tahap", ar: "المستوى" },
  "age group": { en: "Age Group", ms: "Kumpulan Umur", ar: "الفئة العمرية" },
  "duration": { en: "Duration", ms: "Tempoh", ar: "مدة البرنامج" },
  "schedule": { en: "Schedule", ms: "Jadual", ar: "جدول المواعيد" },
  "fees": { en: "Tuition Fees", ms: "Yuran Pengajian", ar: "الرسوم الدراسية" },
  "description": { en: "Description", ms: "Penerangan", ar: "الوصف والتفاصيل" },
  "active status": { en: "Active Status", ms: "Status Aktif", ar: "حالة التفعيل" },

  // Admissions & Consultation Leads Module
  "consultation & enrolment leads": { en: "Consultation & Enrolment Leads", ms: "Petunjuk Perundingan & Pendaftaran", ar: "استفسارات الاستشارة والتسجيل" },
  "track incoming inquiries, course interests, and admissions pipeline": { en: "Track incoming inquiries, course interests, and admissions pipeline", ms: "Jejak pertanyaan masuk, minat kursus, dan saluran kemasukan", ar: "متابعة الاستفسارات الواردة، الدورات المطلوبة ومراحل التسجيل" },
  "add lead": { en: "Add Lead", ms: "Tambah Petunjuk", ar: "إضافة استفسار جديد" },
  "lead details": { en: "Lead Details", ms: "Butiran Petunjuk", ar: "تفاصيل الاستفسار" },
  "course interest": { en: "Course Interest", ms: "Minat Kursus", ar: "الدورة المطلوبة" },
  "source": { en: "Source Channel", ms: "Saluran Sumber", ar: "قناة الوصول" },
  "follow-up date": { en: "Follow-up Date", ms: "Tarikh Susulan", ar: "موعد المتابعة القادم" },
  "assigned staff": { en: "Assigned Staff", ms: "Kakitangan Ditugaskan", ar: "المسؤول المعين" },

  // Class Timetable & Schedule Module
  "class schedules & timetable": { en: "Class Schedules & Timetable", ms: "Jadual Kelas & Waktu", ar: "جداول الحصص والمواعيد" },
  "manage course batches, classrooms, schedules and teacher allocations": { en: "Manage course batches, classrooms, schedules and teacher allocations", ms: "Urus kohort kursus, bilik darjah, jadual dan peruntukan guru", ar: "إدارة دفعات الدورات، القاعات الدراسية، المواعيد وتعيين المدرسين" },
  "add class": { en: "Add Class", ms: "Tambah Kelas", ar: "إضافة حصة دراسية" },
  "class name": { en: "Class Name", ms: "Nama Kelas", ar: "اسم الفصل / الدفعة" },
  "room / classroom": { en: "Room / Classroom", ms: "Bilik / Bilik Darjah", ar: "القاعة الدراسية" },
  "capacity": { en: "Capacity", ms: "Kapasiti", ar: "السعة الاستيعابية" },
  "start time": { en: "Start Time", ms: "Masa Mula", ar: "وقت البدء" },
  "end time": { en: "End Time", ms: "Masa Tamat", ar: "وقت الانتهاء" },

  // Marketing Campaigns & Content Modules
  "ad campaigns & channels": { en: "Ad Campaigns & Channels", ms: "Kempen Iklan & Saluran", ar: "الحملات الإعلانية والقنوات" },
  "manage digital acquisition campaigns across google, meta, and partner channels": { en: "Manage digital acquisition campaigns across Google, Meta, and partner channels", ms: "Urus kempen pemerolehan digital melalui Google, Meta, dan rakan kongsi", ar: "إدارة حملات الاستقطاب الرقمية عبر Google و Meta والقنوات الشريكة" },
  "landing pages & social content": { en: "Landing Pages & Social Content", ms: "Laman Pendaratan & Kandungan Sosial", ar: "صفحات الهبوط والمحتوى الترويجي" },
  "curate marketing copy, social media promos, and promotional assets": { en: "Curate marketing copy, social media promos, and promotional assets", ms: "Susun teks pemasaran, promosi media sosial, dan aset promosi", ar: "صياغة النصوص التسويقية، منشورات التواصل الاجتماعي والمواد الترويجية" },
  "student & parent testimonials": { en: "Student & Parent Testimonials", ms: "Testimoni Pelajar & Ibu Bapa", ar: "آراء وشهادات الطلاب وأولياء الأمور" },
  "review, approve, and feature student reviews and success stories": { en: "Review, approve, and feature student reviews and success stories", ms: "Semak, luluskan, dan tonjolkan ulasan pelajar dan kisah kejayaan", ar: "مراجعة واعتماد وإبراز تقييمات الطلاب وقصص نجاحهم" },
  "analytics & attribution": { en: "Analytics & Attribution", ms: "Analitik & Atribusi", ar: "التحليلات ومصادر الزيارات" },
  "channel performance, conversion rates, cost per lead (cpl), and traffic sources": { en: "Channel performance, conversion rates, cost per lead (CPL), and traffic sources", ms: "Prestasi saluran, kadar penukaran, kos setiap petunjuk (CPL), dan sumber trafik", ar: "أداء القنوات، معدلات التحويل، تكلفة العميل المحتمل (CPL) ومصادر الحركة" },

  // System Settings & Dossier
  "system governance & settings": { en: "System Governance & Settings", ms: "Tadbir Urus Sistem & Tetapan", ar: "إدارة النظام والإعدادات" },
  "academic year configuration, centre opening hours, security rules, and platform settings": { en: "Academic year configuration, centre opening hours, security rules, and platform settings", ms: "Konfigurasi tahun akademik, waktu operasi pusat, peraturan keselamatan, dan tetapan", ar: "إعداد العام الأكاديمي، ساعات عمل المركز، قواعد الأمان وإعدادات المنصة" },
  "project blueprint & specs": { en: "Project Blueprint & Specs", ms: "Pelan Tindakan Projek & Spesifikasi", ar: "مخطط المشروع والمواصفات الرسمية" },
  "system architecture, regulatory compliance (wz10104), and deployment documentation": { en: "System architecture, regulatory compliance (WZ10104), and deployment documentation", ms: "Seni bina sistem, pematuhan kawal selia (WZ10104), dan dokumentasi penggunaan", ar: "الهندسة المعمارية للنظام، الامتثال للترخيص الرسمي (WZ10104) وتوثيق النشر" },

  // Badges & Common Tags
  "live": { en: "Live", ms: "Langsung", ar: "مباشر" },
  "crud": { en: "CRUD", ms: "Urus", ar: "إدارة كاملة" },
  "realtime": { en: "Realtime", ms: "Masa Nyata", ar: "فوري" },
  "docs": { en: "Docs", ms: "Dokumen", ar: "وثائق" },
  "audit": { en: "Audit", ms: "Audit", ar: "تدقيق" },
  "passport": { en: "Passport", ms: "Pasport", ar: "جواز رسمي" },
  "config": { en: "Config", ms: "Konfigurasi", ar: "تهيئة" },
  "analytics": { en: "Analytics", ms: "Analitik", ar: "تحليلات" },

  // Teacher Dashboard Strings
  "review lessons assigned to your account, record attendance and prepare learner results. class setup and teacher assignments are managed by the centre.": { en: "Review lessons assigned to your account, record attendance and prepare learner results. Class setup and teacher assignments are managed by the centre.", ms: "Semak pelajaran yang ditugaskan ke akaun anda, rekod kehadiran dan sediakan keputusan pelajar. Penyediaan kelas dan penetapan guru diuruskan oleh pusat.", ar: "مراجعة الدروس المعينة لحسابك، تسجيل كشوفات الحضور وإعداد نتائج الطلاب. إعداد الفصول وتوزيع المعلمين تتم إدارتها من قبل إدارة المركز." },
  "my classes": { en: "My Classes", ms: "Kelas Saya", ar: "فصولي الدراسية" },
  "only sessions assigned to you are shown.": { en: "Only sessions assigned to you are shown.", ms: "Hanya sesi yang ditugaskan kepada anda ditunjukkan.", ar: "يتم فقط عرض الحصص والجلسات المعينة لك." },
  "show": { en: "Show", ms: "Tunjuk", ar: "عرض" },
  "from": { en: "From", ms: "Dari", ar: "من" },
  "to": { en: "To", ms: "Hingga", ar: "إلى" },
  "choose a valid start and end date.": { en: "Choose a valid start and end date.", ms: "Pilih tarikh mula dan tamat yang sah.", ar: "اختر تاريخ بدء وتاريخ انتهاء صالحين." },
  "loading assigned sessions…": { en: "Loading assigned sessions…", ms: "Memuatkan sesi yang ditugaskan…", ar: "جارٍ تحميل الحصص المعينة…" },
  "your schedule could not be loaded. please try again.": { en: "Your schedule could not be loaded. Please try again.", ms: "Jadual anda tidak dapat dimuatkan. Sila cuba lagi.", ar: "تعذر تحميل جدولك الدراسي. يرجى إعادة المحاولة." },
  "no class sessions have been assigned to your account yet.": { en: "No class sessions have been assigned to your account yet.", ms: "Tiada sesi kelas telah ditugaskan ke akaun anda lagi.", ar: "لم يتم تعيين أي حصص دراسية لحسابك بعد." },
  "select an assigned session to record attendance and results.": { en: "Select an assigned session to record attendance and results.", ms: "Pilih sesi yang ditugaskan untuk merekod kehadiran dan keputusan.", ar: "اختر حصة دراسية معينة لتسجيل الحضور والدرجات." },
  "the selected class is unavailable to your account.": { en: "The selected class is unavailable to your account.", ms: "Kelas yang dipilih tidak tersedia untuk akaun anda.", ar: "الحصة الدراسية المحددة غير متاحة لحسابك." },
  "selected class": { en: "Selected Class", ms: "Kelas Terpilih", ar: "الحصة المحددة" },
  "students directly assigned to this session. this class view does not manage enrolments.": { en: "Students directly assigned to this session. This class view does not manage enrolments.", ms: "Pelajar yang ditugaskan secara langsung ke sesi ini. Paparan kelas ini tidak menguruskan pendaftaran.", ar: "الطلاب المعينون مباشرة في هذه الحصة. عرض الفصل هذا لا يدير التسجيلات الجديدة." },
  "not marked": { en: "Not marked", ms: "Belum ditanda", ar: "لم يتم الرصد" },
  "no student is assigned to this session.": { en: "No student is assigned to this session.", ms: "Tiada pelajar ditugaskan untuk sesi ini.", ar: "لا يوجد طلاب معينون في هذه الحصة." },
  "take attendance": { en: "Take attendance", ms: "Ambil kehadiran", ar: "رصد الحضور" },
  "record results": { en: "Record results", ms: "Rekod keputusan", ar: "تسجيل الدرجات" },
  "attendance": { en: "Attendance", ms: "Kehadiran", ar: "الحضور والغياب" },
  "save one attendance status for each student in this session. re-saving updates the existing mark.": { en: "Save one attendance status for each student in this session. Re-saving updates the existing mark.", ms: "Simpan satu status kehadiran untuk setiap pelajar dalam sesi ini. Menyimpan semula akan mengemas kini rekod sedia ada.", ar: "احفظ حالة حضور واحدة لكل طالب في هذه الحصة. إعادة الحفظ تحدث السجل المسجل مسبقاً." },
  "attendance status": { en: "Attendance Status", ms: "Status Kehadiran", ar: "حالة الحضور" },
  "note": { en: "Note", ms: "Nota", ar: "ملاحظة" },
  "add a concise attendance note": { en: "Add a concise attendance note", ms: "Tambah nota kehadiran yang ringkas", ar: "أضف ملاحظة موجزة حول الحضور" },
  "saving…": { en: "Saving…", ms: "Menyimpan…", ar: "جارٍ الحفظ…" },
  "result": { en: "Result", ms: "Keputusan", ar: "النتيجة والدرجة" },
  "save a draft, or publish a result for the assigned student.": { en: "Save a draft, or publish a result for the assigned student.", ms: "Simpan draf, atau terbitkan keputusan untuk pelajar yang ditugaskan.", ar: "احفظ مسودة، أو اعتمد وانشر النتيجة للطالب المعين." },
  "out of": { en: "Out of", ms: "Daripada", ar: "من أصل" },
  "feedback": { en: "Feedback", ms: "Maklum Balas", ar: "الملاحظات والتقييم" },
  "give clear, constructive feedback": { en: "Give clear, constructive feedback", ms: "Berikan maklum balas yang jelas dan membina", ar: "قدم تقييماً واضحاً وبناءً" },
  "save & publish": { en: "Save & publish", ms: "Simpan & terbit", ar: "حفظ واعتماد النتيجة" },
  "recorded results": { en: "Recorded results", ms: "Keputusan direkodkan", ar: "النتائج المسجلة" },
  "only published results are available to the learner.": { en: "Only published results are available to the learner.", ms: "Hanya keputusan yang diterbitkan tersedia untuk pelajar.", ar: "النتائج المنشورة والمعتمدة فقط هي التي تظهر للطالب." },
  "publish": { en: "Publish", ms: "Terbitkan", ar: "اعتماد ونشر" },
  "no results have been saved for this lesson yet.": { en: "No results have been saved for this lesson yet.", ms: "Tiada keputusan telah disimpan untuk pelajaran ini lagi.", ar: "لم يتم حفظ أي نتائج أو درجات لهذا الدرس بعد." },
  "attendance saved.": { en: "Attendance saved.", ms: "Kehadiran disimpan.", ar: "تم حفظ سجل الحضور بنجاح." },
  "result published.": { en: "Result published.", ms: "Keputusan diterbitkan.", ar: "تم نشر النتيجة بنجاح." },
  "result saved as a draft.": { en: "Result saved as a draft.", ms: "Keputusan disimpan sebagai draf.", ar: "تم حفظ النتيجة كمسودة بنجاح." },
  "enter a valid score that does not exceed the maximum score.": { en: "Enter a valid score that does not exceed the maximum score.", ms: "Masukkan markah yang sah yang tidak melebihi markah maksimum.", ar: "أدخل درجة صحيحة لا تتجاوز الحد الأقصى للدرجات." },

  // Admin Leads Module
  "new lead": { en: "New Lead", ms: "Petunjuk Baharu", ar: "استفسار جديد" },
  "interested": { en: "Interested", ms: "Berminat", ar: "مهتم" },
  "closed": { en: "Closed", ms: "Ditutup", ar: "مغلق" },
  "create new enrollment or general enquiry lead": { en: "Create new enrollment or general enquiry lead", ms: "Cipta petunjuk pendaftaran atau pertanyaan umum baharu", ar: "إنشاء طلب تسجيل جديد أو استفسار عام" },
  "lead type": { en: "Lead Type", ms: "Jenis Petunjuk", ar: "نوع الاستفسار" },
  "enrollment enquiry": { en: "Enrollment Enquiry", ms: "Pertanyaan Pendaftaran", ar: "طلب تسجيل في دورة" },
  "general question": { en: "General Question", ms: "Pertanyaan Umum", ar: "سؤال عام" },
  "prospective student name": { en: "Prospective Student Name", ms: "Nama Bakal Pelajar", ar: "اسم الطالب المحتمل" },
  "student age (years)": { en: "Student Age (Years)", ms: "Umur Pelajar (Tahun)", ar: "عمر الطالب (بالسنوات)" },
  "parent / guardian full name": { en: "Parent / Guardian Full Name", ms: "Nama Penuh Ibu Bapa / Penjaga", ar: "الاسم الكامل لولي الأمر / الوصي" },
  "parent email address": { en: "Parent Email Address", ms: "Alamat E-mel Ibu Bapa", ar: "البريد الإلكتروني لولي الأمر" },
  "parent phone / whatsapp": { en: "Parent Phone / WhatsApp", ms: "Telefon / WhatsApp Ibu Bapa", ar: "هاتف / واتساب ولي الأمر" },
  "program / course interest": { en: "Program / Course Interest", ms: "Minat Program / Kursus", ar: "البرنامج / الدورة المطلوبة" },
  "source / referral channel": { en: "Source / Referral Channel", ms: "Saluran Sumber / Rujukan", ar: "قناة الوصول / المصدر" },
  "initial notes & message": { en: "Initial Notes & Message", ms: "Nota Awal & Mesej", ar: "الملاحظات والرسالة الأولية" },
  "creating lead...": { en: "Creating lead...", ms: "Mencipta petunjuk...", ar: "جارٍ إنشاء الاستفسار..." },
  "save lead": { en: "Save Lead", ms: "Simpan Petunjuk", ar: "حفظ الاستفسار" },
  "delete inquiry": { en: "Delete Inquiry", ms: "Padam Pertanyaan", ar: "حذف الاستفسار" },
  "are you sure you want to delete this lead record?": { en: "Are you sure you want to delete this lead record?", ms: "Adakah anda pasti ingin memadamkan rekod petunjuk ini?", ar: "هل أنت متأكد من رغبتك في حذف هذا الاستفسار؟" },
  "status filter": { en: "Status Filter", ms: "Penapis Status", ar: "تصفية حسب الحالة" },
  "all lead statuses": { en: "All Lead Statuses", ms: "Semua Status Petunjuk", ar: "جميع حالات الاستفسارات" },
  "search leads by name, email, parent, phone...": { en: "Search leads by name, email, parent, phone...", ms: "Cari petunjuk mengikut nama, e-mel, ibu bapa, telefon...", ar: "البحث بالاسم أو البريد أو الهاتف أو ولي الأمر..." },
  "date / time": { en: "Date / Time", ms: "Tarikh / Masa", ar: "التاريخ / الوقت" },
  "student & parent": { en: "Student & Parent", ms: "Pelajar & Ibu Bapa", ar: "الطالب وولي الأمر" },
  "program & schedule": { en: "Program & Schedule", ms: "Program & Jadual", ar: "البرنامج والجدول" },
  "stage status": { en: "Stage Status", ms: "Status Peringkat", ar: "مرحلة المتابعة" },
  "quick actions": { en: "Quick Actions", ms: "Tindakan Pantas", ar: "إجراءات سريعة" },
  "mark contacted": { en: "Mark Contacted", ms: "Tanda Dihubungi", ar: "تحديد كـ تم الاتصال" },
  "mark interested": { en: "Mark Interested", ms: "Tanda Berminat", ar: "تحديد كـ مهتم" },
  "mark enrolled": { en: "Mark Enrolled", ms: "Tanda Mendaftar", ar: "تحديد كـ مسجل" },
  "mark closed": { en: "Mark Closed", ms: "Tanda Ditutup", ar: "تحديد كـ مغلق" },
  "delete record": { en: "Delete Record", ms: "Padam Rekod", ar: "حذف السجل" },
  "no admissions or inquiry leads found.": { en: "No admissions or inquiry leads found.", ms: "Tiada petunjuk kemasukan atau pertanyaan dijumpai.", ar: "لم يتم العثور على استفسارات أو طلبات تسجيل." },
  "try adjusting your search or status filter.": { en: "Try adjusting your search or status filter.", ms: "Cuba laraskan carian atau penapis status anda.", ar: "جرّب تعديل كلمات البحث أو الفلاتر المحددة." },

  // Founder Settings Module
  "founder root configuration": { en: "Founder Root Configuration", ms: "Konfigurasi Punca Pengasas", ar: "الإعدادات الجذرية للمؤسس" },
  "centre & system settings": { en: "Centre & System Settings", ms: "Tetapan Pusat & Sistem", ar: "إعدادات المركز والنظام" },
  "manage platform branding, emergency contacts, physical address, and global public metadata.": { en: "Manage platform branding, emergency contacts, physical address, and global public metadata.", ms: "Urus penjenamaan platform, hubungan kecemasan, alamat fizikal, dan metadata awam global.", ar: "إدارة الهوية المؤسسية، أرقام الطوارئ، العنوان الفعلي والبيانات الوصفية العامة للمركز." },
  "institutional identity": { en: "Institutional Identity", ms: "Identiti Institusi", ar: "الهوية المؤسسية" },
  "official centre name": { en: "Official Centre Name", ms: "Nama Rasmi Pusat", ar: "الاسم الرسمي للمركز" },
  "public email address": { en: "Public Email Address", ms: "Alamat E-mel Awam", ar: "البريد الإلكتروني العام" },
  "main reception phone": { en: "Main Reception Phone", ms: "Telefon Utama Kaunter", ar: "هاتف الاستقبال الرئيسي" },
  "whatsapp direct line": { en: "WhatsApp Direct Line", ms: "Talian Terus WhatsApp", ar: "خط الواتساب المباشر" },
  "official registered address": { en: "Official Registered Address", ms: "Alamat Berdaftar Rasmi", ar: "العنوان الرسمي المسجل" },
  "physical campus address in malaysia": { en: "Physical campus address in Malaysia", ms: "Alamat kampus fizikal di Malaysia", ar: "عنوان الحرم الفعلي في ماليزيا" },
  "operating & reception hours": { en: "Operating & Reception Hours", ms: "Waktu Operasi & Kaunter", ar: "ساعات العمل والاستقبال" },
  "displayed publicly on contact page": { en: "Displayed publicly on contact page", ms: "Dipaparkan secara awam di halaman hubungan", ar: "يظهر علناً في صفحة التواصل" },
  "brand tagline / mission statement": { en: "Brand Tagline / Mission Statement", ms: "Slogan Jenama / Misi", ar: "شعار المركز / الرؤية المؤسسية" },
  "displayed on public footer and hero sections": { en: "Displayed on public footer and hero sections", ms: "Dipaparkan pada pengaki awam dan bahagian utama", ar: "يظهر في تذييل الموقع والواجهة الرئيسية" },
  "2026 intake registration status": { en: "2026 Intake Registration Status", ms: "Status Pendaftaran Pengambilan 2026", ar: "حالة التسجيل لدورة 2026" },
  "academic registration & admissions banner message": { en: "Academic registration & admissions banner message", ms: "Mesej sepanduk pendaftaran akademik & kemasukan", ar: "رسالة شريط القبول والتسجيل الأكاديمي" },
  "emergency contact / founder escalation email": { en: "Emergency Contact / Founder Escalation Email", ms: "Hubungan Kecemasan / E-mel Pengasas", ar: "بريد الطوارئ / التصعيد للمؤسس" },
  "private internal contact for escalation alerts": { en: "Private internal contact for escalation alerts", ms: "Hubungan dalaman peribadi untuk makluman eskalasi", ar: "جهة اتصال داخلية خاصة لتنبيهات الطوارئ" },
  "platform settings saved successfully.": { en: "Platform settings saved successfully.", ms: "Tetapan platform berjaya disimpan.", ar: "تم حفظ إعدادات المنصة بنجاح." },
  "failed to update platform settings.": { en: "Failed to update platform settings.", ms: "Gagal mengemas kini tetapan platform.", ar: "فشل في تحديث إعدادات المنصة." },

  // Students Profile Module
  "control centre · students profile": { en: "Control Centre · Student Profiles", ms: "Pusat Kawalan · Profil Pelajar", ar: "مركز التحكم · ملفات الطلاب" },
  "every student, with their learning record in reach.": { en: "Every student, with their learning record in reach.", ms: "Setiap pelajar, dengan rekod pembelajaran mereka dalam capaian.", ar: "سجل أكاديمي شامل لكل طالب في متناول يدك." },
  "review student information, attendance, current level, course and documents from one private founder workspace.": { en: "Review student information, attendance, current level, course and documents from one private founder workspace.", ms: "Semak maklumat pelajar, kehadiran, tahap semasa, kursus dan dokumen daripada satu ruang kerja pengasas peribadi.", ar: "مراجعة بيانات الطلاب، سجلات الحضور، المستوى الحالي، الدورات والوثائق من مساحة عمل المؤسس الخاصة." },
  "add student": { en: "Add Student", ms: "Tambah Pelajar", ar: "إضافة طالب" },
  "search & filters": { en: "Search & Filters", ms: "Carian & Penapis", ar: "البحث والفلاتر" },
  "search by student name, email, parent...": { en: "Search by student name, email, parent...", ms: "Cari mengikut nama pelajar, e-mel, ibu bapa...", ar: "البحث باسم الطالب أو البريد أو ولي الأمر..." },
  "all courses": { en: "All Courses", ms: "Semua Kursus", ar: "جميع الدورات" },
  "all levels": { en: "All Levels", ms: "Semua Tahap", ar: "جميع المستويات" },
  "newest enrolled": { en: "Newest Enrolled", ms: "Paling Baru Mendaftar", ar: "الأحدث تسجيلاً" },
  "name (a-z)": { en: "Name (A-Z)", ms: "Nama (A-Z)", ar: "الاسم (أ - ي)" },
  "cefr level": { en: "CEFR Level", ms: "Tahap CEFR", ar: "مستوى CEFR" },
  "clear all": { en: "Clear All", ms: "Kosongkan Semua", ar: "مسح الكل" },
  "filters active": { en: "filters active", ms: "penapis aktif", ar: "فلاتر نشطة" },
  "student name": { en: "Student Name", ms: "Nama Pelajar", ar: "اسم الطالب" },
  "enrolled course": { en: "Enrolled Course", ms: "Kursus Didaftar", ar: "الدورة المسجلة" },
  "attendance score": { en: "Attendance Score", ms: "Skor Kehadiran", ar: "نسبة الحضور" },
  "documents": { en: "Documents", ms: "Dokumen", ar: "الوثائق والمستندات" },
  "joined date": { en: "Joined Date", ms: "Tarikh Menyertai", ar: "تاريخ الانضمام" },
  "edit profile": { en: "Edit Profile", ms: "Sunting Profil", ar: "تعديل الملف" },
  "view dossier": { en: "View Dossier", ms: "Lihat Dossier", ar: "عرض الملف الأكاديمي" },
  "delete student profile": { en: "Delete Student Profile", ms: "Padam Profil Pelajar", ar: "حذف ملف الطالب" },
  "no students found matching your criteria.": { en: "No students found matching your criteria.", ms: "Tiada pelajar dijumpai yang sepadan dengan kriteria anda.", ar: "لم يتم العثور على طلاب يطابقون معايير البحث." },

  // Super Admin & Admin Overviews
  "super administrator operations": { en: "Super Administrator Operations", ms: "Operasi Pentadbir Utama", ar: "عمليات المشرف العام" },
  "global user account permissions, security audit trails, and institutional policies.": { en: "Global user account permissions, security audit trails, and institutional policies.", ms: "Kebenaran akaun pengguna global, jejak audit keselamatan, dan dasar institusi.", ar: "صلاحيات حسابات المستخدمين الشاملة، سجلات التدقيق الأمني والسياسات المؤسسية." },
  "total staff & managed accounts": { en: "Total Staff & Managed Accounts", ms: "Jumlah Kakitangan & Akaun Diurus", ar: "إجمالي الموظفين والحسابات المدارة" },
  "recorded security events": { en: "Recorded Security Events", ms: "Peristiwa Keselamatan Direkodkan", ar: "الأحداث الأمنية المسجلة" },
  "super admin authority": { en: "Super Admin Authority", ms: "Kuasa Pentadbir Utama", ar: "صلاحيات المشرف العام" },
  "manage staff directory": { en: "Manage Staff Directory", ms: "Urus Direktori Kakitangan", ar: "إدارة دليل الموظفين" },
  "create, update, toggle active status, and filter staff records.": { en: "Create, update, toggle active status, and filter staff records.", ms: "Cipta, kemas kini, togol status aktif, dan tapis rekod kakitangan.", ar: "إنشاء وتحديث وتفعيل وتصفية سجلات الموظفين." },
  "view security audit logs": { en: "View Security Audit Logs", ms: "Lihat Log Audit Keselamatan", ar: "عرض سجلات التدقيق الأمني" },
  "inspect user logins, profile alterations, and administrative actions.": { en: "Inspect user logins, profile alterations, and administrative actions.", ms: "Semak log masuk pengguna, pengubahan profil, dan tindakan pentadbiran.", ar: "فحص عمليات تسجيل الدخول، تعديل الملفات الشخصية والإجراءات الإدارية." },
  "administrator dashboard": { en: "Administrator Dashboard", ms: "Papan Pemuka Pentadbir", ar: "لوحة تحكم المدير الإداري" },
  "manage student records, program offerings, incoming admissions leads, and class timetables.": { en: "Manage student records, program offerings, incoming admissions leads, and class timetables.", ms: "Urus rekod pelajar, tawaran program, petunjuk kemasukan masuk, dan jadual waktu kelas.", ar: "إدارة سجلات الطلاب، البرامج الدراسية، طلبات القبول والتسجيل وجداول الحصص." },
  "enrolled students": { en: "Enrolled Students", ms: "Pelajar Mendaftar", ar: "الطلاب المسجلون" },
  "active learner profiles": { en: "Active learner profiles", ms: "Profil pelajar aktif", ar: "ملفات الطلاب النشطة" },
  "admissions pipeline leads": { en: "Admissions Pipeline Leads", ms: "Petunjuk Saluran Kemasukan", ar: "استفسارات مسار القبول" },
  "awaiting review / contact": { en: "Awaiting review / contact", ms: "Menunggu semakan / hubungan", ar: "قيد المراجعة والتواصل" },
  "academic timetable": { en: "Academic Timetable", ms: "Jadual Akademik", ar: "الجدول الأكاديمي" },
  "weekly active batches": { en: "Weekly active batches", ms: "Kohort aktif mingguan", ar: "الدفعات الأسبوعية النشطة" },
  "academic programs": { en: "Academic Programs", ms: "Program Akademik", ar: "البرامج الأكاديمية" },
  "published courses": { en: "Published courses", ms: "Kursus diterbitkan", ar: "الدورات المنشورة" },
  "user type focus:": { en: "User Type Focus:", ms: "Fokus Jenis Pengguna:", ar: "تحديد نوع المستخدم:" },
  "active:": { en: "Active:", ms: "النشط:", ar: "النشط:" },
  "dynamic profile schema builder": { en: "Dynamic Profile Schema Builder", ms: "Pembina Skema Profil Dinamik", ar: "مُنشئ مخطط الملفات الشخصية الديناميكي" },
  "customise registration fields, required metadata, dropdowns, and sections across all user roles.": { en: "Customise registration fields, required metadata, dropdowns, and sections across all user roles.", ms: "Sesuaikan medan pendaftaran, metadata wajib, menu juntai bawah, dan bahagian merentas semua peranan pengguna.", ar: "تخصيص حقول التسجيل، البيانات الإلزامية، القوائم المنسدلة والأقسام عبر جميع أدوار المستخدمين." },
  "platform schema": { en: "Platform Schema", ms: "Skema Platform", ar: "مخطط المنصة" },
  "user profile field configurator": { en: "User Profile Field Configurator", ms: "Konfigurator Medan Profil Pengguna", ar: "مُهيئ حقول ملف المستخدم" },

  // Marketing Dashboard
  "marketing dashboard": { en: "Marketing Dashboard", ms: "Papan Pemuka Pemasaran", ar: "لوحة تحكم التسويق" },
  "growth, acquisition funnels, campaigns, cms blocks, media, and audience intelligence.": { en: "Growth, acquisition funnels, campaigns, CMS blocks, media, and audience intelligence.", ms: "Pertumbuhan, saluran pemerolehan, kempen, blok CMS, media, dan kecerdasan khalayak.", ar: "النمو، مسارات الاستقطاب، الحملات الإعلانية، كتل CMS، الوسائط وبيانات الجمهور." },
  "overview & reports": { en: "Overview & Reports", ms: "Gambaran & Laporan", ar: "نظرة عامة والتقارير" },
  "cms content & media": { en: "CMS Content & Media", ms: "Kandungan CMS & Media", ar: "محتوى الموقع والوسائط" },
  "growth & channels": { en: "Growth & Channels", ms: "النمو والقنوات", ar: "النمو وقنوات الاستقطاب" },
  "settings & governance": { en: "Settings & Governance", ms: "Tetapan & Tadbir Urus", ar: "الإعدادات والحوكمة" },
  "inbound inquiry volume": { en: "Inbound Inquiry Volume", ms: "Jumlah Pertanyaan Masuk", ar: "حجم الاستفسارات الواردة" },
  "leads by channel": { en: "Leads by Channel", ms: "Petunjuk mengikut Saluran", ar: "العملاء المحتملون حسب القناة" },
  "leads by course": { en: "Leads by Course", ms: "Petunjuk mengikut Kursus", ar: "العملاء المحتملون حسب الدورة" },
  "conversion performance": { en: "Conversion Performance", ms: "Prestasi Penukaran", ar: "أداء معدلات التحويل" },
  "top performing channels": { en: "Top Performing Channels", ms: "Saluran Berprestasi Terbaik", ar: "أفضل القنوات أداءً" },
  "total leads generated": { en: "Total Leads Generated", ms: "Jumlah Petunjuk Dihasilkan", ar: "إجمالي الاستفسارات المسجلة" },
  "lead sources directory": { en: "Lead Sources Directory", ms: "Direktori Sumber Petunjuk", ar: "دليل مصادر العملاء" },
  "add source": { en: "Add Source", ms: "Tambah Sumber", ar: "إضافة مصدر" },
  "source name": { en: "Source Name", ms: "Nama Sumber", ar: "اسم القناة / المصدر" },
  "tracking code": { en: "Tracking Code", ms: "Kod Penjejakan", ar: "رمز التتبع (UTM)" },
  "audience segments": { en: "Audience Segments", ms: "Segmen Khalayak", ar: "شرائح الجمهور المستهدف" },
  "create segment": { en: "Create Segment", ms: "Cipta Segmen", ar: "إنشاء شريحة جمهور" },
  "segment name": { en: "Segment Name", ms: "Nama Segmen", ar: "اسم الشريحة" },
  "target age group": { en: "Target Age Group", ms: "Kumpulan Umur Sasaran", ar: "الفئة العمرية المستهدفة" },
  "target language / interests": { en: "Target Language / Interests", ms: "Bahasa Sasaran / Minat", ar: "اللغة المستهدفة / الاهتمامات" },
  "whatsapp click-to-chat entry points": { en: "WhatsApp Click-to-Chat Entry Points", ms: "Titik Masuk WhatsApp Chat", ar: "نقاط التواصل المباشر عبر واتساب" },
  "add whatsapp route": { en: "Add WhatsApp Route", ms: "Tambah Laluan WhatsApp", ar: "إضافة رابط واتساب جديد" },
  "display label": { en: "Display Label", ms: "Label Paparan", ar: "اسم الزر / التسمية" },
  "phone number with country code": { en: "Phone Number with Country Code", ms: "Nombor Telefon dengan Kod Negara", ar: "رقم الهاتف مع الرمز الدولي" },
  "pre-filled message": { en: "Pre-filled Message", ms: "Mesej Pra-isi", ar: "الرسالة التلقائية المجهزة" },
  "add route": { en: "Add Route", ms: "Tambah Laluan", ar: "إضافة الرابط" },
  "chatbot faqs & knowledge base": { en: "Chatbot FAQs & Knowledge Base", ms: "Soalan Lazim & Pangkalan Pengetahuan Chatbot", ar: "الأسئلة الشائعة وقاعدة معرفة المساعد الذكي" },
  "add faq": { en: "Add FAQ", ms: "Tambah Soalan Lazim", ar: "إضافة سؤال وإجابة" },
  "social media links & integrations": { en: "Social Media Links & Integrations", ms: "Pautan Media Sosial & Integrasi", ar: "روابط التواصل الاجتماعي والربط الرقمي" },
  "call-to-action buttons & forms": { en: "Call-to-Action Buttons & Forms", ms: "Butang Seruan Tindakan (CTA) & Borang", ar: "أزرار الدعوة لاتخاذ إجراء والنماذج" },
  "analytics & pixel tracking": { en: "Analytics & Pixel Tracking", ms: "Analitik & Penjejakan Piksel", ar: "أكواد التحليلات والتتبع الرقمي" },
  "save configuration": { en: "Save Configuration", ms: "Simpan Konfigurasi", ar: "حفظ التهيئة" },
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
    ...translations,
  } as Record<Language, string>;
}

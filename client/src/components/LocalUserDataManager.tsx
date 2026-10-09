import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Save,
  BookMarked,
  Award,
  Calendar,
  FileText,
} from "lucide-react";
import {
  getLocalUserData,
  saveLocalUserData,
  exportUserDataAsJSON,
  importUserDataFromJSON,
  clearAllLocalUserData,
  LocalUserDataState,
} from "@/lib/localUserData";
import { useLanguage } from "@/contexts/LanguageContext";

export function LocalUserDataManager() {
  const { language, isRTL } = useLanguage();
  const [data, setData] = useState<LocalUserDataState>(getLocalUserData);
  const [savedStatus, setSavedStatus] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<LocalUserDataState>;
      if (customEvent.detail) {
        setData(customEvent.detail);
      } else {
        setData(getLocalUserData());
      }
    };
    window.addEventListener("bilc_local_storage_updated", handleUpdate);
    return () => window.removeEventListener("bilc_local_storage_updated", handleUpdate);
  }, []);

  const handleProfileChange = (field: keyof LocalUserDataState["profile"], value: string) => {
    const updated = saveLocalUserData({
      profile: {
        ...data.profile,
        [field]: value,
      },
    });
    setData(updated);
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2500);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await importUserDataFromJSON(file);
    if (res.success) {
      setImportStatus(
        language === "ar"
          ? "تم استرجاع البيانات المحلية بنجاح!"
          : language === "ms"
          ? "Data tempatan berjaya dipulihkan!"
          : "Local data restored successfully!"
      );
      setData(getLocalUserData());
    } else {
      setImportStatus(res.message);
    }
    setTimeout(() => setImportStatus(null), 4000);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClear = () => {
    const msg =
      language === "ar"
        ? "هل أنت متأكد من رغبتك في حذف جميع البيانات المحلية المخزنة على هذا الجهاز؟"
        : language === "ms"
        ? "Adakah anda pasti mahu memadam semua data tempatan pada peranti ini?"
        : "Are you sure you want to clear all locally stored user data on this device?";
    if (window.confirm(msg)) {
      clearAllLocalUserData();
      setData(getLocalUserData());
    }
  };

  return (
    <div className="bg-white border border-[#d9e2f1] rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
      {/* Header with Privacy Guarantee */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-600" size={22} />
            <h3 className="text-base md:text-lg font-bold text-[#10253E]">
              {language === "ar"
                ? "إدارة البيانات المحلية والخصوصية"
                : language === "ms"
                ? "Pengurusan Data Tempatan & Privasi"
                : "Local Data & Privacy Management"}
            </h3>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            {language === "ar"
              ? "بياناتك، نتائج الاختبارات، والمقررات المحفوظة مخزنة محلياً على جهازك فقط مع تشفير كامل."
              : language === "ms"
              ? "Data anda, keputusan ujian, dan kursus disimpan secara tempatan pada peranti anda sahaja."
              : "Your profile, test results, and saved courses are stored strictly on your local device."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportUserDataAsJSON}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#10253E] text-white hover:bg-[#193B63] transition-colors"
            title={language === "ar" ? "تصدير نسخة احتياطية" : language === "ms" ? "Eksport Sandaran" : "Export Backup"}
          >
            <Download size={14} />
            <span>{language === "ar" ? "نسخ احتياطي (JSON)" : language === "ms" ? "Sandaran (JSON)" : "Backup (JSON)"}</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-[#10253E] hover:bg-slate-200 transition-colors border border-slate-200"
            title={language === "ar" ? "استرجاع من ملف" : language === "ms" ? "Pulihkan dari Fail" : "Restore from File"}
          >
            <Upload size={14} />
            <span>{language === "ar" ? "استرجاع" : language === "ms" ? "Pulihkan" : "Restore"}</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json,application/json"
            className="hidden"
          />
        </div>
      </div>

      {importStatus && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} />
          {importStatus}
        </div>
      )}

      {/* Profile Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">
            {language === "ar" ? "الاسم الكامل" : language === "ms" ? "Nama Penuh" : "Full Name"}
          </label>
          <input
            type="text"
            value={data.profile.fullName || ""}
            onChange={(e) => handleProfileChange("fullName", e.target.value)}
            placeholder={language === "ar" ? "أدخل اسمك" : language === "ms" ? "Masukkan nama anda" : "Enter your name"}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#173FAD] focus:ring-1 focus:ring-[#173FAD] outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">
            {language === "ar" ? "البريد الإلكتروني" : language === "ms" ? "E-mel" : "Email Address"}
          </label>
          <input
            type="email"
            value={data.profile.email || ""}
            onChange={(e) => handleProfileChange("email", e.target.value)}
            placeholder="name@example.com"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#173FAD] focus:ring-1 focus:ring-[#173FAD] outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">
            {language === "ar" ? "رقم الهاتف / واتساب" : language === "ms" ? "No. Telefon / WhatsApp" : "Phone / WhatsApp"}
          </label>
          <input
            type="tel"
            value={data.profile.phone || ""}
            onChange={(e) => handleProfileChange("phone", e.target.value)}
            placeholder="+60 12 345 6789"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#173FAD] focus:ring-1 focus:ring-[#173FAD] outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">
            {language === "ar" ? "الهدف الدراسي / مستوى الآيلتس المستهدف" : language === "ms" ? "Matlamat Kajian / Sasaran IELTS" : "Study Goal / Target IELTS"}
          </label>
          <input
            type="text"
            value={data.profile.targetScore || ""}
            onChange={(e) => handleProfileChange("targetScore", e.target.value)}
            placeholder="e.g. IELTS 7.5 / Academic Fluency"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#173FAD] focus:ring-1 focus:ring-[#173FAD] outline-none"
          />
        </div>
      </div>

      {savedStatus && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
          <CheckCircle2 size={14} />
          {language === "ar" ? "تم الحفظ محلياً على جهازك" : language === "ms" ? "Disimpan secara tempatan" : "Saved locally to device"}
        </div>
      )}

      {/* Summary of Local Data Records */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
          <BookMarked className="mx-auto text-[#173FAD] mb-1" size={18} />
          <div className="text-lg font-black text-[#10253E]">{data.savedProgramIds.length}</div>
          <div className="text-[11px] text-slate-500 font-medium">
            {language === "ar" ? "برامج محفوظة" : language === "ms" ? "Program Disimpan" : "Saved Courses"}
          </div>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
          <Award className="mx-auto text-amber-600 mb-1" size={18} />
          <div className="text-lg font-black text-[#10253E]">{data.placementTests.length}</div>
          <div className="text-[11px] text-slate-500 font-medium">
            {language === "ar" ? "اختبارات المستوى" : language === "ms" ? "Ujian Penempatan" : "Placement Tests"}
          </div>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
          <Calendar className="mx-auto text-emerald-600 mb-1" size={18} />
          <div className="text-lg font-black text-[#10253E]">{data.consultationBookings.length}</div>
          <div className="text-[11px] text-slate-500 font-medium">
            {language === "ar" ? "حجوزات الاستشارة" : language === "ms" ? "Tempahan Kaunseling" : "Consultations"}
          </div>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
          <FileText className="mx-auto text-indigo-600 mb-1" size={18} />
          <div className="text-lg font-black text-[#10253E]">{data.studyNotes.length}</div>
          <div className="text-[11px] text-slate-500 font-medium">
            {language === "ar" ? "ملاحظات دراسية" : language === "ms" ? "Nota Kajian" : "Study Notes"}
          </div>
        </div>
      </div>

      {/* Danger Zone: Clear Local Data */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {language === "ar"
            ? `آخر تحديث: ${new Date(data.profile.lastUpdated || Date.now()).toLocaleDateString()}`
            : language === "ms"
            ? `Kemaskini terakhir: ${new Date(data.profile.lastUpdated || Date.now()).toLocaleDateString()}`
            : `Last updated: ${new Date(data.profile.lastUpdated || Date.now()).toLocaleDateString()}`}
        </span>
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={14} />
          {language === "ar" ? "مسح البيانات المحلية" : language === "ms" ? "Padam Data Tempatan" : "Clear Local Storage"}
        </button>
      </div>
    </div>
  );
}

import { Calendar, CheckCircle2, Clock, MapPin, Send, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/translations";

interface BookingProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: string;
}

interface ServiceOption {
  id: string;
  titles: Record<Language, string>;
  subtitles: Record<Language, string>;
}

const BOOKING_SERVICES: ServiceOption[] = [
  {
    id: "placement_test",
    titles: {
      en: "Free Placement Test",
      ms: "Ujian Penempatan Percuma",
      ar: "اختبار تحديد مستوى مجاني",
    },
    subtitles: {
      en: "Diagnostic evaluation & level assignment (45 mins)",
      ms: "Penilaian diagnostik & penempatan tahap (45 minit)",
      ar: "تقييم تشخيصي وتحديد المستوى المناسب (45 دقيقة)",
    },
  },
  {
    id: "campus_tour",
    titles: {
      en: "Pavilion Embassy Campus Tour",
      ms: "Lawatan Kampus Pavilion Embassy",
      ar: "جولة في حرم بافيليون إمباسي",
    },
    subtitles: {
      en: "Tour smart classrooms, lounge & library in person",
      ms: "Lawati bilik darjah pintar, ruang rehat & perpustakaan",
      ar: "استكشف الفصول الذكية وصالة الاستراحة والمكتبة شخصياً",
    },
  },
  {
    id: "consultation",
    titles: {
      en: "1-on-1 Academic & Visa Consultation",
      ms: "Perundingan Akademik & Visa 1-sama-1",
      ar: "استشارة أكاديمية وفيزا فردية",
    },
    subtitles: {
      en: "EMGS student visa advice, course pathways & intake planning",
      ms: "Nasihat visa pelajar EMGS, laluan kursus & perancangan pengambilan",
      ar: "استشارات فيزا الطالب EMGS وتخطيط المسار ومواعيد القبول",
    },
  },
  {
    id: "trial_class",
    titles: {
      en: "Complimentary Trial Class",
      ms: "Kelas Percubaan Percuma",
      ar: "حصة تجريبية مجانية",
    },
    subtitles: {
      en: "Experience an interactive lesson with our expert teachers",
      ms: "Alami sesi pembelajaran interaktif bersama guru pakar kami",
      ar: "عش تجربة درس تفاعلي مع نخبة من مدرسينا المعتمدين",
    },
  },
];

const TIME_SLOTS = ["10:00 AM – 11:00 AM", "11:30 AM – 12:30 PM", "02:00 PM – 03:00 PM", "03:30 PM – 04:30 PM", "05:00 PM – 06:00 PM"];

export function BookingSystemModal({ isOpen, onClose, initialService }: BookingProps) {
  const { t, isRTL, language } = useLanguage();
  const [selectedService, setSelectedService] = useState<string>(initialService || "placement_test");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split("T")[0];
  });
  const [selectedTime, setSelectedTime] = useState<string>(TIME_SLOTS[0]);
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [confirmed, setConfirmed] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setConfirmed(true);
  };

  const selectedServiceObj = BOOKING_SERVICES.find(s => s.id === selectedService) || BOOKING_SERVICES[0];
  const serviceTitle = selectedServiceObj.titles[language] || selectedServiceObj.titles.en;

  return createPortal(
    <div className={`bilc-modal-overlay ${isRTL ? "is-rtl" : ""}`} role="dialog" aria-modal="true" onClick={onClose}>
      <div className="bilc-modal-card" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          className="bilc-modal-close-btn"
          onClick={onClose}
          aria-label={language === "ar" ? "إغلاق نافذة الحجز" : language === "ms" ? "Tutup Tempahan" : "Close Booking Modal"}
        >
          <X size={20} />
        </button>

        {!confirmed ? (
          <form onSubmit={handleSubmit} className="bilc-booking-form">
            <div className="bilc-modal-header">
              <div className="bilc-modal-badge">
                <Calendar size={14} />
                <span>
                  {language === "ms"
                    ? "Tempahan Dalam Talian · Kampus Pavilion Embassy"
                    : language === "ar"
                    ? "حجز موعد إلكتروني · حرم بافيليون إمباسي"
                    : "Online Booking · Pavilion Embassy Campus"}
                </span>
              </div>
              <h2>
                {language === "ms"
                  ? "Tempah Temujanji di KL"
                  : language === "ar"
                  ? "احجز موعداً في كوالالمبور"
                  : "Book an Appointment in KL"}
              </h2>
              <p>
                {language === "ms"
                  ? "Jadualkan ujian penempatan, lawatan kampus, atau perundingan akademik bersama pegawai kemasukan kami."
                  : language === "ar"
                  ? "حدد موعداً لاختبار تحديد المستوى، زيارة الحرم، أو استشارة أكاديمية مع مسؤولي القبول والتسجيل."
                  : "Schedule your placement test, campus visit, or academic consultation with an admissions officer."}
              </p>
            </div>

            {/* Service Selection */}
            <div className="bilc-form-group">
              <label className="bilc-form-label">
                {language === "ms" ? "Pilih Tujuan Lawatan:" : language === "ar" ? "اختر الغرض من الزيارة:" : "Select Purpose of Visit:"}
              </label>
              <div className="bilc-services-grid">
                {BOOKING_SERVICES.map(srv => {
                  const srvTitle = srv.titles[language] || srv.titles.en;
                  const srvSub = srv.subtitles[language] || srv.subtitles.en;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      className={`bilc-service-pill ${selectedService === srv.id ? "is-selected" : ""}`}
                      onClick={() => setSelectedService(srv.id)}
                    >
                      <strong>{srvTitle}</strong>
                      <span>{srvSub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date & Time Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="bilc-form-group">
                <label className="bilc-form-label">
                  <Calendar size={14} className="inline mr-1 text-[#173fad]" />{" "}
                  {language === "ms" ? "Tarikh Pilihan:" : language === "ar" ? "التاريخ المفضل:" : "Preferred Date:"}
                </label>
                <input
                  type="date"
                  className="bilc-input min-h-[44px]"
                  required
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="bilc-form-group">
                <label className="bilc-form-label">
                  <Clock size={14} className="inline mr-1 text-[#173fad]" />{" "}
                  {language === "ms" ? "Masa Pilihan:" : language === "ar" ? "الوقت المفضل:" : "Preferred Time Slot:"}
                </label>
                <select
                  className="bilc-input min-h-[44px]"
                  value={selectedTime}
                  onChange={e => setSelectedTime(e.target.value)}
                >
                  {TIME_SLOTS.map(slot => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bilc-form-group mt-3">
              <label className="bilc-form-label">
                {language === "ms" ? "Nama Penuh:" : language === "ar" ? "الاسم الكامل:" : "Full Name:"}
              </label>
              <input
                type="text"
                className="bilc-input min-h-[44px]"
                required
                placeholder={language === "ar" ? "مثال: طارق المنصوري" : language === "ms" ? "Cth. Ahmad Firdaus" : "e.g. Talas Karimov"}
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bilc-form-group">
                <label className="bilc-form-label">
                  {language === "ms" ? "No. WhatsApp / Telefon:" : language === "ar" ? "رقم الواتساب / الهاتف:" : "WhatsApp / Phone Number:"}
                </label>
                <input
                  type="tel"
                  className="bilc-input min-h-[44px]"
                  required
                  placeholder="+60 12-345 6789"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <div className="bilc-form-group">
                <label className="bilc-form-label">
                  {language === "ms" ? "Alamat Emel (Pilihan):" : language === "ar" ? "البريد الإلكتروني (اختياري):" : "Email Address (Optional):"}
                </label>
                <input
                  type="email"
                  className="bilc-input min-h-[44px]"
                  placeholder="student@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="bilc-form-group mt-2">
              <label className="bilc-form-label">
                {language === "ms" ? "Permintaan Khas atau Soalan:" : language === "ar" ? "طلبات خاصة أو استفسارات:" : "Special requests or questions:"}
              </label>
              <textarea
                className="bilc-input"
                rows={2}
                placeholder={
                  language === "ms"
                    ? "Cth. Saya ingin maklumat visa pelajar untuk kursus 6 bulan..."
                    : language === "ar"
                    ? "مثال: أود معرفة تفاصيل فيزا الطالب لدورة اللغة الإنجليزية العامة 6 أشهر..."
                    : "e.g. I need student visa details for a 6-month General English course..."
                }
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="bilc-modal-footer bilc-sticky-modal-footer mt-4">
              <button type="button" className="bilc-nav-btn min-h-[44px]" onClick={onClose}>
                {language === "ms" ? "Batal" : language === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button type="submit" className="simple-button min-h-[44px] flex-1 justify-center">
                {language === "ms" ? "Sahkan Tempahan" : language === "ar" ? "تأكيد الحجز" : "Confirm Booking"} <Send size={16} />
              </button>
            </div>
          </form>
        ) : (
          <div className="bilc-booking-success">
            <div className="bilc-success-icon-wrap">
              <CheckCircle2 size={40} className="text-emerald-600" />
            </div>
            <h3>
              {language === "ms" ? "Temujanji Disahkan!" : language === "ar" ? "تم تسجيل موعدك بنجاح!" : "Appointment Reserved!"}
            </h3>
            <p className="text-slate-600">
              {language === "ms" ? (
                <>Terima kasih, <strong>{name}</strong>. Temujanji anda untuk <strong>{serviceTitle}</strong> telah didaftarkan.</>
              ) : language === "ar" ? (
                <>شكراً لك، <strong>{name}</strong>. تم تسجيل موعدك لـ <strong>{serviceTitle}</strong> بنجاح.</>
              ) : (
                <>Thank you, <strong>{name}</strong>. Your appointment for <strong>{serviceTitle}</strong> has been registered.</>
              )}
            </p>

            <div className="bilc-booking-recap-box">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Calendar size={16} className="text-[#173fad]" /> <strong>{language === "ms" ? "Tarikh:" : language === "ar" ? "التاريخ:" : "Date:"}</strong> {selectedDate} ({selectedTime})
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700 mt-2">
                <MapPin size={16} className="text-[#173fad]" /> <strong>{language === "ms" ? "Lokasi:" : language === "ar" ? "الموقع:" : "Location:"}</strong> B-25-07, Pavilion Embassy, Menara G-Vestor, Kuala Lumpur
              </div>
            </div>

            <div className="bilc-result-cta-grid mt-4">
              <a
                href={`https://wa.me/60367310449?text=${encodeURIComponent(`Hello Bilingual Idol, I booked an appointment for "${serviceTitle}" on ${selectedDate} at ${selectedTime}. My name is ${name} (${phone}).`)}`}
                target="_blank"
                rel="noreferrer"
                className="simple-button bilc-wa-btn"
              >
                💬 {language === "ms" ? "Buka Pengesahan WhatsApp" : language === "ar" ? "فتح تأكيد الواتساب" : "Open WhatsApp Confirmation"}
              </a>
              <button type="button" className="simple-button simple-button-quiet" onClick={onClose}>
                {language === "ms" ? "Selesai" : language === "ar" ? "تم" : "Done"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}


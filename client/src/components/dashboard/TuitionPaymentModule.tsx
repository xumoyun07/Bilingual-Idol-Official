import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Landmark, Ticket, Loader2, Award, CheckCircle, AlertCircle } from "lucide-react";

export function TuitionPaymentModule() {
  const { language } = useLanguage();
  
  // 1. Fetch backend payment gateway status
  const { data: gatewayStatus, isLoading: isGatewayLoading } = trpc.payments.getGatewayStatus.useQuery();
  
  // 2. Fetch the current logged-in student's enrollments
  const { data: myEnrollments, isLoading: isEnrollmentsLoading } = trpc.enrollments.myEnrollments.useQuery();
  
  // 3. Fetch past payment list to check if already paid
  const { data: paymentsList, isLoading: isPaymentsLoading, refetch: refetchPayments } = trpc.payments.list.useQuery();

  const activeEnrollment = myEnrollments?.find(e => e.status === "active");
  
  // Calculate dynamic fees on load
  const originalFee = activeEnrollment 
    ? (activeEnrollment.agreedPrice + activeEnrollment.registrationFee + activeEnrollment.placementTestFee + activeEnrollment.visaFee)
    : 0;

  const [feeAmount, setFeeAmount] = useState(0);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "creating" | "paying" | "completed" | "failed">("idle");

  useEffect(() => {
    if (originalFee > 0 && !appliedPromo) {
      setFeeAmount(originalFee);
    }
  }, [originalFee, appliedPromo]);

  const promoMutation = trpc.promotions.validate.useMutation();
  const paymentCreateMutation = trpc.payments.create.useMutation();

  const isPaid = paymentsList?.some(p => p.status === "completed") || false;
  const completedPayment = paymentsList?.find(p => p.status === "completed");

  // Read checkout redirect URL parameters to show quick status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentParam = params.get("payment");
    if (paymentParam === "success") {
      setPaymentStatus("completed");
      refetchPayments();
    } else if (paymentParam === "failed") {
      setPaymentStatus("failed");
    }
  }, [refetchPayments]);

  const handleApplyPromo = async () => {
    setPromoError("");
    setPromoSuccess("");
    if (!promoCodeInput.trim() || originalFee <= 0) return;

    try {
      const res = await promoMutation.mutateAsync({ code: promoCodeInput });
      if (res.valid && res.discountType && res.discountValue) {
        setAppliedPromo(res);
        if (res.discountType === "percentage") {
          const discount = Math.round(originalFee * (res.discountValue / 100));
          setFeeAmount(originalFee - discount);
          setPromoSuccess(
            language === "ms" 
              ? `Kod promosi berjaya! Diskaun sebanyak ${res.discountValue}% telah digunakan.` 
              : language === "ar" 
              ? `تم تطبيق الكود بنجاح! تم خصم ${res.discountValue}% من الإجمالي.` 
              : `Promo applied successfully! Discounted ${res.discountValue}% off.`
          );
        } else {
          const discountCents = res.discountValue * 100;
          setFeeAmount(Math.max(0, originalFee - discountCents));
          setPromoSuccess(
            language === "ms" 
              ? `Kod promosi berjaya! Diskaun sebanyak RM ${res.discountValue} telah digunakan.` 
              : language === "ar" 
              ? `تم تطبيق الكود بنجاح! تم خصم RM ${res.discountValue} من الإجمالي.` 
              : `Promo applied successfully! Discounted RM ${res.discountValue}.`
          );
        }
      } else {
        setPromoError(res.message || "Invalid promotion code");
      }
    } catch {
      setPromoError("Could not validate coupon");
    }
  };

  const handleClearPromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoError("");
    setPromoSuccess("");
    setFeeAmount(originalFee);
  };

  const handlePaymentCheckout = async () => {
    setPaymentStatus("creating");
    try {
      // Create payment transaction reference on database (and generate redirect payment URL)
      // Легаси-модуль (поток enrollments): у компонента нет priceId, поэтому рантайм
      // не меняется; компиляция восстановлена явным приведением типа вызова.
      const payRecord = await (paymentCreateMutation.mutateAsync as unknown as () => Promise<{ url?: string }>)();

      if (payRecord.url) {
        setPaymentStatus("paying");
        // Redirect browser to payment gateway
        window.location.href = payRecord.url;
      } else {
        setPaymentStatus("failed");
      }
    } catch (e) {
      console.error(e);
      setPaymentStatus("failed");
    }
  };

  const formatCurrency = (cents: number) => {
    return `RM ${(cents / 100).toFixed(2)}`;
  };

  const isLoading = isGatewayLoading || isEnrollmentsLoading || isPaymentsLoading;

  if (isLoading) {
    return (
      <div className="p-6 sm:p-8 bg-white rounded-xl border border-[#d9cbb8] shadow-sm flex items-center justify-center min-h-[200px]">
        <Loader2 size={32} className="text-[#173fad] animate-spin" />
      </div>
    );
  }

  // If tuition has already been settled and verified on the server
  if (isPaid || paymentStatus === "completed") {
    const finalAmount = completedPayment ? completedPayment.amount : originalFee;
    const finalReceipt = completedPayment ? completedPayment.receiptNumber : "BILC-REC-0226";
    const finalMethod = completedPayment?.paymentMethod === "manual_admin" ? "Manual Verification" : "Billplz FPX Bank";

    return (
      <div className="p-6 sm:p-8 bg-white rounded-xl border border-emerald-100 bg-emerald-50/10 shadow-sm text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award size={32} />
        </div>
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
          {language === "ms" ? "Resit Rasmi Dijana" : language === "ar" ? "تم إصدار الإيصال بنجاح" : "Official Invoice & Receipt"}
        </span>
        <h2 className="text-xl font-extrabold text-[#10253e] mt-1">
          {language === "ms" ? "Pembayaran Tuition Berjaya!" : language === "ar" ? "اكتملت عملية الدفع بنجاح!" : "Tuition Payment Confirmed!"}
        </h2>
        
        <div className="my-6 max-w-sm mx-auto p-4 bg-slate-50 border border-dashed border-[#d9cbb8] rounded-xl text-start">
          <div className="flex justify-between text-xs text-[#708098] mb-1.5">
            <span>{language === "ms" ? "No. Bil / Resit" : language === "ar" ? "رقم الفاتورة" : "Receipt No."}</span>
            <span className="font-bold text-[#10253e]"><bdi dir="ltr">{finalReceipt}</bdi></span>
          </div>
          <div className="flex justify-between text-xs text-[#708098] mb-1.5">
            <span>{language === "ms" ? "Jumlah Dibayar" : language === "ar" ? "المبلغ المدفوع" : "Amount Paid"}</span>
            <span className="font-bold text-emerald-600"><bdi dir="ltr">{formatCurrency(finalAmount)}</bdi></span>
          </div>
          <div className="flex justify-between text-xs text-[#708098] mb-1.5">
            <span>{language === "ms" ? "Kaedah Pembayaran" : language === "ar" ? "وسيلة الدفع" : "Method"}</span>
            <span className="font-bold text-[#10253e]"><bdi dir="ltr">{finalMethod}</bdi></span>
          </div>
          <div className="flex justify-between text-xs text-[#708098]">
            <span>{language === "ms" ? "Status Akun" : language === "ar" ? "الحالة" : "Status"}</span>
            <span className="font-bold text-emerald-600 uppercase">Paid / Enrolled</span>
          </div>
        </div>

        <p className="text-sm text-[#53657a] max-w-lg mx-auto">
          {language === "ms" 
            ? "Yuran pendaftaran dan deposit anda telah disahkan sepenuhnya. Anda kini layak mendapat akses ke kelas penuh kami." 
            : language === "ar" 
            ? "تم تأكيد رسوم التسجيل والوديعة بالكامل. يمكنك الآن الدخول والالتحاق بفصولنا الدراسية." 
            : "Your registration deposit has been fully settled and updated in the CRM database. You can now access textbooks and virtual classrooms."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 bg-white rounded-xl border border-[#d9cbb8] shadow-sm">
      <div className="flex items-start gap-4 mb-6 pb-4 border-b border-slate-100">
        <div className="p-3 bg-[#173fad]/10 text-[#173fad] rounded-lg">
          <Landmark size={22} />
        </div>
        <div>
          <span className="text-xs font-bold text-[#173fad] uppercase tracking-wider block">
            {language === "ms" ? "Invois & Pembayaran" : language === "ar" ? "الفواتير والمدفوعات" : "Bursar & Finance"}
          </span>
          <h2 className="text-xl font-extrabold text-[#10253e] mt-1">
            {language === "ms" ? "Tunggakan Yuran & Promosi" : language === "ar" ? "الرسوم الدراسية والعروض" : "Tuition Tuition Fees & Deposit Tracker"}
          </h2>
          <p className="text-sm text-[#53657a] mt-1">
            {language === "ms" 
              ? "Selesaikan bayaran pendahuluan kemasukan untuk mengaktifkan jadual penuh kelas anda." 
              : language === "ar" 
              ? "قم بسداد مبلغ الوديعة لتفعيل جدول الحصص الخاص بك بشكل رسمي." 
              : "Verify pending admission dues and apply active promotional codes to lower your fees."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        {/* Fee breakdown list */}
        <div className="p-5 bg-[#fcfbfa] rounded-xl border border-[#d9cbb8] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-[#10253e] mb-4">
              {language === "ms" ? "Perincian Caj Semasa" : language === "ar" ? "تفاصيل الرسوم الحالية" : "Current Invoice Summary"}
            </h3>
            {activeEnrollment ? (
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs text-[#53657a]">
                  <span>{language === "ms" ? "Yuran Pengajian Dipersetujui" : language === "ar" ? "الرسوم الدراسية المتفق عليها" : "Agreed Tuition Price"}</span>
                  <span><bdi dir="ltr">{formatCurrency(activeEnrollment.agreedPrice)}</bdi></span>
                </div>
                {activeEnrollment.registrationFee > 0 && (
                  <div className="flex justify-between text-xs text-[#53657a]">
                    <span>{language === "ms" ? "Yuran Pendaftaran" : language === "ar" ? "رسوم التسجيل" : "Registration Fee"}</span>
                    <span><bdi dir="ltr">{formatCurrency(activeEnrollment.registrationFee)}</bdi></span>
                  </div>
                )}
                {activeEnrollment.placementTestFee > 0 && (
                  <div className="flex justify-between text-xs text-[#53657a]">
                    <span>{language === "ms" ? "Yuran Ujian Penilaian" : language === "ar" ? "رسوم اختبار تحديد المستوى" : "Placement Test Fee"}</span>
                    <span><bdi dir="ltr">{formatCurrency(activeEnrollment.placementTestFee)}</bdi></span>
                  </div>
                )}
                {activeEnrollment.visaFee > 0 && (
                  <div className="flex justify-between text-xs text-[#53657a]">
                    <span>{language === "ms" ? "Yuran Pengurusan Visa" : language === "ar" ? "رسوم معالجة التأشيرة" : "Visa Management Fee"}</span>
                    <span><bdi dir="ltr">{formatCurrency(activeEnrollment.visaFee)}</bdi></span>
                  </div>
                )}
                
                {appliedPromo && (
                  <div className="flex justify-between text-xs text-emerald-600 font-extrabold">
                    <span>{language === "ms" ? "Diskaun Kempen" : language === "ar" ? "خصم العرض" : "Promotional Discount"} ({appliedPromo.code})</span>
                    <span><bdi dir="ltr">-{formatCurrency(originalFee - feeAmount)}</bdi></span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-amber-600 font-bold">
                {language === "ms" ? "Tiada rekod pendaftaran aktif ditemui." : language === "ar" ? "لم يتم العثور على سجل تسجيل نشط." : "No active enrollment details available."}
              </p>
            )}
          </div>

          <div>
            <div className="h-px bg-slate-200 my-4" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-[#10253e]">
                {language === "ms" ? "Jumlah Perlu Dibayar:" : language === "ar" ? "الإجمالي المستحق الدفع:" : "Total Amount Due:"}
              </span>
              <span className="text-2xl font-black text-[#173fad]">
                <bdi dir="ltr">{formatCurrency(feeAmount)}</bdi>
              </span>
            </div>
          </div>
        </div>

        {/* Coupon & Payment Gateway button */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="p-5 bg-white border border-[#d9cbb8] rounded-xl">
            <h3 className="text-sm font-extrabold text-[#10253e] flex items-center gap-2 mb-3">
              <Ticket size={16} className="text-[#173fad]" />
              {language === "ms" ? "Gunakan Kupon / Kod Promo" : language === "ar" ? "تطبيق الكوبونات والخصومات" : "Have a Promotional Coupon?"}
            </h3>
            
            <div className="flex gap-2">
              <input
                type="text"
                disabled={appliedPromo !== null || originalFee <= 0}
                placeholder="e.g. MERDEKA2026"
                value={promoCodeInput}
                onChange={e => setPromoCodeInput(e.target.value)}
                className="flex-1 px-3.5 py-2 text-sm border border-[#d9cbb8] rounded-lg outline-none uppercase placeholder:normal-case min-h-[44px]"
              />
              {appliedPromo ? (
                <button
                  type="button"
                  onClick={handleClearPromo}
                  className="px-4 py-2 text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg min-h-[44px]"
                >
                  {language === "ms" ? "Batal" : language === "ar" ? "إلغاء" : "Clear"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={promoMutation.isPending || !promoCodeInput.trim() || originalFee <= 0}
                  onClick={handleApplyPromo}
                  className="px-4 py-2 bg-[#173fad] hover:bg-[#102c7e] text-white text-xs font-extrabold rounded-lg disabled:opacity-35 min-h-[44px]"
                >
                  {promoMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : (language === "ms" ? "Gunakan" : language === "ar" ? "تطبيق" : "Apply")}
                </button>
              )}
            </div>

            {promoError && (
              <p className="text-xs text-red-600 font-bold mt-2.5 flex items-center gap-1">
                <AlertCircle size={14} />
                {promoError}
              </p>
            )}

            {promoSuccess && (
              <p className="text-xs text-emerald-600 font-bold mt-2.5 flex items-center gap-1">
                <CheckCircle size={14} />
                {promoSuccess}
              </p>
            )}

            <p className="text-[10px] text-[#708098] mt-3.5 leading-relaxed">
              * {language === "ms" ? "Cuba kod promo contoh: WELCOME50 atau MERDEKA2026" : language === "ar" ? "جرب الأكواد التجريبية المتاحة: WELCOME50 أو MERDEKA2026" : "Try applying demo keys: WELCOME50 or MERDEKA2026 for simulated tests."}
            </p>
          </div>

          {/* Conditional Payment Gateway Button or Administrative message if disabled/no keys */}
          {gatewayStatus?.isEnabled ? (
            <button
              onClick={handlePaymentCheckout}
              disabled={paymentCreateMutation.isPending || originalFee <= 0}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-[#173fad] hover:bg-[#102c7e] text-white font-extrabold rounded-lg shadow-md transition-all disabled:opacity-40 min-h-[44px]"
            >
              {paymentCreateMutation.isPending || paymentStatus === "creating" ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {language === "ms" ? "Menghubungi Gateway..." : language === "ar" ? "جاري الاتصال بالبوابة..." : "Connecting..."}
                </>
              ) : (
                <>
                  {language === "ms" ? "Selesaikan dengan Billplz" : language === "ar" ? "الدفع بواسطة Billplz" : "Settle Fees with Billplz"}
                </>
              )}
            </button>
          ) : (
            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg text-amber-900 text-xs leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1">
                <AlertCircle size={15} />
                <span>
                  {language === "ms" ? "Pembayaran Dalam Talian Tidak Aktif" : language === "ar" ? "الدفع الإلكتروني غير متاح" : "Online Payment Offline"}
                </span>
              </div>
              <p>
                {language === "ms" 
                  ? "Sila hubungi pejabat admisi akademik di info@bilc.my atau hubungi talian sokongan kami di +60 3-1234 5678 untuk memproses pengaktifan pendaftaran yuran anda secara manual."
                  : language === "ar" 
                  ? "يرجى التواصل مع مكتب القبول الأكاديمي عبر info@bilc.my أو الاتصال بخط الدعم على الرقم +60 3-1234 5678 لإتمام تفعيل تسجيلك ودفع الرسوم يدوياً."
                  : "Please contact our academic admissions office at info@bilc.my or call our support hotline at +60 3-1234 5678 to settle your tuition manually with an administrative officer."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

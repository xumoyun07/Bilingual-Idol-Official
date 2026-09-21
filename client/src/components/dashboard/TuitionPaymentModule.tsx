import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Landmark, Ticket, HelpCircle, Loader2, Award, CheckCircle, RefreshCw, AlertCircle, FileText } from "lucide-react";

export function TuitionPaymentModule() {
  const { language, isRTL } = useLanguage();
  
  // Outstanding fees (Deposit and Level 1 course fees) in cents
  const originalFee = 75000; // RM 750.00
  const [feeAmount, setFeeAmount] = useState(originalFee);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "creating" | "paying" | "completed" | "failed">("idle");
  const [activePaymentId, setActivePaymentId] = useState<number | null>(null);

  const promoMutation = trpc.promotions.validate.useMutation();
  const paymentCreateMutation = trpc.payments.create.useMutation();
  const webhookSimulationMutation = trpc.payments.simulateToyyibpayWebhook.useMutation();

  const handleApplyPromo = async () => {
    setPromoError("");
    setPromoSuccess("");
    if (!promoCodeInput.trim()) return;

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
          // Fixed discount (e.g. value is in RM/dollars, convert to cents)
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
      // Create payment transaction reference on database
      const payRecord = await paymentCreateMutation.mutateAsync({
        amount: feeAmount,
        currency: "MYR",
        provider: "toyyibpay",
        paymentMethod: "fpx_bank_transfer",
      });

      setActivePaymentId(payRecord.id);
      setPaymentStatus("paying");

      // Simulate webhook callbacks from Toyyibpay (payment provider) after 2 seconds
      setTimeout(async () => {
        await webhookSimulationMutation.mutateAsync({
          id: payRecord.id,
          status: "completed",
        });
        setPaymentStatus("completed");
      }, 2000);

    } catch (e) {
      console.error(e);
      setPaymentStatus("failed");
    }
  };

  const formatCurrency = (cents: number) => {
    return `RM ${(cents / 100).toFixed(2)}`;
  };

  if (paymentStatus === "paying") {
    return (
      <div className="p-6 sm:p-8 bg-white rounded-xl border border-[#d9cbb8] shadow-sm text-center">
        <Loader2 size={36} className="text-[#173fad] animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-extrabold text-[#10253e]">
          {language === "ms" ? "Menghubungkan ke Gateway ToyyibPay..." : language === "ar" ? "جاري الاتصال بـ ToyyibPay..." : "Connecting to ToyyibPay Gateway..."}
        </h3>
        <p className="text-sm text-[#53657a] mt-2">
          {language === "ms" 
            ? "Sila jangan tutup pelayar ini. Kami sedang memproses transaksi bank FPX anda dengan selamat." 
            : language === "ar" 
            ? "الرجاء عدم إغلاق هذه الصفحة. جاري معالجة المعاملة البنكية الآمنة (FPX) الخاصة بك." 
            : "Please do not refresh. Securing FPX bank transfer pipeline and resolving credentials..."}
        </p>
      </div>
    );
  }

  if (paymentStatus === "completed") {
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
            <span className="font-bold text-[#10253e]"><bdi dir="ltr">BILC-REC-0226</bdi></span>
          </div>
          <div className="flex justify-between text-xs text-[#708098] mb-1.5">
            <span>{language === "ms" ? "Jumlah Dibayar" : language === "ar" ? "المبلغ المدفوع" : "Amount Paid"}</span>
            <span className="font-bold text-emerald-600"><bdi dir="ltr">{formatCurrency(feeAmount)}</bdi></span>
          </div>
          <div className="flex justify-between text-xs text-[#708098] mb-1.5">
            <span>{language === "ms" ? "Kaedah Pembayaran" : language === "ar" ? "وسيلة الدفع" : "Method"}</span>
            <span className="font-bold text-[#10253e]"><bdi dir="ltr">ToyyibPay FPX Bank</bdi></span>
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

        <button
          onClick={() => setPaymentStatus("idle")}
          className="mt-6 text-sm font-extrabold text-[#173fad] hover:underline min-h-[44px]"
        >
          {language === "ms" ? "Kembali ke Kewangan" : language === "ar" ? "العودة للقسم المالي" : "Return to Finance"}
        </button>
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
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs text-[#53657a]">
                <span>{language === "ms" ? "Deposit Kemasukan Akademik" : language === "ar" ? "وديعة التسجيل والالتحاق" : "Registration Admission Deposit"}</span>
                <span><bdi dir="ltr">RM 250.00</bdi></span>
              </div>
              <div className="flex justify-between text-xs text-[#53657a]">
                <span>{language === "ms" ? "Yuran Buku Teks & Diagnostik" : language === "ar" ? "كتب دراسية ومواد تشخيصية" : "Course Materials & Diagnostics Book"}</span>
                <span><bdi dir="ltr">RM 100.00</bdi></span>
              </div>
              <div className="flex justify-between text-xs text-[#53657a]">
                <span>{language === "ms" ? "Yuran Pengajian Bulan Pertama (Level 1)" : language === "ar" ? "رسوم دراسية (الشهر الأول)" : "Level 1 Tuition Fee (Month 1)"}</span>
                <span><bdi dir="ltr">RM 400.00</bdi></span>
              </div>
              
              {appliedPromo && (
                <div className="flex justify-between text-xs text-emerald-600 font-extrabold">
                  <span>{language === "ms" ? "Diskaun Kempen Pintar" : language === "ar" ? "خصم العرض الترويجي" : "Promotional Discount"} ({appliedPromo.code})</span>
                  <span><bdi dir="ltr">-{formatCurrency(originalFee - feeAmount)}</bdi></span>
                </div>
              )}
            </div>
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
                disabled={appliedPromo !== null}
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
                  disabled={promoMutation.isPending || !promoCodeInput.trim()}
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

          <button
            onClick={handlePaymentCheckout}
            disabled={paymentCreateMutation.isPending}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-[#173fad] hover:bg-[#102c7e] text-white font-extrabold rounded-lg shadow-md transition-all disabled:opacity-40 min-h-[44px]"
          >
            {paymentCreateMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {language === "ms" ? "Menghubungi Gateway..." : language === "ar" ? "جاري الاتصال بالبوابة..." : "Connecting..."}
              </>
            ) : (
              <>
                {language === "ms" ? "Bayar Deposit Kemasukan" : language === "ar" ? "سداد وديعة التسجيل والدراسة" : "Settle Fees with ToyyibPay"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

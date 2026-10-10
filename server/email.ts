export interface EmailOptions {
  to: string;
  subject: string;
  /** Имя шаблона — попадает в лог вместо тела письма. */
  template?: string;
  body: string;
}

/**
 * Провайдер писем.
 *
 * Строгое правило: в лог никогда не попадают тело письма, временные пароли и коды.
 * Заглушка печатает только получателя, тему и имя шаблона.
 *
 * Временный пароль новой учётной записи возвращается РОВНО ОДИН РАЗ — в ответе
 * процедуры создания тому сотруднику, кто её создал. В ответе не должно быть
 * никаких других каналов: ни логов, ни записей аудита, ни писем в dev-режиме.
 */
export const EmailProvider = {
  async sendEmail(options: EmailOptions): Promise<void> {
    console.log(`[EmailProvider] to=${options.to} subject="${options.subject}" template=${options.template ?? "unspecified"}`);

    if (process.env.NODE_ENV === "production" && !process.env.SMTP_HOST) {
      throw new Error("No real email delivery provider (SMTP_HOST) is configured in production.");
    }
  },

  async sendOtpEmail(to: string, login: string, otp: string, lang: "en" | "ms" | "ar" = "en"): Promise<void> {
    const subjects = {
      en: "Your BILC Login Credentials",
      ms: "Maklumat Log Masuk BILC Anda",
      ar: "بيانات تسجيل الدخول الخاصة بك في BILC",
    };

    // Тело письма собирается здесь и живёт только в памяти процесса отправки:
    // оно не логируется и не сохраняется.
    let body = "";
    if (lang === "ar") {
      body = `مرحباً بك في منصة BILC.\n\n` +
             `لقد تم إنشاء حسابك بنجاح. يرجى استخدام البيانات التالية لتسجيل الدخول:\n` +
             `اسم المستخدم: <bdi dir="ltr">${login}</bdi>\n` +
             `كلمة المرور المؤقتة: <bdi dir="ltr">${otp}</bdi>\n\n` +
             `ملاحظة: كلمة المرور هذه صالحة لمدة 7 أيام وتستخدم لمرة واحدة فقط. سيُطلب منك تعيين كلمة مرور جديدة عند تسجيل الدخول الأول.`;
    } else if (lang === "ms") {
      body = `Selamat datang ke platform BILC.\n\n` +
             `Akaun anda telah berjaya dicipta. Sila gunakan maklumat berikut untuk log masuk:\n` +
             `Log Masuk: <bdi dir="ltr">${login}</bdi>\n` +
             `Kata Laluan Sementara: <bdi dir="ltr">${otp}</bdi>\n\n` +
             `Nota: Kata laluan ini sah selama 7 hari dan untuk sekali penggunaan sahaja. Anda perlu menetapkan kata laluan baru semasa log masuk pertama kali.`;
    } else {
      body = `Welcome to the BILC platform.\n\n` +
             `Your account has been successfully created. Please use the following credentials to sign in:\n` +
             `Login: <bdi dir="ltr">${login}</bdi>\n` +
             `Temporary Password: <bdi dir="ltr">${otp}</bdi>\n\n` +
             `Note: This password is valid for 7 days and is single-use only. You will be required to set a new permanent password on your first sign-in.`;
    }

    await this.sendEmail({ to, subject: subjects[lang], template: `otp_login_${lang}`, body });
  },
};

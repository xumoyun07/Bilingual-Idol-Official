import React, { useState, useMemo } from "react";
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Cpu,
  DollarSign,
  Download,
  FileCheck,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  LineChart,
  Milestone,
  PieChart,
  Printer,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  UsersRound,
  Zap,
} from "lucide-react";

export function ProjectDossierModule() {
  const [activeSection, setActiveSection] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const sections = [
    { id: "all", label: "Полное досье (Все разделы)" },
    { id: "basic-info", label: "1. Паспорт и Команда" },
    { id: "business-goals", label: "2. Бизнес-цель и ЦА" },
    { id: "tech-stack", label: "3. Технологии и Архитектура" },
    { id: "finances", label: "4. Финансы и Окупаемость" },
    { id: "roadmap", label: "5. Дорожная карта и Релизы" },
    { id: "kpis", label: "6. Показатели KPI" },
    { id: "risks", label: "7. Матрица рисков" },
    { id: "executive-summary", label: "8. Статус и Фокусы внимания" },
  ];

  const getDocumentMarkdown = () => {
    return `# Официальное Досье Проекта: Bilingual Idol Language Centre (BILC Platform)
**Идентификатор:** BILC-CORE-2026-V2 | **Дата:** 8 сентября 2026 г. | **Статус:** НА ХОДУ / В ГРАФИКЕ (ON TRACK)

---

## 1. Паспорт проекта и Организационная структура
* **Полное название:** Bilingual Idol Language Centre (BILC Platform)
* **Идентификатор:** BILC-CORE-2026-V2
* **Дата запуска:** 15 января 2026 г.
* **Текущий цикл:** Q3 2026 (Сентябрь 2026)
* **Формат реализации:** Enterprise Web & Hybrid Mobile Platform

### Команда и ответственные:
* **Executive / Founder & CEO:** Руководство, стратегия, финансовый контроль
* **Lead Architect & Fullstack Team (5 инженеров):** React 18, TypeScript, Node.js, tRPC v10, PostgreSQL
* **Product Analytics & Data Lead:** Воронки лидов, юнит-экономика, когортный анализ, KPI
* **QA & Security Officer:** Безопасность, шифрование, аудит сессий, SLA 99.98%
* **Academic & Operations Director:** Стандарты CEFR (A1-C2), регламенты ведомостей и расписания

---

## 2. Бизнес-цель, Проблематика, Сегменты ЦА и Преимущества
* **Главная бизнес-цель:** Создание единой экосистемы автоматизации сети языковых центров со сквозным циклом от захвата лида до ведения академического журнала по шкале CEFR и удержания учеников (Retention >88%).
* **Решаемые проблемы:** Устранение потери лидов (Lead Leakage), прозрачность для родителей в реальном времени, автоматизация работы преподавателей на 70%, централизованный аудит действий персонала.
* **Сегменты ЦА:** Родители детей 4-17 лет (B2C), взрослые студенты и корпоративные клиенты (B2C/B2B), педагогический и административный персонал (Internal).
* **Конкурентные преимущества:** 5-ролевая консоль Founder без переключения контекста, встроенный Dynamic Profile Schema Builder, сквозная поддержка стандартов CEFR, 100% аудит безопасности.

---

## 3. Технологический стек, Архитектура и Инфраструктура
* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Wouter, Framer Motion
* **Backend & API:** Node.js, Express, tRPC v10, Zod Validation, SuperJSON
* **База данных & ORM:** PostgreSQL (Google Cloud SQL), Drizzle ORM
* **Инфраструктура:** Google Cloud Run, Cloud Storage, Google Cloud CDN
* **SLA & Uptime:** 99.98% uptime за последние 90 дней, p95 отклик = 58ms
* **План погашения техдолга:** Индексация таблиц посещаемости (Q4 2026), Redis-кэш публичных каталогов (Q4 2026), WebSocket шлюз уведомлений (Q1 2027).

---

## 4. Финансовый блок: Бюджет, Расходы, Рентабельность
* **Q1 2026 (План / Факт / Выручка):** $38,000 / $36,400 / $18,200 (Инвестиции)
* **Q2 2026 (План / Факт / Выручка):** $28,000 / $26,800 / $54,600 (Чистая прибыль +$27,800)
* **Q3 2026 (План / Факт / Выручка):** $24,000 / $18,900 / $78,400 (Чистая прибыль +$59,500)
* **Q4 2026 Прогноз (План / Факт / Выручка):** $22,000 / $22,000 / $95,000 (Чистая прибыль +$73,000)
* **Итого 2026:** Бюджет $112,000 | Факт расходов $104,100 | Выручка $246,200 | EBITDA +$142,100 (Маржа 57.7%)
* **Метрики окупаемости:** Срок окупаемости — 7.5 месяцев (достигнут в августе 2026 г.), ROI 12M = 242%, CAC = $32.50, LTV = $890.00 (LTV/CAC = 27.3x).

---

## 5. Дорожная карта (Roadmap) и Релизы
* **Февраль 2026 (Завершено):** Core Architecture, Cloud SQL PostgreSQL, Auth Guard, tRPC API.
* **Май 2026 (Завершено):** Реестр учеников, Dynamic Field Builder, Журналы оценок и посещаемости.
* **Сентябрь 2026 (Текущий спринт v2.0.4):** 5-ролевая консоль Founder с полным CRUD (Лиды, Программы, Расписание, Посещаемость, Оценки, Маркетинг, Отзывы).
* **Ноябрь 2026 (Релиз v2.1):** Онлайн-эквайринг, автобиллинг, генератор CEFR-сертификатов с QR-кодами.
* **Февраль 2027 (Релиз v2.2):** Мобильное PWA-приложение для родителей и учеников, Push-уведомления.
* **Июнь 2027 (Релиз v3.0):** AI-ассистент анализа произношения и Churn Warning AI.

---

## 6. Ключевые показатели эффективности (KPI)
* **Активные ученики:** План 380 чел. | Факт 486 чел. (+27.9%)
* **Конверсия лида в оплату:** План 25.0% | Факт 34.2% (+9.2 п.п.)
* **Retention Rate (6 месяцев):** План 85.0% | Факт 88.4% (+3.4 п.п.)
* **Стоимость привлечения (CAC):** План $45.00 | Факт $32.50 (-27.7% оптимизация)
* **Своевременность ведомостей:** План 98.0% | Факт 94.1% (-3.9 п.п. — внедрены авто-напоминания)
* **Доступность системы (Uptime):** План 99.90% | Факт 99.98% (+0.08 п.п.)

---

## 7. Матрица рисков и Мероприятия по минимизации
1. **Безопасность персональных данных (Low Prob / High Impact):** Шифрование at-rest/in-transit, RBAC, аудит сессий. Отв.: Security Officer.
2. **Сезонный отток на каникулах (Med Prob / Med Impact):** Запуск межсезонных интенсивов и разговорных клубов. Отв.: Head of Marketing.
3. **Ротация преподавателей (Med Prob / Med Impact):** Централизованная база планов уроков, бонусная сетка. Отв.: Academic Director.
4. **Отказ шлюзов эквайринга (Low Prob / Med Impact):** Мульти-эквайринг с автопереключением. Отв.: Lead Architect.
5. **Пиковые нагрузки (Low Prob / Low Impact):** Cloud Run автоскейлинг, кэширование. Отв.: DevOps Team.

---

## 8. Итоговая сводка и Точки внимания
* **Статус:** НА ХОДУ / В ГРАФИКЕ (ON TRACK — ЗЕЛЕНАЯ ЗОНА)
* **Выводы:** Проект полностью окупился за 7.5 месяцев, обеспечивает высокую рентабельность и полную прозрачность управления.
* **Точки внимания на Q4 2026:**
  1. Финализация эквайринговых договоров с банками до 15 октября.
  2. Методическая стандартизация базы планов уроков CEFR B2-C1 до 30 ноября.
  3. Формирование фокус-группы пилота PWA-приложения на декабрь 2026 г.
`;
  };

  const handleCopyMarkdown = () => {
    const rawText = getDocumentMarkdown();
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadMarkdown = () => {
    const element = document.createElement("a");
    const file = new Blob([getDocumentMarkdown()], { type: "text/markdown;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = "BILC_Project_Dossier_2026.md";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadDoc = () => {
    const content = document.getElementById("project-dossier-content")?.innerHTML || "";
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>BILC Project Dossier</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 20px; }
      h1 { color: #10253e; font-size: 22pt; margin-bottom: 8px; }
      h2 { color: #173fad; font-size: 16pt; margin-top: 18pt; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; }
      h3 { color: #0f172a; font-size: 13pt; margin-top: 12pt; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; font-size: 10pt; }
      th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
      th { background-color: #f1f5f9; font-weight: bold; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 8pt; font-weight: bold; }
    </style></head><body>
    <h1>Официальное Досье Проекта: Bilingual Idol Language Centre (BILC Platform)</h1>
    <p><strong>Идентификатор:</strong> BILC-CORE-2026-V2 | <strong>Дата:</strong> 8 сентября 2026 г. | <strong>Статус:</strong> НА ХОДУ (ON TRACK)</p>
    <hr/>
    ${content}
    </body></html>`;

    const blob = new Blob(['\ufeff', header], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'BILC_Project_Dossier_2026.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-3xl bg-gradient-to-r from-[#10253e] via-[#173fad] to-[#1e4fa8] p-7 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                Статус: На ходу / В графике (On Track)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-white/10 text-white/90 border border-white/15">
                ID: BILC-CORE-2026-V2
              </span>
              <span className="text-xs text-white/70">
                Актуально на: 8 сентября 2026 г.
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Официальное Досье Проекта: Bilingual Idol Language Centre (BILC)
            </h1>
            <p className="text-sm sm:text-base text-white/80 max-w-3xl leading-relaxed">
              Комплексный паспорт цифровой образовательной и управленческой экосистемы центра билингвального обучения.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <button
              onClick={handleDownloadDoc}
              title="Скачать в формате Microsoft Word (.doc)"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-all shadow-xs"
            >
              <FileText size={15} className="text-blue-200" />
              <span>Скачать Word (.doc)</span>
            </button>
            <button
              onClick={handleDownloadMarkdown}
              title="Скачать в формате Markdown (.md)"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-all shadow-xs"
            >
              <Download size={15} className="text-amber-200" />
              <span>Скачать .MD</span>
            </button>
            <button
              onClick={handleCopyMarkdown}
              title="Скопировать весь текст досье в буфер"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-all shadow-xs"
            >
              {copied ? <CheckCircle2 size={15} className="text-emerald-300" /> : <Copy size={15} />}
              <span>{copied ? "Скопировано" : "Копировать"}</span>
            </button>
            <button
              onClick={handlePrint}
              title="Распечатать или сохранить как PDF через диалог печати"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-[#10253e] hover:bg-amber-50 transition-all shadow-xs"
            >
              <Printer size={15} />
              <span>Печать / PDF</span>
            </button>
          </div>
        </div>

        {/* Quick Executive KPI Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15 text-white">
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
            <span className="text-[11px] text-white/70 uppercase tracking-wider block">Окупаемость (ROI)</span>
            <span className="text-xl font-bold text-amber-300">242%</span>
            <span className="text-[11px] text-emerald-300 block">Срок: 7.5 мес.</span>
          </div>
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
            <span className="text-[11px] text-white/70 uppercase tracking-wider block">Активные ученики</span>
            <span className="text-xl font-bold text-white">480+</span>
            <span className="text-[11px] text-emerald-300 block">+28% к плану</span>
          </div>
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
            <span className="text-[11px] text-white/70 uppercase tracking-wider block">Конверсия лидов</span>
            <span className="text-xl font-bold text-white">34.2%</span>
            <span className="text-[11px] text-emerald-300 block">Бенчмарк: 22%</span>
          </div>
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
            <span className="text-[11px] text-white/70 uppercase tracking-wider block">Uptime платформы</span>
            <span className="text-xl font-bold text-emerald-300">99.98%</span>
            <span className="text-[11px] text-white/70 block">SLA &lt;85ms p99</span>
          </div>
        </div>
      </div>

      {/* Navigation and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#dce4e7] shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === sec.id
                  ? "bg-[#10253e] text-white shadow-xs"
                  : "bg-[#f8fafc] text-[#475569] hover:bg-[#eef2f6] border border-[#e2e8f0]"
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#708098]" />
          <input
            type="text"
            placeholder="Поиск по досье..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#f8fafc] border border-[#dce4e7] focus:outline-hidden focus:border-[#173fad]"
          />
        </div>
      </div>

      {/* Document Content Container */}
      <div id="project-dossier-content" className="space-y-8">
        {/* SECTION 1: BASIC INFO & TEAM */}
        {(activeSection === "all" || activeSection === "basic-info") && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dce4e7] shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-[#eef2f6] pb-4">
              <span className="p-2.5 rounded-2xl bg-[#e8eeff] text-[#173fad]">
                <Building2 size={24} />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#173fad]">Раздел 1</span>
                <h2 className="text-xl font-extrabold text-[#10253e]">Паспорт проекта и Структура команды</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#10253e] uppercase tracking-wider">Базовые реквизиты</h3>
                <div className="divide-y divide-[#f1f5f9] text-sm">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#64748b]">Официальное название:</span>
                    <span className="font-semibold text-[#10253e] text-right">Bilingual Idol Language Centre (BILC Platform)</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#64748b]">Уникальный идентификатор:</span>
                    <span className="font-mono font-semibold text-[#173fad]">BILC-CORE-2026-V2</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#64748b]">Дата официального запуска:</span>
                    <span className="font-semibold text-[#10253e]">15 января 2026 г.</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#64748b]">Текущий операционный цикл:</span>
                    <span className="font-semibold text-emerald-700">Q3 2026 (Сентябрь 2026)</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-[#64748b]">Формат реализации:</span>
                    <span className="font-semibold text-[#10253e]">Enterprise Web & Hybrid Mobile Platform</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#10253e] uppercase tracking-wider">Назначенные ответственные лица</h3>
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-[#10253e]">Executive / Founder & CEO</div>
                      <div className="text-xs text-[#64748b]">Руководство проектом, стратегическое видение и бюджет</div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#fff8e6] text-[#b47d00] border border-[#ffd580]">Founder Authority</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-[#10253e]">Lead Architect & Fullstack Team</div>
                      <div className="text-xs text-[#64748b]">5 инженеров (React, TypeScript, Node.js, tRPC, PostgreSQL)</div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#e8eeff] text-[#173fad] border border-[#c0d4ff]">Engineering</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-[#10253e]">Product Analytics & Data Lead</div>
                      <div className="text-xs text-[#64748b]">Сквозная аналитика, воронки лидов, когортный анализ и KPI</div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#efe8fb] text-[#6e4c9a] border border-[#d8c3f8]">Analytics</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-[#10253e]">QA & Security Officer</div>
                      <div className="text-xs text-[#64748b]">Автотесты, RBAC аудит, соответствие GDPR и SLA 99.9%</div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">QA & Security</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: BUSINESS GOALS & AUDIENCE */}
        {(activeSection === "all" || activeSection === "business-goals") && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dce4e7] shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-[#eef2f6] pb-4">
              <span className="p-2.5 rounded-2xl bg-[#fff8e6] text-[#b47d00]">
                <Target size={24} />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#b47d00]">Раздел 2</span>
                <h2 className="text-xl font-extrabold text-[#10253e]">Бизнес-цель, Проблематика, Сегменты ЦА и Преимущества</h2>
              </div>
            </div>

            <div className="space-y-6 text-sm leading-relaxed text-[#334155]">
              <div>
                <h3 className="font-bold text-[#10253e] text-base mb-2">1. Главная бизнес-цель проекта</h3>
                <p>
                  Создание единой высокоавтоматизированной экосистемы для управления сетью билингвальных языковых центров, обеспечивающей сквозной цикл от захвата входящего маркетингового лида до академического контроля успеваемости по стандартам CEFR, автоматизации выставления счетов и удержания учеников (Retention Rate &gt;88%).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#fef2f2] border border-[#fecaca]">
                  <h4 className="font-bold text-[#991b1b] text-xs uppercase tracking-wider mb-2">Решаемые проблемы пользователей</h4>
                  <ul className="space-y-1.5 text-xs text-[#7f1d1d] list-disc list-inside">
                    <li><strong>Утрата лидов и медленный отклик:</strong> Ручная обработка заявок через разрозненные мессенджеры приводила к 35% потере контактов.</li>
                    <li><strong>Непрозрачность для родителей:</strong> Отсутствие единого личного кабинета с посещаемостью, оценками и темами уроков.</li>
                    <li><strong>Высокая нагрузка на преподавателей:</strong> До 40% рабочего времени уходило на заполнение бумажных ведомостей и отчетов.</li>
                    <li><strong>Слепые зоны управления:</strong> Отсутствие оперативных финансовых срезов и централизованного аудита действий персонала.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0]">
                  <h4 className="font-bold text-[#166534] text-xs uppercase tracking-wider mb-2">Ключевые конкурентные преимущества</h4>
                  <ul className="space-y-1.5 text-xs text-[#14532d] list-disc list-inside">
                    <li><strong>Единая 5-ролевая консоль управления:</strong> Мгновенный переход между интерфейсами Founder, Super Admin, Admin, Teacher и Marketing без смены контекста.</li>
                    <li><strong>Dynamic Profile Schema Builder:</strong> Возможность на лету создавать произвольные поля регистрации и метаданных без привлечения разработчиков.</li>
                    <li><strong>Интегрированный журнал оценок и посещаемости:</strong> Прямая привязка к международной шкале CEFR (A1–C2) с поддержкой комментариев и домашних заданий.</li>
                    <li><strong>Защищенный аудит безопасности:</strong> 100% логирование всех критических транзакций и изменений учетных записей.</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-[#10253e] text-xs uppercase tracking-wider mb-3">Сегментация целевой аудитории</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <div className="font-bold text-[#10253e] text-xs">1. Родители (B2C)</div>
                    <p className="text-[11px] text-[#64748b] mt-1">
                      Родители детей от 4 до 17 лет, ориентированные на получение кембриджских сертификатов и билингвальное развитие ребенка.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <div className="font-bold text-[#10253e] text-xs">2. Взрослые студенты (B2C/B2B)</div>
                    <p className="text-[11px] text-[#64748b] mt-1">
                      Студенты вузов и корпоративные специалисты, готовящиеся к IELTS/TOEFL и деловой межкультурной коммуникации.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <div className="font-bold text-[#10253e] text-xs">3. Преподаватели и Менеджмент (Internal)</div>
                    <p className="text-[11px] text-[#64748b] mt-1">
                      Академический состав, методисты, администраторы филиалов и маркетологи, требующие быстрых инструментов учета.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: TECH STACK & ARCHITECTURE */}
        {(activeSection === "all" || activeSection === "tech-stack") && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dce4e7] shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-[#eef2f6] pb-4">
              <span className="p-2.5 rounded-2xl bg-[#efe8fb] text-[#6e4c9a]">
                <Cpu size={24} />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#6e4c9a]">Раздел 3</span>
                <h2 className="text-xl font-extrabold text-[#10253e]">Технологический стек, Архитектурная схема и Техдолг</h2>
              </div>
            </div>

            {/* Tech Stack Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                <span className="text-[11px] font-bold text-[#6e4c9a] uppercase">Frontend Layer</span>
                <div className="font-bold text-sm text-[#10253e] mt-1">React 18 + TypeScript</div>
                <div className="text-xs text-[#64748b] mt-1">Vite, Tailwind CSS, Lucide Icons, Wouter, Framer Motion</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                <span className="text-[11px] font-bold text-[#173fad] uppercase">API & RPC Layer</span>
                <div className="font-bold text-sm text-[#10253e] mt-1">tRPC v10 + Express</div>
                <div className="text-xs text-[#64748b] mt-1">End-to-end Type Safety, Zod validation, SuperJSON</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                <span className="text-[11px] font-bold text-emerald-700 uppercase">Database & ORM</span>
                <div className="font-bold text-sm text-[#10253e] mt-1">PostgreSQL + Drizzle ORM</div>
                <div className="text-xs text-[#64748b] mt-1">Cloud SQL Relational Database, Auto-migrations, Connection pooling</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                <span className="text-[11px] font-bold text-amber-700 uppercase">Cloud Infrastructure</span>
                <div className="font-bold text-sm text-[#10253e] mt-1">Google Cloud Run & CDN</div>
                <div className="text-xs text-[#64748b] mt-1">Serverless Containers, SSL Auto-renewal, Auto-scaling 0..N</div>
              </div>
            </div>

            {/* Architecture Map */}
            <div className="p-5 rounded-2xl bg-[#0f172a] text-white space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Архитектурная схема взаимодействия (Modular Flow)</span>
                <span className="text-xs text-slate-400">Low-Latency Distributed Architecture</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <div className="text-amber-300 font-bold">Client UI (SPA)</div>
                  <div className="text-[10px] text-slate-400 mt-1">Role Views &amp; Forms</div>
                </div>
                <div className="flex items-center justify-center text-slate-500 font-bold">
                  &harr; tRPC / HTTP &harr;
                </div>
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <div className="text-cyan-300 font-bold">App Server / API</div>
                  <div className="text-[10px] text-slate-400 mt-1">Auth, RBAC &amp; Routers</div>
                </div>
                <div className="flex items-center justify-center text-slate-500 font-bold">
                  &harr; Drizzle SQL &harr;
                </div>
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <div className="text-emerald-300 font-bold">PostgreSQL DB</div>
                  <div className="text-[10px] text-slate-400 mt-1">Cloud SQL &amp; Vault</div>
                </div>
              </div>
            </div>

            {/* Technical Debt & Infrastructure State */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-2">
                <div className="font-bold text-[#10253e] flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  Текущее состояние инфраструктуры
                </div>
                <p className="text-[#64748b]">
                  Система развернута в контейнеризированной среде Google Cloud с автоматическим горизонтальным масштабированием. Время отклика API p95 составляет 42мс, доступность за последние 90 дней — 99.98%.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-[#fff8e6] border border-[#ffd580] space-y-2">
                <div className="font-bold text-[#b47d00] flex items-center gap-1.5">
                  <ShieldAlert size={16} className="text-[#b47d00]" />
                  Технический долг и план погашения
                </div>
                <p className="text-[#78350f]">
                  1. Оптимизация тяжелых выборок в журнале посещаемости через добавление составных индексов (срок: Q4 2026).<br />
                  2. Внедрение WebSocket для мгновенных push-уведомлений в чате преподаватель-родитель (срок: Q1 2027).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: FINANCES & ROI */}
        {(activeSection === "all" || activeSection === "finances") && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dce4e7] shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-[#eef2f6] pb-4">
              <span className="p-2.5 rounded-2xl bg-[#f0fdf4] text-emerald-700">
                <DollarSign size={24} />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Раздел 4</span>
                <h2 className="text-xl font-extrabold text-[#10253e]">Финансовый блок: Бюджет, Расходы, Рентабельность и Окупаемость</h2>
              </div>
            </div>

            {/* Financial Overview Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f8fafc] text-[#64748b] uppercase tracking-wider font-semibold border-b border-[#e2e8f0]">
                  <tr>
                    <th className="py-3 px-4">Квартал / Период</th>
                    <th className="py-3 px-4">План Бюджета</th>
                    <th className="py-3 px-4">Факт Расходов</th>
                    <th className="py-3 px-4">Выручка Экосистемы</th>
                    <th className="py-3 px-4">Чистая Прибыль / Маржа</th>
                    <th className="py-3 px-4">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9] text-[#334155]">
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#10253e]">Q1 2026 (Запуск & Core Dev)</td>
                    <td className="py-3.5 px-4">$38,000</td>
                    <td className="py-3.5 px-4 font-semibold text-[#10253e]">$36,400</td>
                    <td className="py-3.5 px-4">$18,200</td>
                    <td className="py-3.5 px-4 text-amber-700">-$18,200 (Инвестиции)</td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">Завершен</span></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#10253e]">Q2 2026 (Масштабирование & Студенты)</td>
                    <td className="py-3.5 px-4">$28,000</td>
                    <td className="py-3.5 px-4 font-semibold text-[#10253e]">$26,800</td>
                    <td className="py-3.5 px-4">$54,600</td>
                    <td className="py-3.5 px-4 text-emerald-600 font-bold">+$27,800 (+51%)</td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">Завершен</span></td>
                  </tr>
                  <tr className="bg-emerald-50/50">
                    <td className="py-3.5 px-4 font-bold text-[#10253e]">Q3 2026 (Текущий квартал — факт/прогноз)</td>
                    <td className="py-3.5 px-4">$24,000</td>
                    <td className="py-3.5 px-4 font-semibold text-[#10253e]">$18,900 (на 08.09)</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">$78,400</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-bold">+$59,500 (+76%)</td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">В процессе</span></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#10253e]">Q4 2026 (Прогноз релиза v2.1)</td>
                    <td className="py-3.5 px-4">$22,000</td>
                    <td className="py-3.5 px-4 text-[#64748b]">$22,000 (прогноз)</td>
                    <td className="py-3.5 px-4 font-semibold text-[#10253e]">$95,000 (прогноз)</td>
                    <td className="py-3.5 px-4 text-emerald-600 font-bold">+$73,000 (+77%)</td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">Запланирован</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Financial Metrics Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                <span className="text-[11px] font-semibold text-[#64748b] block">Общие инвестиции (YTD)</span>
                <span className="text-lg font-extrabold text-[#10253e] mt-0.5 block">$82,100</span>
                <span className="text-[10px] text-emerald-600">Экономия 4.2% от лимита</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                <span className="text-[11px] font-semibold text-[#64748b] block">Совокупный доход (YTD)</span>
                <span className="text-lg font-extrabold text-emerald-700 mt-0.5 block">$151,200</span>
                <span className="text-[10px] text-emerald-600">+22% выше модели</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                <span className="text-[11px] font-semibold text-[#64748b] block">Срок окупаемости (Payback)</span>
                <span className="text-lg font-extrabold text-emerald-700 mt-0.5 block">7.5 месяцев</span>
                <span className="text-[10px] text-emerald-600">Полная окупаемость достигнута в августе 2026</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                <span className="text-[11px] font-semibold text-[#64748b] block">Прогнозируемый ROI (12M)</span>
                <span className="text-lg font-extrabold text-[#173fad] mt-0.5 block">242%</span>
                <span className="text-[10px] text-[#64748b]">LTV / CAC = 4.8x</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: ROADMAP & RELEASES */}
        {(activeSection === "all" || activeSection === "roadmap") && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dce4e7] shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-[#eef2f6] pb-4">
              <span className="p-2.5 rounded-2xl bg-[#e8eeff] text-[#173fad]">
                <Milestone size={24} />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#173fad]">Раздел 5</span>
                <h2 className="text-xl font-extrabold text-[#10253e]">Дорожная карта (Roadmap), Завершенные этапы и Релизы</h2>
              </div>
            </div>

            <div className="space-y-6">
              {/* Completed Milestones */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  Завершенные этапы проекта (Q1–Q2 2026)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0]">
                    <div className="flex justify-between font-bold text-[#166534]">
                      <span>Этап 1: Core Architecture &amp; Database</span>
                      <span>Февраль 2026</span>
                    </div>
                    <p className="text-[#14532d] mt-1">
                      Развернута база Cloud SQL PostgreSQL, схемы Drizzle ORM, настроен Auth Guard, tRPC API и базовые сущности пользователей.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0]">
                    <div className="flex justify-between font-bold text-[#166534]">
                      <span>Этап 2: Role Console &amp; Student Registry</span>
                      <span>Май 2026</span>
                    </div>
                    <p className="text-[#14532d] mt-1">
                      Внедрены модули студентов, конструктор динамических полей (User Field Builder), журналы успеваемости и посещаемости.
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Active Sprint */}
              <div className="p-4 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1e40af] flex items-center gap-1.5">
                    <Clock size={15} />
                    Текущий спринт в разработке (Сентябрь 2026 — Релиз v2.0.4)
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white">85% готовности</span>
                </div>
                <p className="text-xs text-[#1e3a8a] leading-relaxed">
                  Полнофункциональная консоль Founder с переключением 5 ролей (Founder, Super Admin, Admin, Teacher, Marketing) и полной поддержкой CRUD для всех вложенных модулей: управление лидами, курсами, расписанием, посещаемостью, оценками, маркетинговыми промо-кампаниями и отзывами.
                </p>
              </div>

              {/* Upcoming Releases & 12M Horizon */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#10253e]">Запланированные релизы и горизонт 12 месяцев</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <div className="font-bold text-[#10253e]">Релиз v2.1 — Ноябрь 2026</div>
                    <p className="text-[11px] text-[#64748b] mt-1">
                      Интеграция онлайн-эквайринга, выставление счетов через QR/ссылки и автоматическая генерация сертификатов CEFR в PDF.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <div className="font-bold text-[#10253e]">Релиз v2.2 — Февраль 2027</div>
                    <p className="text-[11px] text-[#64748b] mt-1">
                      Мобильное PWA-приложение для родителей и учеников, интерактивные пуш-уведомления об уроках и домашних заданиях.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <div className="font-bold text-[#10253e]">Релиз v3.0 — Июнь 2027</div>
                    <p className="text-[11px] text-[#64748b] mt-1">
                      AI-ассистент оценки произношения для учеников и предиктивная аналитика оттока (Churn Prevention Engine).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 6: KPIS & PERFORMANCE */}
        {(activeSection === "all" || activeSection === "kpis") && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dce4e7] shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-[#eef2f6] pb-4">
              <span className="p-2.5 rounded-2xl bg-[#fff0ed] text-[#a34732]">
                <LineChart size={24} />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#a34732]">Раздел 6</span>
                <h2 className="text-xl font-extrabold text-[#10253e]">Ключевые показатели эффективности (KPI) и Анализ отклонений</h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f8fafc] text-[#64748b] uppercase tracking-wider font-semibold border-b border-[#e2e8f0]">
                  <tr>
                    <th className="py-3 px-4">Метрика KPI</th>
                    <th className="py-3 px-4">Плановое значение</th>
                    <th className="py-3 px-4">Фактическое значение</th>
                    <th className="py-3 px-4">Отклонение (&Delta;)</th>
                    <th className="py-3 px-4">Анализ и Корректирующие меры</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9] text-[#334155]">
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#10253e]">Активные платящие ученики</td>
                    <td className="py-3.5 px-4">380 чел.</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">486 чел.</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">+27.9%</td>
                    <td className="py-3.5 px-4 text-[#64748b]">Успешный запуск летних интенсивных программ и таргетинга.</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#10253e]">Конверсия входящего лида в оплату</td>
                    <td className="py-3.5 px-4">25.0%</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">34.2%</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">+9.2 п.п.</td>
                    <td className="py-3.5 px-4 text-[#64748b]">Сокращение времени первого контакта менеджера с 4ч до 12 минут.</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#10253e]">Коэффициент удержания (Retention 6M)</td>
                    <td className="py-3.5 px-4">85.0%</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">88.4%</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">+3.4 п.п.</td>
                    <td className="py-3.5 px-4 text-[#64748b]">Прозрачность прогресса через электронный журнал для родителей.</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#10253e]">Стоимость привлечения клиента (CAC)</td>
                    <td className="py-3.5 px-4">$45.00</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">$32.50</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">-27.7% (лучше)</td>
                    <td className="py-3.5 px-4 text-[#64748b]">Высокая доля органических рекомендаций (WOM) — 38% от общего объема.</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#10253e]">Полнота заполнения журналов учителями</td>
                    <td className="py-3.5 px-4">98.0%</td>
                    <td className="py-3.5 px-4 font-bold text-amber-700">94.1%</td>
                    <td className="py-3.5 px-4 font-bold text-amber-600">-3.9 п.п.</td>
                    <td className="py-3.5 px-4 text-[#64748b]">Внедрены автоматические ежедневные напоминания и упрощенный интерфейс.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 7: RISKS MATRIX */}
        {(activeSection === "all" || activeSection === "risks") && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dce4e7] shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-[#eef2f6] pb-4">
              <span className="p-2.5 rounded-2xl bg-[#fef2f2] text-[#991b1b]">
                <ShieldAlert size={24} />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#991b1b]">Раздел 7</span>
                <h2 className="text-xl font-extrabold text-[#10253e]">Матрица проектных рисков и Мероприятия по минимизации</h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f8fafc] text-[#64748b] uppercase tracking-wider font-semibold border-b border-[#e2e8f0]">
                  <tr>
                    <th className="py-3 px-4">Категория &amp; Описание риска</th>
                    <th className="py-3 px-4">Вероятность</th>
                    <th className="py-3 px-4">Влияние</th>
                    <th className="py-3 px-4">План минимизации и предотвращения</th>
                    <th className="py-3 px-4">Ответственный</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9] text-[#334155]">
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#10253e]">
                      <strong>Безопасность персональных данных:</strong><br />
                      <span className="font-normal text-[#64748b]">Риск утечки личных данных учеников и родителей.</span>
                    </td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">Низкая (Low)</span></td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]">Критическое (High)</span></td>
                    <td className="py-3.5 px-4 text-[#64748b]">Шифрование данных at-rest / in-transit, строгий RBAC, аудит всех сессий.</td>
                    <td className="py-3.5 px-4 font-semibold text-[#10253e]">Security Officer</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#10253e]">
                      <strong>Сезонный отток студентов:</strong><br />
                      <span className="font-normal text-[#64748b]">Снижение активности в период каникул (январь / май).</span>
                    </td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">Средняя (Med)</span></td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">Умеренное (Med)</span></td>
                    <td className="py-3.5 px-4 text-[#64748b]">Запуск межсезонных интенсивов, разговорных клубов и спецкурсов.</td>
                    <td className="py-3.5 px-4 font-semibold text-[#10253e]">Head of Marketing</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#10253e]">
                      <strong>Ротация преподавательского состава:</strong><br />
                      <span className="font-normal text-[#64748b]">Уход ключевых педагогов-носителей языка.</span>
                    </td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">Средняя (Med)</span></td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">Умеренное (Med)</span></td>
                    <td className="py-3.5 px-4 text-[#64748b]">Централизованная база учебных планов (Curriculum Hub), программа бонусов.</td>
                    <td className="py-3.5 px-4 font-semibold text-[#10253e]">Academic Director</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-[#10253e]">
                      <strong>Пиковые нагрузки на сервер:</strong><br />
                      <span className="font-normal text-[#64748b]">Замедление работы во время синхронного выставления оценок.</span>
                    </td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">Низкая (Low)</span></td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">Низкое (Low)</span></td>
                    <td className="py-3.5 px-4 text-[#64748b]">Serverless Cloud Run автоскейлинг и кэширование справочников.</td>
                    <td className="py-3.5 px-4 font-semibold text-[#10253e]">Lead Architect</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 8: EXECUTIVE SUMMARY & ATTENTION POINTS */}
        {(activeSection === "all" || activeSection === "executive-summary") && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dce4e7] shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-[#eef2f6] pb-4">
              <span className="p-2.5 rounded-2xl bg-[#10253e] text-white">
                <FileCheck size={24} />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#10253e]">Раздел 8</span>
                <h2 className="text-xl font-extrabold text-[#10253e]">Сводка статуса, Выводы и Точки внимания руководства</h2>
              </div>
            </div>

            <div className="space-y-4 text-sm text-[#334155] leading-relaxed">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <strong className="text-emerald-900 text-sm">ИТОГОВЫЙ СТАТУС: НА ХОДУ / В ГРАФИКЕ (ON TRACK — ЗЕЛЕНАЯ ЗОНА)</strong>
                </div>
                <p className="text-xs text-emerald-800 mt-2">
                  Проект развивается с опережением финансовых планов (+22% по выручке, окупаемость 7.5 месяцев вместо 9 месяцев) и полным соответствием техническим стандартам надежности и безопасности.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-[#10253e] text-sm mb-2">Ключевые точки внимания для руководства на ближайший период (Q4 2026):</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-1">
                    <strong className="text-[#10253e] block">1. Финализация эквайринга</strong>
                    <p className="text-[#64748b]">
                      Утвердить договоры с платежными шлюзами для запуска прямого онлайн-биллинга в релизе v2.1.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-1">
                    <strong className="text-[#10253e] block">2. Стандартизация учебных планов</strong>
                    <p className="text-[#64748b]">
                      Завершить оцифровку методических материалов по уровням CEFR B2–C1 до конца октября.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-1">
                    <strong className="text-[#10253e] block">3. Подготовка PWA-приложения</strong>
                    <p className="text-[#64748b]">
                      Провести закрытое бета-тестирование мобильного кабинета родителей на фокус-группе из 50 семей.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

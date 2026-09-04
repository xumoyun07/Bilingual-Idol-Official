export type Language = "en" | "ms" | "ar";

export interface TranslationDictionary {
  nav: {
    home: string;
    about: string;
    programs: string;
    news: string;
    contact: string;
    makeEnquiry: string;
    signIn: string;
    signOut: string;
    skipToContent: string;
    menu: string;
    close: string;
    workspace: string;
    accountActive: string;
    myClasses: string;
    overview: string;
    users: string;
    students: string;
    media: string;
    auditLogs: string;
    switchLanguage: string;
    contactUs: string;
    enrollNow: string;
    bookTour: string;
  };
  footer: {
    centreName: string;
    location: string;
    brandSubtitle: string;
    allRightsReserved: string;
  };
  common: {
    call: string;
    whatsapp: string;
    email: string;
    openingHours: string;
    backToHome: string;
    viewDetails: string;
    readMore: string;
    learnMore: string;
    submit: string;
    loading: string;
    filter: string;
    all: string;
    search: string;
    thankYou: string;
    close: string;
    requiredFields: string;
    viewProgrammes: string;
    cancel: string;
    next: string;
    prev: string;
    step: string;
    sendMessage: string;
    location: string;
    addressText: string;
  };
  home: {
    eyebrow: string;
    heroTitle: string;
    heroSubtitle: string;
    ctaFindCourse: string;
    ctaEnquiry: string;
    ctaPlacement: string;
    ctaBooking: string;
    taskPlacementTitle: string;
    taskPlacementDesc: string;
    taskConsultationTitle: string;
    taskConsultationDesc: string;
    taskProgramsTitle: string;
    taskProgramsDesc: string;
    taskContactTitle: string;
    taskContactDesc: string;
    pricingEyebrow: string;
    pricingTitle: string;
    pricingSubtitle: string;
    pricingTabGeneral: string;
    pricingTabIelts: string;
    pricingTabCamps: string;
    pricingTabPrivate: string;
    pricingTabExecutive: string;
    pricingTabWorld: string;
    startHereEyebrow: string;
    startHereTitle: string;
    startHereDesc: string;
    admissionsTag: string;
    taskPortalTitle: string;
    taskPortalDesc: string;
    facilitiesEyebrow: string;
    facilitiesTitle: string;
    facilitiesSubtitle: string;
    journeyEyebrow: string;
    journeyTitle: string;
    journeySubtitle: string;
    testimonialsEyebrow: string;
    testimonialsTitle: string;
    testimonialsSubtitle: string;
    contactStripTitle: string;
    contactStripSubtitle: string;
    contactStripButton: string;
    languageBandTitle: string;
    languageBandSubtitle: string;
  };
  about: {
    eyebrow: string;
    heroTitle: string;
    heroSubtitle: string;
    storyEyebrow: string;
    storyTitle: string;
    storyBody: string;
    explorePrograms: string;
    approachEyebrow: string;
    approachTitle: string;
    approachSubtitle: string;
    approach1Title: string;
    approach1Body: string;
    approach2Title: string;
    approach2Body: string;
    approach3Title: string;
    approach3Body: string;
    communityEyebrow: string;
    communityTitle: string;
    communityCaption: string;
    teamEyebrow: string;
    teamTitle: string;
    teamSubtitle: string;
  };
  programs: {
    eyebrow: string;
    heroTitle: string;
    heroSubtitle: string;
    guideEyebrow: string;
    guideTitle: string;
    guideSubtitle: string;
    searchPlaceholder: string;
    filterLabel: string;
    countShown: string;
    noMatches: string;
    viewDetails: string;
    catAll: string;
    catKids: string;
    catEnglish: string;
    catWorldLanguages: string;
    catProfessional: string;
  };
  programDetail: {
    backLink: string;
    overviewEyebrow: string;
    duration: string;
    schedule: string;
    fees: string;
    level: string;
    ageGroup: string;
    outcomesTitle: string;
    ctaTitle: string;
    ctaSubtitle: string;
    ctaButton: string;
  };
  contact: {
    eyebrow: string;
    heroTitle: string;
    heroSubtitle: string;
    call: string;
    whatsapp: string;
    whatsappValue: string;
    email: string;
    hours: string;
    address: string;
    formEyebrow: string;
    formTitle: string;
    formSubtitle: string;
    formCardTitle: string;
  };
  enroll: {
    backLink: string;
    eyebrow: string;
    heroTitle: string;
    heroSubtitle: string;
    nextStepsTitle: string;
    step1: string;
    step2: string;
    step3: string;
    formEyebrow: string;
    requiredNote: string;
  };
  news: {
    eyebrow: string;
    heroTitle: string;
    heroSubtitle: string;
    searchPlaceholder: string;
    allCategories: string;
    readMore: string;
  };
  login: {
    eyebrow: string;
    heroTitle: string;
    heroSubtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    showPassword: string;
    hidePassword: string;
    submitButton: string;
    signingIn: string;
    helpTitle: string;
    helpText: string;
  };
  userDashboard: {
    welcome: string;
    roleStudent: string;
    roleTeacher: string;
    roleMember: string;
    subtitle: string;
    nextStepTitle: string;
    nextStepText: string;
    nextStepButton: string;
    attendanceTitle: string;
    attendanceLoading: string;
    attendanceLoadingText: string;
    attendanceScore: string;
    attendanceScoreText: string;
    attendanceNotAvailable: string;
    attendanceNotAvailableText: string;
    signOut: string;
    preparing: string;
    preparingText: string;
  };
  form: {
    studentName: string;
    studentNamePlaceholder: string;
    studentAge: string;
    studentAgePlaceholder: string;
    parentName: string;
    parentNamePlaceholder: string;
    parentEmail: string;
    parentEmailPlaceholder: string;
    parentPhone: string;
    parentPhonePlaceholder: string;
    programInterest: string;
    selectProgram: string;
    preferredSchedule: string;
    selectSchedule: string;
    weekdayMorning: string;
    weekdayAfternoon: string;
    weekdayEvening: string;
    weekendIntensive: string;
    flexiblePrivate: string;
    message: string;
    messagePlaceholder: string;
    submitEnquiry: string;
    sending: string;
    successTitle: string;
    successText: string;
    submitAnother: string;
    kicker: string;
    stepInfo: string;
    stepTrack: string;
    stepContact: string;
  };
  placementModal: {
    title: string;
    subtitle: string;
    questionNumber: string;
    completeBtn: string;
    resultTitle: string;
    yourLevel: string;
    diagnosticScore: string;
    recommendedCourse: string;
    enrollWithScore: string;
    retake: string;
  };
  bookingModal: {
    title: string;
    subtitle: string;
    selectDate: string;
    selectTime: string;
    consultationReason: string;
    bookBtn: string;
    successTitle: string;
    successDesc: string;
  };
  chat: {
    widgetTitle: string;
    welcome: string;
    placeholder: string;
    send: string;
  };
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    nav: {
      home: "Home",
      about: "About",
      programs: "Programmes",
      news: "News",
      contact: "Contact",
      makeEnquiry: "Make an enquiry",
      signIn: "Sign in",
      signOut: "Sign out",
      skipToContent: "Skip to content",
      menu: "Menu",
      close: "Close",
      workspace: "Workspace",
      accountActive: "Account active",
      myClasses: "My classes",
      overview: "Overview",
      users: "Users",
      students: "Students",
      media: "Media",
      auditLogs: "Audit logs",
      switchLanguage: "Language",
      contactUs: "Contact us",
      enrollNow: "Enroll now",
      bookTour: "Book Campus Tour",
    },
    footer: {
      centreName: "Bilingual Idol Language Centre",
      location: "Pavilion Embassy, Kuala Lumpur",
      brandSubtitle: "Language Centre",
      allRightsReserved: "All rights reserved",
    },
    common: {
      call: "Call",
      whatsapp: "WhatsApp",
      email: "Email",
      openingHours: "Opening hours",
      backToHome: "Back to home",
      viewDetails: "View details",
      readMore: "Read article",
      learnMore: "Learn more",
      submit: "Submit",
      loading: "Loading...",
      filter: "Filter",
      all: "All",
      search: "Search",
      thankYou: "Thank you",
      close: "Close",
      requiredFields: "Fields marked with an asterisk are required.",
      viewProgrammes: "View programmes",
      cancel: "Cancel",
      next: "Next",
      prev: "Back",
      step: "Step",
      sendMessage: "Send enquiry",
      location: "Location",
      addressText: "B-25-07, Pavilion Embassy, Menara G-Vestor, 200, Jln Ampang, 50450 Kuala Lumpur.",
    },
    home: {
      eyebrow: "2026 Academic Season · Pavilion Embassy, KL",
      heroTitle: "Bilingual Idol Language Centre",
      heroSubtitle: "Structured language programmes, international IELTS preparation and immersive world language pathways at Pavilion Embassy, Kuala Lumpur.",
      ctaFindCourse: "Find your course",
      ctaEnquiry: "Make an enquiry",
      ctaPlacement: "Free placement test",
      ctaBooking: "Book consultation",
      taskPlacementTitle: "Online placement test",
      taskPlacementDesc: "Evaluate your level in 3 minutes with instant score and course recommendation.",
      taskConsultationTitle: "Book a consultation",
      taskConsultationDesc: "Schedule a private tour and 1-on-1 language roadmap session at Pavilion Embassy.",
      taskProgramsTitle: "Browse 2026 programmes",
      taskProgramsDesc: "General English, IELTS, Summer Camp, Corporate & World Languages.",
      taskContactTitle: "Speak with an advisor",
      taskContactDesc: "WhatsApp or call our admissions team directly for personalized guidance.",
      pricingEyebrow: "Official 2026 Tuition",
      pricingTitle: "Transparent Course Fee Structure",
      pricingSubtitle: "Published official tuition fees. Contact admissions for group discounts, installment plans and promotional intakes.",
      pricingTabGeneral: "General English",
      pricingTabIelts: "IELTS Prep",
      pricingTabCamps: "Holiday Camps",
      pricingTabPrivate: "1-on-1 Private",
      pricingTabExecutive: "Corporate & Executive",
      pricingTabWorld: "World Languages",
      startHereEyebrow: "Start here",
      startHereTitle: "Choose your pathway to fluency.",
      startHereDesc: "Explore accredited courses, book a campus consultation, or access your active student account.",
      admissionsTag: "Admissions",
      taskPortalTitle: "Student & Staff Portal",
      taskPortalDesc: "Sign in to view class timetables, attendance records, study resources, and grades.",
      facilitiesEyebrow: "Campus Facilities",
      facilitiesTitle: "Modern Learning Spaces at Pavilion Embassy",
      facilitiesSubtitle: "Experience our state-of-the-art multimedia classrooms, executive lounges, private study suites, and student breakout zones.",
      journeyEyebrow: "Student Journey",
      journeyTitle: "From First Enquiry to Language Fluency",
      journeySubtitle: "A structured 5-stage roadmap designed for rapid language acquisition, cultural immersion, and certified progression.",
      testimonialsEyebrow: "Student Stories",
      testimonialsTitle: "What Our Learners Say",
      testimonialsSubtitle: "Real feedback from international students, professionals, and parents who studied at Bilingual Idol.",
      contactStripTitle: "Ready to start your language journey?",
      contactStripSubtitle: "Visit our campus at Pavilion Embassy, Ampang or speak with an education consultant today.",
      contactStripButton: "Contact admissions",
      languageBandTitle: "World Languages Offered",
      languageBandSubtitle: "English, Bahasa Melayu, Mandarin, Arabic, Japanese and Korean taught by dedicated language specialists.",
    },
    about: {
      eyebrow: "About",
      heroTitle: "Language learning built around clear progress.",
      heroSubtitle: "Bilingual Idol Language Centre supports learners in Kuala Lumpur with language pathways, consultation and a focus on confident communication.",
      storyEyebrow: "A considered start",
      storyTitle: "What the centre supports",
      storyBody: "The centre describes a learning environment with interactive classrooms, digital learning resources, placement guidance and personalised language routes.",
      explorePrograms: "Explore programmes",
      approachEyebrow: "Learning approach",
      approachTitle: "How learning is supported",
      approachSubtitle: "Clear next steps, active practice and steady confidence-building shape the centre’s public learning approach.",
      approach1Title: "Start with the learner’s goal",
      approach1Body: "Consultation and placement guidance help identify an appropriate language route before enrolment.",
      approach2Title: "Practise actively",
      approach2Body: "The centre describes interactive learning supported by digital classroom tools and guided practice.",
      approach3Title: "Build confidence steadily",
      approach3Body: "Learning pathways are designed around language development, cultural awareness and practical communication.",
      communityEyebrow: "People and practice",
      communityTitle: "A place to keep moving forward",
      communityCaption: "Language grows through meaningful exchange and shared practice.",
      teamEyebrow: "Advisory & Teaching",
      teamTitle: "Qualified instructors dedicated to your growth",
      teamSubtitle: "Our faculty combines certified international credentials, communicative pedagogy, and dedicated mentorship.",
    },
    programs: {
      eyebrow: "Programmes",
      heroTitle: "Find a programme that fits the learner.",
      heroSubtitle: "Explore the published 2026 course guide, then contact the centre to confirm suitability, availability and the current fee.",
      guideEyebrow: "2026 fee guide",
      guideTitle: "Published course options",
      guideSubtitle: "Fees are guidance from the 2026 list. Confirm the current total, visa requirements and intake with the centre before enrolment.",
      searchPlaceholder: "Search by language, level or learner group",
      filterLabel: "Filter",
      countShown: "{count} confirmed programme(s) shown",
      noMatches: "No programmes match the current search. Try changing the category or search keywords.",
      viewDetails: "View programme details",
      catAll: "All",
      catKids: "Kids",
      catEnglish: "English",
      catWorldLanguages: "World Languages",
      catProfessional: "Professional",
    },
    programDetail: {
      backLink: "Back to programmes",
      overviewEyebrow: "Programme overview",
      duration: "Duration",
      schedule: "Schedule",
      fees: "Fees",
      level: "Level",
      ageGroup: "Target Group",
      outcomesTitle: "Key Learning Outcomes",
      ctaTitle: "Interested in this programme?",
      ctaSubtitle: "Submit a learning enquiry to check current availability and discuss your placement.",
      ctaButton: "Make an enquiry",
    },
    contact: {
      eyebrow: "Contact",
      heroTitle: "Get in touch with the centre.",
      heroSubtitle: "Choose the contact method that works best for you, or send a short enquiry below.",
      call: "Call",
      whatsapp: "WhatsApp",
      whatsappValue: "Message the centre",
      email: "Email",
      hours: "Opening hours",
      address: "B-25-07, Pavilion Embassy, Menara G-Vestor, 200, Jln Ampang, 50450 Kuala Lumpur.",
      formEyebrow: "Send an enquiry",
      formTitle: "Tell us what the learner needs.",
      formSubtitle: "A short description of the learner’s language goal and preferred timing is enough to begin.",
      formCardTitle: "Your enquiry",
    },
    enroll: {
      backLink: "Back to home",
      eyebrow: "Learning enquiry",
      heroTitle: "Tell the centre about the learner.",
      heroSubtitle: "Submit the details you already know. An enquiry does not commit you to a course.",
      nextStepsTitle: "What happens next",
      step1: "The centre reviews the learner’s language goal and current stage.",
      step2: "The centre can recommend a relevant next step or ask a follow-up question.",
      step3: "Your information is handled by authorised centre staff.",
      formEyebrow: "Learner details",
      requiredNote: "Fields marked with an asterisk are required.",
    },
    news: {
      eyebrow: "Updates & Notices",
      heroTitle: "Centre news and announcements.",
      heroSubtitle: "Read recent notices, holiday schedules and academic updates from Bilingual Idol.",
      searchPlaceholder: "Search news articles...",
      allCategories: "All categories",
      readMore: "Read article",
    },
    login: {
      eyebrow: "Portal Access",
      heroTitle: "Sign in to your account.",
      heroSubtitle: "Access your dashboard, class schedules, and centre resources.",
      emailLabel: "Email address",
      emailPlaceholder: "you@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      showPassword: "Show password",
      hidePassword: "Hide password",
      submitButton: "Sign in",
      signingIn: "Signing in...",
      helpTitle: "Need account access?",
      helpText: "Contact admissions or your instructor to receive your student or parent credentials.",
    },
    userDashboard: {
      welcome: "Welcome",
      roleStudent: "Student account",
      roleTeacher: "Teacher account",
      roleMember: "Member account",
      subtitle: "Your account is ready. Information shared by the centre will appear here when it is available for your role.",
      nextStepTitle: "Find a programme",
      nextStepText: "Review the current programme information or contact the centre if you need help choosing the right option.",
      nextStepButton: "View programmes",
      attendanceTitle: "Attendance information",
      attendanceLoading: "Attendance: loading",
      attendanceLoadingText: "Your latest attendance summary is being prepared.",
      attendanceScore: "Attendance: {percentage}%",
      attendanceScoreText: "{attended} of {total} completed sessions attended. Present and late marks count as attended.",
      attendanceNotAvailable: "Attendance is not available yet.",
      attendanceNotAvailableText: "Your attendance percentage will appear after the centre records completed sessions for your account.",
      signOut: "Sign out",
      preparing: "Preparing your workspace",
      preparingText: "Please wait while your account access is confirmed.",
    },
    form: {
      studentName: "Student full name *",
      studentNamePlaceholder: "e.g. Sarah Tan",
      studentAge: "Student age *",
      studentAgePlaceholder: "e.g. 16",
      parentName: "Parent / Guardian name *",
      parentNamePlaceholder: "e.g. Michael Tan",
      parentEmail: "Contact email *",
      parentEmailPlaceholder: "name@example.com",
      parentPhone: "Phone number (with country code) *",
      parentPhonePlaceholder: "+60 12 345 6789",
      programInterest: "Interested programme *",
      selectProgram: "Select a programme...",
      preferredSchedule: "Preferred schedule *",
      selectSchedule: "Select schedule...",
      weekdayMorning: "Weekday Mornings (9:00 AM - 12:00 PM)",
      weekdayAfternoon: "Weekday Afternoons (2:00 PM - 5:00 PM)",
      weekdayEvening: "Weekday Evenings (6:30 PM - 9:00 PM)",
      weekendIntensive: "Weekend Intensive (Sat/Sun)",
      flexiblePrivate: "Flexible 1-on-1 Private Schedule",
      message: "Additional details or goals",
      messagePlaceholder: "Tell us about current language level, timeline or specific goals...",
      submitEnquiry: "Submit enquiry",
      sending: "Submitting...",
      successTitle: "Thank you — we have your details.",
      successText: "Our admissions team will be in touch within 24 hours to discuss the next best step for your learner.",
      submitAnother: "Submit another response",
      kicker: "Let’s talk",
      stepInfo: "Learner Info",
      stepTrack: "Course Track",
      stepContact: "Guardian & Contact",
    },
    placementModal: {
      title: "Free 3-Minute Online English Evaluation",
      subtitle: "Answer 8 quick questions to determine your CEFR level (A1–C1) and get personalized course recommendations.",
      questionNumber: "Question {current} of {total}",
      completeBtn: "See My Evaluation & Recommended Track",
      resultTitle: "Your CEFR English Assessment Result",
      yourLevel: "Estimated CEFR Level",
      diagnosticScore: "Diagnostic Score: {score}/8 ({pct}%)",
      recommendedCourse: "Recommended Course Track:",
      enrollWithScore: "Enroll with this score",
      retake: "Retake test",
    },
    bookingModal: {
      title: "Book a Campus Consultation & Level Audit",
      subtitle: "Meet our academic advisor at Pavilion Embassy, KL for a personalized study pathway consultation.",
      selectDate: "Select Preferred Date *",
      selectTime: "Select Preferred Time Slot *",
      consultationReason: "Consultation Objective *",
      bookBtn: "Confirm Campus Appointment",
      successTitle: "Consultation Booked Successfully!",
      successDesc: "Our admissions team has reserved your slot. We have sent confirmation details to your contact info.",
    },
    chat: {
      widgetTitle: "Admissions Assistant",
      welcome: "Hello! Welcome to Bilingual Idol Language Centre at Pavilion Embassy. How can I help you today?",
      placeholder: "Ask about courses, IELTS, fees, schedules...",
      send: "Send",
    },
  },
  ms: {
    nav: {
      home: "Laman Utama",
      about: "Tentang Kami",
      programs: "Program",
      news: "Berita",
      contact: "Hubungi",
      makeEnquiry: "Buat Pertanyaan",
      signIn: "Log Masuk",
      signOut: "Log Keluar",
      skipToContent: "Langkau ke kandungan",
      menu: "Menu",
      close: "Tutup",
      workspace: "Ruang Kerja",
      accountActive: "Akaun aktif",
      myClasses: "Kelas Saya",
      overview: "Gambaran Keseluruhan",
      users: "Pengguna",
      students: "Pelajar",
      media: "Media",
      auditLogs: "Log Audit",
      switchLanguage: "Bahasa",
      contactUs: "Hubungi kami",
      enrollNow: "Daftar sekarang",
      bookTour: "Tempah Lawatan Kampus",
    },
    footer: {
      centreName: "Pusat Bahasa Bilingual Idol",
      location: "Pavilion Embassy, Kuala Lumpur",
      brandSubtitle: "Pusat Bahasa",
      allRightsReserved: "Hak cipta terpelihara",
    },
    common: {
      call: "Telefon",
      whatsapp: "WhatsApp",
      email: "E-mel",
      openingHours: "Waktu operasi",
      backToHome: "Kembali ke laman utama",
      viewDetails: "Lihat butiran",
      readMore: "Baca artikel",
      learnMore: "Ketahui lebih lanjut",
      submit: "Hantar",
      loading: "Memuatkan...",
      filter: "Tapis",
      all: "Semua",
      search: "Cari",
      thankYou: "Terima kasih",
      close: "Tutup",
      requiredFields: "Medan bertanda bintang (*) adalah wajib.",
      viewProgrammes: "Lihat program",
      cancel: "Batal",
      next: "Seterusnya",
      prev: "Kembali",
      step: "Langkah",
      sendMessage: "Hantar pertanyaan",
      location: "Lokasi",
      addressText: "B-25-07, Pavilion Embassy, Menara G-Vestor, 200, Jln Ampang, 50450 Kuala Lumpur.",
    },
    home: {
      eyebrow: "Musim Akademik 2026 · Pavilion Embassy, KL",
      heroTitle: "Pusat Bahasa Bilingual Idol",
      heroSubtitle: "Program bahasa berstruktur, persediaan peperiksaan IELTS antarabangsa dan laluan bahasa dunia yang mendalam di Pavilion Embassy, Kuala Lumpur.",
      ctaFindCourse: "Cari kursus anda",
      ctaEnquiry: "Buat pertanyaan",
      ctaPlacement: "Ujian penempatan percuma",
      ctaBooking: "Tempah perundingan",
      taskPlacementTitle: "Ujian penempatan dalam talian",
      taskPlacementDesc: "Nilaikan tahap penguasaan anda dalam 3 minit dengan skor segera dan cadangan kursus.",
      taskConsultationTitle: "Tempah perundingan",
      taskConsultationDesc: "Jadualkan lawatan peribadi dan sesi pelan bahasa 1-dengan-1 di Pavilion Embassy.",
      taskProgramsTitle: "Semak program 2026",
      taskProgramsDesc: "Bahasa Inggeris Umum, IELTS, Kem Musim Panas, Korporat & Bahasa Dunia.",
      taskContactTitle: "Bercakap dengan penasihat",
      taskContactDesc: "WhatsApp atau hubungi pasukan kemasukan kami secara terus untuk bimbingan peribadi.",
      pricingEyebrow: "Yuran Rasmi 2026",
      pricingTitle: "Struktur Yuran Kursus yang Telus",
      pricingSubtitle: "Yuran pengajian rasmi yang diterbitkan. Hubungi kemasukan untuk diskaun berkumpulan, pelan ansuran dan pengambilan promosi.",
      pricingTabGeneral: "Bahasa Inggeris Umum",
      pricingTabIelts: "Persediaan IELTS",
      pricingTabCamps: "Kem Cuti Sekolah",
      pricingTabPrivate: "Privat 1-ke-1",
      pricingTabExecutive: "Korporat & Eksekutif",
      pricingTabWorld: "Bahasa Dunia",
      startHereEyebrow: "Mula di sini",
      startHereTitle: "Pilih laluan anda ke arah kefasihan.",
      startHereDesc: "Terokai kursus bertauliah, tempah sesi perundingan kampus, atau akses akaun pelajar anda.",
      admissionsTag: "Kemasukan",
      taskPortalTitle: "Portal Pelajar & Kakitangan",
      taskPortalDesc: "Log masuk untuk melihat jadual kelas, rekod kehadiran, sumber pembelajaran dan gred.",
      facilitiesEyebrow: "Kemudahan Kampus",
      facilitiesTitle: "Ruang Pembelajaran Moden di Pavilion Embassy",
      facilitiesSubtitle: "Alami bilik darjah multimedia serba canggih, ruang istirahat eksekutif, suite belajar peribadi dan zon rehat pelajar kami.",
      journeyEyebrow: "Perjalanan Pelajar",
      journeyTitle: "Dari Pertanyaan Pertama Hingga Kefasihan Bahasa",
      journeySubtitle: "Pelan tindakan 5 peringkat yang direka untuk pemerolehan bahasa pantas, integrasi budaya dan peningkatan bertauliah.",
      testimonialsEyebrow: "Kisah Pelajar",
      testimonialsTitle: "Apa Kata Pelajar Kami",
      testimonialsSubtitle: "Maklum balas tulen daripada pelajar antarabangsa, profesional dan ibu bapa yang belajar di Bilingual Idol.",
      contactStripTitle: "Bersedia untuk memulakan perjalanan bahasa anda?",
      contactStripSubtitle: "Lawati kampus kami di Pavilion Embassy, Ampang atau berbincang dengan perunding pendidikan hari ini.",
      contactStripButton: "Hubungi bahagian kemasukan",
      languageBandTitle: "Bahasa-bahasa Dunia Ditawarkan",
      languageBandSubtitle: "Bahasa Inggeris, Bahasa Melayu, Mandarin, Arab, Jepun dan Korea diajar oleh pakar bahasa berdedikasi.",
    },
    about: {
      eyebrow: "Tentang Kami",
      heroTitle: "Pembelajaran bahasa yang dibina atas kemajuan yang jelas.",
      heroSubtitle: "Pusat Bahasa Bilingual Idol menyokong pelajar di Kuala Lumpur dengan laluan bahasa berfokus, perundingan dan komunikasi yang yakin.",
      storyEyebrow: "Permulaan yang teliti",
      storyTitle: "Perkara yang disokong pusat ini",
      storyBody: "Pusat ini menyediakan persekitaran pembelajaran dengan bilik darjah interaktif, sumber pembelajaran digital, panduan penempatan dan laluan bahasa yang diperibadikan.",
      explorePrograms: "Terokai program",
      approachEyebrow: "Pendekatan pembelajaran",
      approachTitle: "Bagaimana pembelajaran disokong",
      approachSubtitle: "Langkah seterusnya yang jelas, latihan aktif dan pembinaan keyakinan berterusan membentuk pendekatan pembelajaran pusat kami.",
      approach1Title: "Bermula dengan matlamat pelajar",
      approach1Body: "Perundingan dan bimbingan penempatan membantu mengenal pasti laluan bahasa yang bersesuaian sebelum pendaftaran.",
      approach2Title: "Berlatih secara aktif",
      approach2Body: "Pusat ini mengutamakan pembelajaran interaktif yang disokong oleh alat bilik darjah digital dan latihan berpandu.",
      approach3Title: "Bina keyakinan secara mantap",
      approach3Body: "Laluan pembelajaran direka merangkumi perkembangan bahasa, kesedaran budaya dan komunikasi praktikal.",
      communityEyebrow: "Komuniti dan latihan",
      communityTitle: "Tempat untuk terus maju ke hadapan",
      communityCaption: "Kemahiran bahasa berkembang melalui pertukaran bermakna dan latihan bersama.",
      teamEyebrow: "Penasihat & Tenaga Pengajar",
      teamTitle: "Pengajar bertauliah yang berdedikasi untuk kemajuan anda",
      teamSubtitle: "Tenaga pengajar kami menggabungkan kelayakan antarabangsa yang diiktiraf, pedagogi komunikatif dan bimbingan prihatin.",
    },
    programs: {
      eyebrow: "Program",
      heroTitle: "Cari program yang sesuai untuk pelajar.",
      heroSubtitle: "Terokai panduan kursus 2026 yang diterbitkan, kemudian hubungi pusat untuk mengesahkan kesesuaian, ketersediaan dan yuran terkini.",
      guideEyebrow: "Panduan yuran 2026",
      guideTitle: "Pilihan kursus yang diterbitkan",
      guideSubtitle: "Yuran adalah panduan dari senarai 2026. Sahkan jumlah yuran, keperluan visa dan tarikh pengambilan dengan pusat sebelum pendaftaran.",
      searchPlaceholder: "Cari mengikut bahasa, tahap atau kumpulan pelajar",
      filterLabel: "Tapis",
      countShown: "{count} program disahkan dipaparkan",
      noMatches: "Tiada program yang sepadan dengan carian semasa. Cuba tukar kategori atau kata kunci carian.",
      viewDetails: "Lihat butiran program",
      catAll: "Semua",
      catKids: "Kanak-kanak",
      catEnglish: "Bahasa Inggeris",
      catWorldLanguages: "Bahasa Dunia",
      catProfessional: "Profesional",
    },
    programDetail: {
      backLink: "Kembali ke senarai program",
      overviewEyebrow: "Gambaran keseluruhan program",
      duration: "Tempoh",
      schedule: "Jadual",
      fees: "Yuran",
      level: "Tahap",
      ageGroup: "Kumpulan Sasaran",
      outcomesTitle: "Hasil Pembelajaran Utama",
      ctaTitle: "Berminat dengan program ini?",
      ctaSubtitle: "Hantar pertanyaan pembelajaran untuk menyemak ketersediaan terkini dan membincangkan penempatan anda.",
      ctaButton: "Buat pertanyaan sekarang",
    },
    contact: {
      eyebrow: "Hubungi",
      heroTitle: "Hubungi pihak pusat kami.",
      heroSubtitle: "Pilih kaedah komunikasi yang paling mudah untuk anda, atau hantar pertanyaan ringkas di bawah.",
      call: "Telefon",
      whatsapp: "WhatsApp",
      whatsappValue: "Mesej pusat kami",
      email: "E-mel",
      hours: "Waktu operasi",
      address: "B-25-07, Pavilion Embassy, Menara G-Vestor, 200, Jln Ampang, 50450 Kuala Lumpur.",
      formEyebrow: "Hantar pertanyaan",
      formTitle: "Beritahu kami keperluan pembelajaran anda.",
      formSubtitle: "Penerangan ringkas mengenai matlamat bahasa dan waktu pilihan sudah mencukupi untuk memulakan langkah.",
      formCardTitle: "Pertanyaan anda",
    },
    enroll: {
      backLink: "Kembali ke laman utama",
      eyebrow: "Pertanyaan pembelajaran",
      heroTitle: "Beritahu pusat tentang maklumat pelajar.",
      heroSubtitle: "Hantar butiran yang anda tahu. Membuat pertanyaan tidak mengikat anda kepada mana-mana kursus.",
      nextStepsTitle: "Apa yang berlaku seterusnya",
      step1: "Pusat akan menyemak matlamat bahasa dan tahap semasa pelajar.",
      step2: "Pusat akan mengesyorkan langkah seterusnya yang relevan atau mengajukan soalan susulan.",
      step3: "Maklumat anda hanya dikendalikan oleh kakitangan pusat yang diberi kuasa.",
      formEyebrow: "Maklumat pelajar",
      requiredNote: "Medan bertanda bintang (*) adalah wajib.",
    },
    news: {
      eyebrow: "Kemas Kini & Makluman",
      heroTitle: "Berita dan pengumuman pusat.",
      heroSubtitle: "Baca makluman terkini, jadual cuti dan kemas kini akademik daripada Bilingual Idol.",
      searchPlaceholder: "Cari artikel berita...",
      allCategories: "Semua kategori",
      readMore: "Baca artikel",
    },
    login: {
      eyebrow: "Akses Portal",
      heroTitle: "Log masuk ke akaun anda.",
      heroSubtitle: "Akses papan pemuka, jadual kelas dan sumber pusat anda.",
      emailLabel: "Alamat e-mel",
      emailPlaceholder: "anda@contoh.com",
      passwordLabel: "Kata laluan",
      passwordPlaceholder: "Masukkan kata laluan anda",
      showPassword: "Tunjukkan kata laluan",
      hidePassword: "Sembunyikan kata laluan",
      submitButton: "Log masuk",
      signingIn: "Sedang log masuk...",
      helpTitle: "Perlukan akses akaun?",
      helpText: "Hubungi bahagian kemasukan atau pengajar anda untuk mendapatkan kelayakan pelajar atau ibu bapa.",
    },
    userDashboard: {
      welcome: "Selamat kembali",
      roleStudent: "Akaun pelajar",
      roleTeacher: "Akaun guru",
      roleMember: "Akaun ahli",
      subtitle: "Akaun anda telah bersedia. Maklumat yang dikongsi oleh pusat akan dipaparkan di sini apabila tersedia untuk peranan anda.",
      nextStepTitle: "Cari program pembelajaran",
      nextStepText: "Semak maklumat program semasa atau hubungi pusat jika anda memerlukan bantuan memilih pilihan yang tepat.",
      nextStepButton: "Lihat program",
      attendanceTitle: "Maklumat kehadiran",
      attendanceLoading: "Kehadiran: sedang dimuatkan",
      attendanceLoadingText: "Ringkasan kehadiran terkini anda sedang disediakan.",
      attendanceScore: "Kehadiran: {percentage}%",
      attendanceScoreText: "{attended} daripada {total} sesi selesai telah dihadiri. Tanda hadir dan lewat dikira sebagai hadir.",
      attendanceNotAvailable: "Kehadiran belum tersedia.",
      attendanceNotAvailableText: "Peratusan kehadiran anda akan dipaparkan selepas pihak pusat merekodkan sesi yang telah selesai.",
      signOut: "Log keluar",
      preparing: "Menyediakan ruang kerja anda",
      preparingText: "Sila tunggu sebentar sementara akses akaun anda disahkan.",
    },
    form: {
      studentName: "Nama penuh pelajar *",
      studentNamePlaceholder: "cth. Siti Nurhaliza",
      studentAge: "Umur pelajar *",
      studentAgePlaceholder: "cth. 16",
      parentName: "Nama ibu bapa / penjaga *",
      parentNamePlaceholder: "cth. Ahmad Faiz",
      parentEmail: "E-mel perhubungan *",
      parentEmailPlaceholder: "nama@contoh.com",
      parentPhone: "Nombor telefon (dengan kod negara) *",
      parentPhonePlaceholder: "+60 12 345 6789",
      programInterest: "Program yang diminati *",
      selectProgram: "Pilih satu program...",
      preferredSchedule: "Jadual pilihan *",
      selectSchedule: "Pilih jadual...",
      weekdayMorning: "Pagi Hari Bekerja (9:00 PG - 12:00 TGH)",
      weekdayAfternoon: "Petang Hari Bekerja (2:00 PTG - 5:00 PTG)",
      weekdayEvening: "Malam Hari Bekerja (6:30 PTG - 9:00 MLM)",
      weekendIntensive: "Intensif Hujung Minggu (Sab/Ahad)",
      flexiblePrivate: "Jadual Peribadi Fleksibel 1-dengan-1",
      message: "Butiran tambahan atau matlamat",
      messagePlaceholder: "Beritahu kami tentang tahap bahasa semasa, tempoh masa atau matlamat khusus...",
      submitEnquiry: "Hantar pertanyaan",
      sending: "Sedang menghantar...",
      successTitle: "Terima kasih — kami telah menerima maklumat anda.",
      successText: "Pasukan kemasukan kami akan menghubungi anda dalam tempoh 24 jam untuk membincangkan langkah seterusnya.",
      submitAnother: "Hantar maklum balas lain",
      kicker: "Mari berbincang",
      stepInfo: "Info Pelajar",
      stepTrack: "Pilihan Kursus",
      stepContact: "Penjaga & Hubungan",
    },
    placementModal: {
      title: "Ujian Penilaian Bahasa Inggeris 3 Minit Percuma",
      subtitle: "Jawab 8 soalan pantas untuk mengenal pasti tahap CEFR anda (A1–C1) dan terima cadangan kursus yang diperibadikan.",
      questionNumber: "Soalan {current} daripada {total}",
      completeBtn: "Lihat Penilaian & Laluan Kursus Disyorkan",
      resultTitle: "Keputusan Penilaian Bahasa Inggeris CEFR Anda",
      yourLevel: "Anggaran Tahap CEFR",
      diagnosticScore: "Skor Diagnostik: {score}/8 ({pct}%)",
      recommendedCourse: "Laluan Kursus Disyorkan:",
      enrollWithScore: "Daftar dengan skor ini",
      retake: "Ambil semula ujian",
    },
    bookingModal: {
      title: "Tempah Perundingan Kampus & Audit Tahap",
      subtitle: "Temui penasihat akademik kami di Pavilion Embassy, KL untuk perundingan pelan pembelajaran yang diperibadikan.",
      selectDate: "Pilih Tarikh Pilihan *",
      selectTime: "Pilih Slot Masa Pilihan *",
      consultationReason: "Objektif Perundingan *",
      bookBtn: "Sahkan Temujanji Kampus",
      successTitle: "Temujanji Berjaya Ditempah!",
      successDesc: "Pasukan kemasukan kami telah menempah slot anda. Kami telah menghantar maklumat pengesahan ke kenalan anda.",
    },
    chat: {
      widgetTitle: "Pembantu Kemasukan",
      welcome: "Selamat sejahtera! Selamat datang ke Pusat Bahasa Bilingual Idol di Pavilion Embassy. Bagaimana saya boleh membantu anda hari ini?",
      placeholder: "Tanya tentang kursus, IELTS, yuran, jadual...",
      send: "Hantar",
    },
  },
  ar: {
    nav: {
      home: "الرئيسية",
      about: "من نحن",
      programs: "البرامج التعليمية",
      news: "الأخبار",
      contact: "اتصل بنا",
      makeEnquiry: "تقديم استفسار",
      signIn: "تسجيل الدخول",
      signOut: "تسجيل الخروج",
      skipToContent: "الانتقال إلى المحتوى",
      menu: "القائمة",
      close: "إغلاق",
      workspace: "مساحة العمل",
      accountActive: "الحساب نشط",
      myClasses: "فصولي الدراسية",
      overview: "نظرة عامة",
      users: "المستخدمون",
      students: "الطلاب",
      media: "الوسائط",
      auditLogs: "سجلات التدقيق",
      switchLanguage: "اللغة",
      contactUs: "اتصل بنا",
      enrollNow: "سجل الآن",
      bookTour: "حجز جولة في الحرم الجامعي",
    },
    footer: {
      centreName: "مركز بايلينجوال آيدول للغات",
      location: "بافيليون إمباسي، كوالالمبور",
      brandSubtitle: "مركز لغات",
      allRightsReserved: "جميع الحقوق محفوظة",
    },
    common: {
      call: "اتصال هاتفي",
      whatsapp: "واتساب",
      email: "البريد الإلكتروني",
      openingHours: "ساعات العمل",
      backToHome: "العودة للرئيسية",
      viewDetails: "عرض التفاصيل",
      readMore: "قراءة المقال",
      learnMore: "معرفة المزيد",
      submit: "إرسال",
      loading: "جارٍ التحميل...",
      filter: "تصفية",
      all: "الكل",
      search: "بحث",
      thankYou: "شكراً لك",
      close: "إغلاق",
      requiredFields: "الحقول المميزة بعلامة (*) مطلوبة.",
      viewProgrammes: "استعراض البرامج",
      cancel: "إلغاء",
      next: "التالي",
      prev: "السابق",
      step: "خطوة",
      sendMessage: "إرسال الاستفسار",
      location: "الموقع",
      addressText: "B-25-07، بافيليون إمباسي، برج جي-فيستور، 200، شارع أمبانغ، 50450 كوالالمبور.",
    },
    home: {
      eyebrow: "الموسم الأكاديمي 2026 · بافيليون إمباسي، كوالالمبور",
      heroTitle: "مركز بايلينجوال آيدول للغات",
      heroSubtitle: "برامج لغوية منظمة، تحضير معتمد لاختبارات الآيلتس (IELTS) ومسارات لغات عالمية متميزة في بافيليون إمباسي، كوالالمبور.",
      ctaFindCourse: "ابحث عن دورتك",
      ctaEnquiry: "تقديم استفسار",
      ctaPlacement: "اختبار تحديد مستوى مجاني",
      ctaBooking: "حجز استشارة أكاديمية",
      taskPlacementTitle: "اختبار تحديد المستوى عبر الإنترنت",
      taskPlacementDesc: "قيّم مستواك اللغوي في 3 دقائق مع نتيجة فورية وتوصية بالدورة المناسبة.",
      taskConsultationTitle: "حجز استشارة في المقر",
      taskConsultationDesc: "احجز جولة خاصة وجلسة لتخطيط مسارك اللغوي وجهاً لوجه في بافيليون إمباسي.",
      taskProgramsTitle: "استعراض برامج 2026",
      taskProgramsDesc: "اللغة الإنجليزية العامة، الآيلتس، المخيمات الصيفية، برامج الشركات واللغات العالمية.",
      taskContactTitle: "تحدث مع مستشار تعليمي",
      taskContactDesc: "تواصل عبر الواتساب أو اتصل بفريق القبول مباشرة للحصول على إرشاد شخصي.",
      pricingEyebrow: "الرسوم الرسمية لعام 2026",
      pricingTitle: "هيكل رسوم دراسية واضح وشفاف",
      pricingSubtitle: "الرسوم الدراسية الرسمية المعتمدة. تواصل مع قسم القبول للاستفسار عن الخصومات وخطط التقسيط.",
      pricingTabGeneral: "الإنجليزية العامة",
      pricingTabIelts: "تحضير الآيلتس",
      pricingTabCamps: "المخيمات الصيفية والشتوية",
      pricingTabPrivate: "دروس خاصة 1-على-1",
      pricingTabExecutive: "برامج الشركات والتنفيذيين",
      pricingTabWorld: "اللغات العالمية",
      startHereEyebrow: "ابدأ من هنا",
      startHereTitle: "اختر مسارك نحو الطلاقة والتميز.",
      startHereDesc: "استكشف الدورات المعتمدة، احجز استشارة في المقر، أو سجل الدخول إلى حسابك.",
      admissionsTag: "القبول والتسجيل",
      taskPortalTitle: "بوابة الطلاب والأساتذة",
      taskPortalDesc: "سجل الدخول لعرض الجداول الدراسية وسجلات الحضور والموارد الأكاديمية.",
      facilitiesEyebrow: "مرافق المركز",
      facilitiesTitle: "مساحات تعليمية حديثة في بافيليون إمباسي",
      facilitiesSubtitle: "استمتع بقاعاتنا الدراسية المزودة بأحدث تقنيات الوسائط المتعددة، وصالات كبار الشخصيات، وقاعات الدراسة الهادئة.",
      journeyEyebrow: "رحلة الطالب",
      journeyTitle: "من أول استفسار وحتى الطلاقة اللغوية",
      journeySubtitle: "خارطة طريق مدروسة من 5 مراحل مصممة لاكتساب لغوي سريع، اندماج ثقافي وشهادات معتمدة.",
      testimonialsEyebrow: "تجارب الطلاب",
      testimonialsTitle: "ماذا يقول طلابنا عنا",
      testimonialsSubtitle: "آراء وانطباعات حقيقية من الطلاب الدوليين، المهنيين وأولياء الأمور الذين درسوا في المركز.",
      contactStripTitle: "هل أنت مستعد لبدء رحلتك اللغوية؟",
      contactStripSubtitle: "قم بزيارة مقرنا في بافيليون إمباسي بشارع أمبانغ أو تحدث مع مستشارنا التعليمي اليوم.",
      contactStripButton: "تواصل مع قسم القبول",
      languageBandTitle: "اللغات العالمية المتاحة",
      languageBandSubtitle: "الإنجليزية، الملايوية، الماندرين، العربية، اليابانية والكورية بإشراف أساتذة متخصصين.",
    },
    about: {
      eyebrow: "من نحن",
      heroTitle: "تعليم لغوي مبني على تقدم واضح ونتائج ملموسة.",
      heroSubtitle: "يدعم مركز بايلينجوال آيدول الطلاب في كوالالمبور بمسارات لغوية دقيقة واستشارات تركز على التواصل الواثق.",
      storyEyebrow: "انطلاقة مدروسة",
      storyTitle: "ما يقدمه المركز لطلابه",
      storyBody: "يوفر المركز بيئة تعليمية متكاملة تضم فصولاً تفاعلية، موارد تعليمية رقمية حديثة، وتوجيهاً لمسارات تعليمية مخصصة.",
      explorePrograms: "استكشف البرامج",
      approachEyebrow: "منهجية التعليم",
      approachTitle: "كيف ندعم تقدمك التعليمي",
      approachSubtitle: "خطوات واضحة، ممارسة عملية نشطة وبناء مستمر للثقة ترسم ملامح النهج التعليمي للمركز.",
      approach1Title: "البدء بأهداف الطالب",
      approach1Body: "تساعد الاستشارة وتحديد المستوى في اختيار المسار اللغوي الأنسب قبل التسجيل.",
      approach2Title: "ممارسة لغوية تفاعلية",
      approach2Body: "يعتمد المركز على التعليم التفاعلي المدعوم بأدوات الفصول الرقمية والممارسة الموجهة.",
      approach3Title: "بناء الثقة بثبات",
      approach3Body: "صممت مساراتنا لتجمع بين تطوير اللغة، الوعي الثقافي والقدرة على التواصل العملي اليومي.",
      communityEyebrow: "مجتمع وممارسة",
      communityTitle: "مكان مثالي للمضي قدماً في طموحاتك",
      communityCaption: "تتطور اللغة من خلال التبادل الهادف والممارسة اليومية المشتركة.",
      teamEyebrow: "الهيئة التدريسية والاستشارية",
      teamTitle: "مدربون مؤهلون مكرسون لنجاحك الأكاديمي",
      teamSubtitle: "يجمع كادرنا بين المؤهلات الدولية المعتمدة والأساليب التعليمية الحديثة والتوجيه المخلص.",
    },
    programs: {
      eyebrow: "البرامج التعليمية",
      heroTitle: "اختر البرنامج الذي يناسب أهدافك وتطلعاتك.",
      heroSubtitle: "استعرض دليل دورات عام 2026، ثم تواصل مع المركز لتأكيد الملاءمة، التوفر والرسوم الحالية.",
      guideEyebrow: "دليل رسوم 2026",
      guideTitle: "خيارات الدورات المتاحة",
      guideSubtitle: "الرسوم استرشادية وفق قائمة 2026. يرجى تأكيد المبلغ الإجمالي وشروط التأشيرة مع المركز قبل التسجيل.",
      searchPlaceholder: "ابحث باللغة أو المستوى أو الفئة المستهدفة...",
      filterLabel: "تصفية",
      countShown: "تم عرض {count} برنامج معتمد",
      noMatches: "لا توجد برامج مطابقة لبحثك الحالي. جرب تغيير الفئة أو كلمات البحث.",
      viewDetails: "عرض تفاصيل البرنامج",
      catAll: "الكل",
      catKids: "للأطفال واليافعين",
      catEnglish: "اللغة الإنجليزية",
      catWorldLanguages: "لغات عالمية",
      catProfessional: "للشركات والمهنيين",
    },
    programDetail: {
      backLink: "العودة إلى قائمة البرامج",
      overviewEyebrow: "نظرة عامة على البرنامج",
      duration: "المدة",
      schedule: "الجدول الزمني",
      fees: "الرسوم",
      level: "المستوى",
      ageGroup: "الفئة المستهدفة",
      outcomesTitle: "أبرز مخرجات التعلم",
      ctaTitle: "هل أنت مهتم بهذا البرنامج؟",
      ctaSubtitle: "أرسل استفسارك الآن للتحقق من المواعيد المتاحة ومناقشة تفاصيل الالتحاق.",
      ctaButton: "تقديم استفسار الآن",
    },
    contact: {
      eyebrow: "اتصل بنا",
      heroTitle: "تواصل مع فريق المركز.",
      heroSubtitle: "اختر وسيلة التواصل الأنسب لك، أو أرسل استفساراً سريعاً عبر النموذج أدناه.",
      call: "اتصال هاتفي",
      whatsapp: "واتساب",
      whatsappValue: "مراسلة المركز عبر واتساب",
      email: "البريد الإلكتروني",
      hours: "أوقات العمل",
      address: "B-25-07، بافيليون إمباسي، برج جي-فيستور، 200، شارع أمبانغ، 50450 كوالالمبور.",
      formEyebrow: "إرسال استفسار",
      formTitle: "أخبرنا بما يحتاجه الطالب.",
      formSubtitle: "وصف موجز لهدف الطالب ومواعيده المفضلة كافٍ لبدء المساعدة والتوجيه.",
      formCardTitle: "نموذج استفسارك",
    },
    enroll: {
      backLink: "العودة للرئيسية",
      eyebrow: "استفسار تعليمي",
      heroTitle: "أخبر المركز عن تفاصيل الطالب.",
      heroSubtitle: "أرسل البيانات التي تعرفها حالياً. تقديم الاستفسار لا يلزمك بالتسجيل الفوري.",
      nextStepsTitle: "ماذا يحدث بعد الإرسال؟",
      step1: "يقوم المستشار بمراجعة هدف الطالب اللغوي ومستواه الحالي.",
      step2: "يقترح المركز الخطوة التالية المناسبة أو يطرح أسئلة إضافية للمساعدة.",
      step3: "تتم معالجة بياناتك بكل خصوصية من قبل موظفي المركز المعتمدين.",
      formEyebrow: "بيانات الطالب",
      requiredNote: "الحقول المشار إليها بعلامة (*) مطلوبة.",
    },
    news: {
      eyebrow: "تحديثات وإعلانات",
      heroTitle: "أخبار وإعلانات المركز.",
      heroSubtitle: "تابع آخر المستجدات، جداول العطلات الرسمية والمواعيد الأكاديمية الصادرة عن المركز.",
      searchPlaceholder: "البحث في الأخبار والمقالات...",
      allCategories: "جميع الفئات",
      readMore: "قراءة المقال",
    },
    login: {
      eyebrow: "بوابة الدخول",
      heroTitle: "تسجيل الدخول إلى حسابك.",
      heroSubtitle: "الوصول إلى لوحة التحكم، جداول الحصص الدراسية وموارد المركز التعليمية.",
      emailLabel: "البريد الإلكتروني",
      emailPlaceholder: "name@example.com",
      passwordLabel: "كلمة المرور",
      passwordPlaceholder: "أدخل كلمة المرور",
      showPassword: "إظهار كلمة المرور",
      hidePassword: "إخفاء كلمة المرور",
      submitButton: "تسجيل الدخول",
      signingIn: "جارٍ تسجيل الدخول...",
      helpTitle: "هل تحتاج إلى حساب؟",
      helpText: "يرجى التواصل مع إدارة القبول أو معلمك للحصول على بيانات الدخول الخاصة بك.",
    },
    userDashboard: {
      welcome: "أهلاً بك",
      roleStudent: "حساب طالب",
      roleTeacher: "حساب معلم",
      roleMember: "حساب عضو",
      subtitle: "حسابك جاهز. ستظهر المعلومات المخصصة لدورك هنا بمجرد نشرها من قبل إدارة المركز.",
      nextStepTitle: "البحث عن برنامج تعليمي",
      nextStepText: "استعرض البرامج المتاحة حالياً أو تواصل مع إدارة المركز لمساعدتك في اختيار المسار الأفضل.",
      nextStepButton: "استعراض البرامج",
      attendanceTitle: "سجل الحضور والغياب",
      attendanceLoading: "سجل الحضور: جارٍ التحميل",
      attendanceLoadingText: "يتم تجهيز ملخص حضورك الأخير.",
      attendanceScore: "نسبة الحضور: {percentage}%",
      attendanceScoreText: "تم حضور {attended} من أصل {total} حصة مسجلة. يشمل الحضور علامات التأخير والحضور المنتظم.",
      attendanceNotAvailable: "بيانات الحضور غير متوفرة بعد.",
      attendanceNotAvailableText: "ستظهر نسبة حضورك تلقائياً بعد أن يقوم المركز بتسجيل الحصص المكتملة لحسابك.",
      signOut: "تسجيل الخروج",
      preparing: "جاري تجهيز مساحة العمل",
      preparingText: "يرجى الانتظار بينما يتم التحقق من صلاحيات حسابك.",
    },
    form: {
      studentName: "اسم الطالب الثلاثي *",
      studentNamePlaceholder: "مثال: أحمد عبد الله",
      studentAge: "عمر الطالب *",
      studentAgePlaceholder: "مثال: 16",
      parentName: "اسم ولي الأمر / الوصي *",
      parentNamePlaceholder: "مثال: عبد الله محمد",
      parentEmail: "البريد الإلكتروني للتواصل *",
      parentEmailPlaceholder: "name@example.com",
      parentPhone: "رقم الهاتف (مع مفتاح الدولة) *",
      parentPhonePlaceholder: "+966 50 123 4567",
      programInterest: "البرنامج المطلوب *",
      selectProgram: "اختر البرنامج...",
      preferredSchedule: "الموعد والجدول المفضل *",
      selectSchedule: "اختر الموعد...",
      weekdayMorning: "الفترة الصباحية خلال الأسبوع (9:00 ص - 12:00 م)",
      weekdayAfternoon: "فترة بعد الظهر خلال الأسبوع (2:00 م - 5:00 م)",
      weekdayEvening: "الفترة المسائية خلال الأسبوع (6:30 م - 9:00 م)",
      weekendIntensive: "مكثف نهاية الأسبوع (السبت والأحد)",
      flexiblePrivate: "دروس خاصة مرنة 1-على-1",
      message: "تفاصيل أو أهداف إضافية",
      messagePlaceholder: "أخبرنا عن مستواك الحالي، الخطة الزمنية أو أي متطلبات خاصة...",
      submitEnquiry: "إرسال الاستفسار",
      sending: "جارٍ الإرسال...",
      successTitle: "شكراً لك — تم استلام بياناتك بنجاح.",
      successText: "سيتواصل معك فريق القبول لدينا خلال 24 ساعة لمناقشة أفضل خطوة تالية لمسيرتك التعليمية.",
      submitAnother: "إرسال استفسار آخر",
      kicker: "تواصل معنا",
      stepInfo: "بيانات الطالب",
      stepTrack: "المسار الدراسي",
      stepContact: "ولي الأمر والتواصل",
    },
    placementModal: {
      title: "تقييم اللغة الإنجليزية المجاني عبر الإنترنت (3 دقائق)",
      subtitle: "أجب عن 8 أسئلة سريعة لتحديد مستواك وفق الإطار الأوروبي المشترك (CEFR) والحصول على توصية بالدورة المناسبة.",
      questionNumber: "السؤال {current} من {total}",
      completeBtn: "عرض تقييمي والمسار الموصى به",
      resultTitle: "نتيجة تقييم مستواك في اللغة الإنجليزية",
      yourLevel: "المستوى التقديري (CEFR)",
      diagnosticScore: "الدرجة التشخيصية: {score}/8 ({pct}%)",
      recommendedCourse: "المسار التعليمي الموصى به:",
      enrollWithScore: "التسجيل بهذه النتيجة",
      retake: "إعادة الاختبار",
    },
    bookingModal: {
      title: "حجز استشارة أكاديمية واختبار مستوى في المقر",
      subtitle: "قابل مستشارنا الأكاديمي في بافيليون إمباسي، كوالالمبور للحصول على خطة دراسية مخصصة.",
      selectDate: "اختر التاريخ المفضل *",
      selectTime: "اختر الوقت المفضل *",
      consultationReason: "هدف الاستشارة *",
      bookBtn: "تأكيد موعد الزيارة",
      successTitle: "تم تأكيد موعدك بنجاح!",
      successDesc: "قام فريق القبول بحجز موعدك. أرسلنا تفاصيل الموعد إلى وسيلة التواصل الخاصة بك.",
    },
    chat: {
      widgetTitle: "مساعد القبول والتسجيل",
      welcome: "أهلاً بك! مرحباً بك في مركز بايلينجوال آيدول للغات في بافيليون إمباسي. كيف يمكنني مساعدتك اليوم؟",
      placeholder: "اسأل عن الدورات، الآيلتس، الرسوم، المواعيد...",
      send: "إرسال",
    },
  },
};

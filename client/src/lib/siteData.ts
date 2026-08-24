export type Program = {
  slug: string;
  title: string;
  language: string;
  category: "Kids" | "English" | "World Languages" | "Professional";
  ageGroup: string;
  level: string;
  duration: string;
  schedule: string;
  fees: string;
  description: string;
  outcomes: string[];
};

export const PROGRAMS: Program[] = [
  { slug: "general-english", title: "General English", language: "English", category: "English", ageGroup: "Teens & adults", level: "Beginner to advanced", duration: "Designed around your learning plan", schedule: "Confirmed with the centre after consultation", fees: "Fee guidance available on enquiry", description: "Build everyday confidence across speaking, listening, reading, and writing through practical, interactive learning.", outcomes: ["Communicate with greater ease", "Use grammar with confidence", "Participate in real-life conversations"] },
  { slug: "kids-english", title: "Kids English", language: "English", category: "Kids", ageGroup: "Children", level: "Foundation to developing", duration: "Designed around your child's learning plan", schedule: "Confirmed with the centre after consultation", fees: "Fee guidance available on enquiry", description: "A playful, supportive foundation for young learners to grow their English through communication and guided practice.", outcomes: ["Enjoy language learning", "Build a confident foundation", "Develop expressive vocabulary"] },
  { slug: "speaking-conversation", title: "Speaking & Conversation", language: "English", category: "English", ageGroup: "Teens & adults", level: "Elementary to advanced", duration: "Designed around your learning plan", schedule: "Confirmed with the centre after consultation", fees: "Fee guidance available on enquiry", description: "A speaking-first programme for learners who want their words to feel natural, clear, and ready for daily life.", outcomes: ["Speak more spontaneously", "Improve clarity and flow", "Navigate common social situations"] },
  { slug: "ielts-preparation", title: "IELTS Preparation", language: "English", category: "Professional", ageGroup: "Teens & adults", level: "Intermediate and above", duration: "Designed around your exam goals", schedule: "Confirmed with the centre after consultation", fees: "Fee guidance available on enquiry", description: "Focused preparation for learners planning to demonstrate their English proficiency for study, work, or migration.", outcomes: ["Understand the test format", "Practise all four skills", "Prepare a personalised study pathway"] },
  { slug: "bahasa-melayu", title: "Bahasa Melayu", language: "Bahasa Melayu", category: "World Languages", ageGroup: "Teens & adults", level: "Beginner to advanced", duration: "Designed around your learning plan", schedule: "Confirmed with the centre after consultation", fees: "Fee guidance available on enquiry", description: "Connect more confidently with life in Malaysia through structured Bahasa Melayu language learning.", outcomes: ["Handle everyday interactions", "Build vocabulary for local life", "Develop practical comprehension"] },
  { slug: "mandarin", title: "Mandarin", language: "Mandarin", category: "World Languages", ageGroup: "Children, teens & adults", level: "Beginner to advanced", duration: "Designed around your learning plan", schedule: "Confirmed with the centre after consultation", fees: "Fee guidance available on enquiry", description: "A clear pathway into Mandarin that supports communication, listening skills, and purposeful progression.", outcomes: ["Build useful spoken vocabulary", "Develop listening confidence", "Progress at your own pace"] },
  { slug: "arabic", title: "Arabic", language: "Arabic", category: "World Languages", ageGroup: "Teens & adults", level: "Beginner to advanced", duration: "Designed around your learning plan", schedule: "Confirmed with the centre after consultation", fees: "Fee guidance available on enquiry", description: "Learn Arabic through guided practice that supports meaningful communication and steady progress.", outcomes: ["Strengthen practical communication", "Learn through clear structure", "Build confidence step by step"] },
  { slug: "japanese", title: "Japanese", language: "Japanese", category: "World Languages", ageGroup: "Teens & adults", level: "Beginner to developing", duration: "Designed around your learning plan", schedule: "Confirmed with the centre after consultation", fees: "Fee guidance available on enquiry", description: "Start your Japanese language journey with an approachable, well-paced programme built around your needs.", outcomes: ["Build language foundations", "Practise everyday expressions", "Develop cultural awareness"] },
  { slug: "korean", title: "Korean", language: "Korean", category: "World Languages", ageGroup: "Teens & adults", level: "Beginner to developing", duration: "Designed around your learning plan", schedule: "Confirmed with the centre after consultation", fees: "Fee guidance available on enquiry", description: "Learn Korean in a supportive environment that makes new vocabulary and expressions feel achievable.", outcomes: ["Use familiar phrases confidently", "Build listening foundations", "Learn through engaging practice"] },
  { slug: "business-english", title: "Business English", language: "English", category: "Professional", ageGroup: "Professionals", level: "Intermediate to advanced", duration: "Designed around workplace needs", schedule: "Confirmed with the centre after consultation", fees: "Fee guidance available on enquiry", description: "Refine professional communication for meetings, presentations, correspondence, and international workplace settings.", outcomes: ["Communicate with professional clarity", "Prepare for key workplace moments", "Use language with more authority"] },
];

export const PROGRAM_CATEGORIES = ["All", "Kids", "English", "World Languages", "Professional"] as const;

export const OFFICIAL_PROGRAMME_GUIDE = [
  { title: "General English", detail: "1, 3, 6, 9 or 12 months · 5 days/week", fee: "Tuition from RM 2,950", note: "Registration and placement fees are listed separately in the 2026 guide." },
  { title: "IELTS Preparation", detail: "Express 4 weeks · Intensive 8 weeks · Premium 12 weeks", fee: "RM 3,500–RM 9,900", note: "Includes placement test, progress assessment, learning materials and certificate of completion." },
  { title: "Summer Camp", detail: "Junior English 2 weeks · International and Leadership camps 4 weeks", fee: "RM 4,400–RM 7,600", note: "Packages list English classes, activities/trips, learning materials and certificates." },
  { title: "Private English Lessons", detail: "Silver 10 hours · Gold 20 hours · Platinum 40 hours", fee: "RM 1,800–RM 5,800", note: "Personalised lesson packages." },
  { title: "Executive English", detail: "Business English 1 month · Executive Communication 2 months · Corporate Masterclass customised", fee: "RM 3,800–RM 6,600", note: "Corporate English Masterclass is quoted on request." },
] as const;

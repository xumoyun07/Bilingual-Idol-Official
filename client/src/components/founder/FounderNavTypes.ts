import {
  BarChart3,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Crown,
  Database,
  FileCheck,
  FileImage,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Newspaper,
  ScrollText,
  Settings,
  Settings2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
  UsersRound,
} from "lucide-react";

export type PlatformUserType = "founder" | "super_admin" | "admin" | "teacher" | "marketing";

export interface SubMenuModule {
  id: string;
  title: string;
  description: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  path?: string;
}

export interface UserTypeNavSection {
  type: PlatformUserType;
  label: string;
  icon: typeof Crown;
  tone: string;
  roleBadge: string;
  description: string;
  modules: SubMenuModule[];
}

export const FOUNDER_NAVIGATION_SECTIONS: UserTypeNavSection[] = [
  {
    type: "founder",
    label: "Founder",
    icon: Crown,
    tone: "bg-[#fff8e6] text-[#b47d00] border-[#ffd580]",
    roleBadge: "Full Authority",
    description: "System root governance, user access, data schema, and security oversight.",
    modules: [
      {
        id: "founder-overview",
        title: "Overview",
        description: "Platform health, system metrics, and operational vitals.",
        icon: LayoutDashboard,
        badge: "Live",
      },
      {
        id: "founder-users",
        title: "User Accounts",
        description: "Manage all system user profiles, roles, and login credentials.",
        icon: UsersRound,
        badge: "CRUD",
      },
      {
        id: "founder-fields",
        title: "Field Builder",
        description: "Custom registration form fields, sections, and profile attributes.",
        icon: Settings2,
        badge: "CRUD",
      },
      {
        id: "founder-students",
        title: "Student Profiles",
        description: "Academic records, parent contact details, and student dossiers.",
        icon: GraduationCap,
        badge: "CRUD",
      },
      {
        id: "founder-news",
        title: "News & Announcements",
        description: "Create, edit, and publish institutional announcements.",
        icon: Newspaper,
        badge: "CRUD",
      },
      {
        id: "founder-media",
        title: "Media Library",
        description: "Public visual assets, banners, video slots, and CDN storage.",
        icon: FileImage,
        badge: "CRUD",
      },
      {
        id: "founder-audit",
        title: "Audit & Security Logs",
        description: "Inspect immutable security traces, actor actions, and sign-ins.",
        icon: ScrollText,
        badge: "Audit",
      },
      {
        id: "founder-dossier",
        title: "Project Dossier",
        description: "Official executive passport, financials, team, KPI metrics, and roadmap.",
        icon: FileCheck,
        badge: "Passport",
      },
      {
        id: "founder-settings",
        title: "Platform Settings",
        description: "Institutional branding, contact numbers, centre hours, and metadata.",
        icon: Settings,
        badge: "Config",
      },
    ],
  },
  {
    type: "super_admin",
    label: "Super Admin",
    icon: ShieldCheck,
    tone: "bg-[#efe8fb] text-[#6e4c9a] border-[#d8c3f8]",
    roleBadge: "Centre Ops",
    description: "Multi-branch oversight, staff account management, and profile builders.",
    modules: [
      {
        id: "superadmin-overview",
        title: "Super Admin Overview",
        description: "Centre operations status, staff distribution, and activity.",
        icon: LayoutDashboard,
      },
      {
        id: "superadmin-users",
        title: "Staff & User Directory",
        description: "Create, inspect, and manage staff and student accounts.",
        icon: UsersRound,
        badge: "CRUD",
      },
      {
        id: "superadmin-fields",
        title: "User Profile Schema",
        description: "Custom user registration attributes and dynamic sections.",
        icon: Settings2,
        badge: "CRUD",
      },
      {
        id: "superadmin-news",
        title: "Centre Announcements",
        description: "Publish operational alerts, holiday notices, and newsletters.",
        icon: Newspaper,
        badge: "CRUD",
      },
      {
        id: "superadmin-audit",
        title: "Security & Operations Logs",
        description: "Review staff activity, credential modifications, and audits.",
        icon: ScrollText,
      },
    ],
  },
  {
    type: "admin",
    label: "Admin",
    icon: Shield,
    tone: "bg-[#f4eddd] text-[#705a30] border-[#e4d3b1]",
    roleBadge: "Administration",
    description: "Daily centre administration, student admissions, programs, and schedules.",
    modules: [
      {
        id: "admin-overview",
        title: "Admin Dashboard",
        description: "Key operational indicators, admissions pipeline, and daily classes.",
        icon: LayoutDashboard,
      },
      {
        id: "admin-students",
        title: "Student Directory",
        description: "Student enrollments, academic levels, parent records, and notes.",
        icon: GraduationCap,
        badge: "CRUD",
      },
      {
        id: "admin-leads",
        title: "Admissions & Inquiries",
        description: "Prospective student submissions, lead statuses, and triage notes.",
        icon: FileSpreadsheet,
        badge: "CRUD",
      },
      {
        id: "admin-programs",
        title: "Language Programs",
        description: "Course catalogue, fees, schedule templates, and course descriptions.",
        icon: BookOpen,
        badge: "CRUD",
      },
      {
        id: "admin-schedule",
        title: "Class Timetable",
        description: "Assign teachers, classrooms, schedules, and student capacities.",
        icon: CalendarDays,
        badge: "CRUD",
      },
      {
        id: "admin-news",
        title: "Notices & Updates",
        description: "Manage institutional news and public updates.",
        icon: Newspaper,
        badge: "CRUD",
      },
    ],
  },
  {
    type: "teacher",
    label: "Teacher",
    icon: UsersRound,
    tone: "bg-[#e8eeff] text-[#173fad] border-[#c0d4ff]",
    roleBadge: "Instructional",
    description: "Teacher schedule, student attendance tracking, assessments, and lesson notes.",
    modules: [
      {
        id: "teacher-schedule",
        title: "Teacher Timetable",
        description: "Active class sessions, room assignments, and student rosters.",
        icon: Calendar,
      },
      {
        id: "teacher-attendance",
        title: "Attendance Management",
        description: "Mark and update attendance (Present, Absent, Late, Excused) with notes.",
        icon: CheckCircle2,
        badge: "CRUD",
      },
      {
        id: "teacher-grades",
        title: "Assessments & Grading",
        description: "Record scores, evaluation feedback, publish results, and review progress.",
        icon: FileText,
        badge: "CRUD",
      },
      {
        id: "teacher-lessons",
        title: "Lesson Curriculum",
        description: "Create lesson plans, study materials, topics, and learning guides.",
        icon: BookOpen,
        badge: "CRUD",
      },
    ],
  },
  {
    type: "marketing",
    label: "Marketing",
    icon: Megaphone,
    tone: "bg-[#fff0ed] text-[#a34732] border-[#ffd1c7]",
    roleBadge: "Growth & Media",
    description: "Marketing analytics, campaign promos, landing content, and testimonials.",
    modules: [
      {
        id: "marketing-overview",
        title: "Marketing Analytics",
        description: "Inquiry conversion funnels, channel metrics, and visitor trends.",
        icon: BarChart3,
      },
      {
        id: "marketing-leads",
        title: "Leads & Inquiries",
        description: "Track enrollment leads, contact stages, and follow-up notes.",
        icon: Users,
        badge: "CRUD",
      },
      {
        id: "marketing-campaigns",
        title: "Campaigns & Promos",
        description: "Seasonal promotional discounts, promo codes, and target audiences.",
        icon: Tag,
        badge: "CRUD",
      },
      {
        id: "marketing-content",
        title: "CMS Content Blocks",
        description: "Homepage hero messages, promotional text blocks, and announcements.",
        icon: Layers,
        badge: "CRUD",
      },
      {
        id: "marketing-testimonials",
        title: "Testimonials & Reviews",
        description: "Manage verified student reviews, ratings, quotes, and approvals.",
        icon: MessageSquare,
        badge: "CRUD",
      },
      {
        id: "marketing-media",
        title: "Creative Assets",
        description: "Upload and organize marketing media banners, logos, and promo creatives.",
        icon: FileImage,
        badge: "CRUD",
      },
    ],
  },
];

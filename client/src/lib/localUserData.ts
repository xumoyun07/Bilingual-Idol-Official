/**
 * Client-Side Secure Local User Data Storage Engine
 * Stores all student & user data on the user's local device.
 * Enforces privacy, zero unneeded telemetry, offline persistence,
 * and seamless Backup (Export to JSON) & Restore (Import from JSON).
 */

export interface LocalPlacementTest {
  id: string;
  completedAt: string;
  score: number;
  total: number;
  cefrLevel: string;
  recommendedCourse: string;
}

export interface LocalConsultationBooking {
  id: string;
  createdAt: string;
  date: string;
  timeSlot: string;
  reason: string;
  status: "confirmed" | "completed" | "cancelled";
}

export interface LocalUserProfile {
  fullName: string;
  email: string;
  phone: string;
  preferredLanguage: "en" | "ms" | "ar";
  targetScore: string;
  studyGoal: string;
  notes: string;
  lastUpdated: string;
}

export interface LocalUserDataState {
  version: number;
  profile: LocalUserProfile;
  savedProgramIds: string[];
  placementTests: LocalPlacementTest[];
  consultationBookings: LocalConsultationBooking[];
  studyNotes: Array<{ id: string; title: string; content: string; updatedAt: string }>;
  enquiryDraft: {
    studentName?: string;
    studentAge?: string;
    parentName?: string;
    parentEmail?: string;
    parentPhone?: string;
    programInterest?: string;
    preferredSchedule?: string;
    message?: string;
  };
}

const STORAGE_KEY = "bilc_local_user_data_v2";

const DEFAULT_STATE: LocalUserDataState = {
  version: 2,
  profile: {
    fullName: "",
    email: "",
    phone: "",
    preferredLanguage: "en",
    targetScore: "",
    studyGoal: "",
    notes: "",
    lastUpdated: new Date().toISOString(),
  },
  savedProgramIds: [],
  placementTests: [],
  consultationBookings: [],
  studyNotes: [],
  enquiryDraft: {},
};

export function getLocalUserData(): LocalUserDataState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch (err) {
    console.warn("Failed to load local user data, using defaults:", err);
    return DEFAULT_STATE;
  }
}

export function saveLocalUserData(data: Partial<LocalUserDataState>): LocalUserDataState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const current = getLocalUserData();
    const updated: LocalUserDataState = {
      ...current,
      ...data,
      profile: {
        ...current.profile,
        ...(data.profile || {}),
        lastUpdated: new Date().toISOString(),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("bilc_local_storage_updated", { detail: updated }));
    return updated;
  } catch (err) {
    console.error("Failed to save local user data:", err);
    return getLocalUserData();
  }
}

export function toggleSaveProgram(programId: string): boolean {
  const current = getLocalUserData();
  const exists = current.savedProgramIds.includes(programId);
  const updatedIds = exists
    ? current.savedProgramIds.filter((id) => id !== programId)
    : [...current.savedProgramIds, programId];
  saveLocalUserData({ savedProgramIds: updatedIds });
  return !exists;
}

export function addPlacementTestResult(result: Omit<LocalPlacementTest, "id" | "completedAt">): LocalPlacementTest {
  const current = getLocalUserData();
  const newEntry: LocalPlacementTest = {
    ...result,
    id: `pt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    completedAt: new Date().toISOString(),
  };
  saveLocalUserData({
    placementTests: [newEntry, ...current.placementTests],
  });
  return newEntry;
}

export function addConsultationBooking(booking: Omit<LocalConsultationBooking, "id" | "createdAt" | "status">): LocalConsultationBooking {
  const current = getLocalUserData();
  const newEntry: LocalConsultationBooking = {
    ...booking,
    id: `book_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    createdAt: new Date().toISOString(),
    status: "confirmed",
  };
  saveLocalUserData({
    consultationBookings: [newEntry, ...current.consultationBookings],
  });
  return newEntry;
}

export function exportUserDataAsJSON(): void {
  const data = getLocalUserData();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bilc_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function importUserDataFromJSON(file: File): Promise<{ success: boolean; message: string }> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") {
      return { success: false, message: "Invalid JSON format" };
    }
    const merged: LocalUserDataState = {
      ...DEFAULT_STATE,
      ...parsed,
      version: 2,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent("bilc_local_storage_updated", { detail: merged }));
    return { success: true, message: "User data imported successfully!" };
  } catch (err: any) {
    return { success: false, message: err?.message || "Failed to read backup file" };
  }
}

export function clearAllLocalUserData(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("bilc_local_storage_updated", { detail: DEFAULT_STATE }));
}

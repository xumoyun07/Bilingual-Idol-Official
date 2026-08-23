import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db.ts";
import { users } from "../drizzle/schema.ts";
import * as students from "../server/students.ts";

const qaSuffix = randomUUID().slice(0, 8);
const qaEmail = `student-profile-storage-qa-${qaSuffix}@bilingualidol.invalid`;
let studentId = null;

async function founderActorId() {
  const database = await getDb();
  if (!database) throw new Error("Database unavailable.");
  const founder = (await database.select({ id: users.id }).from(users).where(eq(users.role, "founder")).limit(1))[0];
  if (!founder) throw new Error("Founder actor is unavailable for QA.");
  return founder.id;
}

try {
  const actorId = await founderActorId();
  const created = await students.createStudentProfile({ name: "Student Profile Storage QA", email: qaEmail, isActive: true, guardianName: "QA Guardian", guardianPhone: "+60000000000", contactEmail: null, dateOfBirth: null, address: null, notes: "Temporary self-cleaning storage verification", attendedSessions: 4, totalSessions: 5, currentLevel: "A2", courseName: "QA English", courseCode: "QA-A2", courseStartDate: null, courseEndDate: null }, actorId);
  if (!created) throw new Error("Student profile creation returned no profile.");
  studentId = created.userId;
  const updated = await students.updateStudentProfile(studentId, { name: "Student Profile Storage QA", email: qaEmail, isActive: true, guardianName: "QA Guardian", guardianPhone: "+60000000000", contactEmail: null, dateOfBirth: null, address: null, notes: "Temporary self-cleaning storage verification", attendedSessions: 5, totalSessions: 6, currentLevel: "B1", courseName: "QA English", courseCode: "QA-B1", courseStartDate: null, courseEndDate: null }, actorId);
  if (updated?.currentLevel !== "B1") throw new Error("Student level update did not persist.");
  const fixtures = [
    { fileName: "student-profile-storage-qa.pdf", mimeType: "application/pdf", bytes: Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF", "utf8") },
    { fileName: "student-profile-storage-qa.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", bytes: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]) },
    { fileName: "student-profile-storage-qa.jpg", mimeType: "image/jpeg", bytes: Buffer.from([0xff, 0xd8, 0xff, 0xd9]) },
    { fileName: "student-profile-storage-qa.png", mimeType: "image/png", bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  ];
  const documents = [];
  for (const fixture of fixtures) documents.push(await students.uploadStudentDocument({ studentId, fileName: fixture.fileName, mimeType: fixture.mimeType, contentBase64: fixture.bytes.toString("base64") }, actorId));
  const detail = await students.getStudentProfile(studentId);
  if (!detail || detail.documents.length !== fixtures.length || !detail.documents.every(document => document.url.startsWith("/manus-storage/"))) throw new Error("Stored documents were not returned with application storage URLs.");
  const updateHistory = detail.history.find(entry => entry.eventType === "student.updated");
  if (!updateHistory || !JSON.parse(updateHistory.changesJson ?? "{}").changedFields.includes("currentLevel")) throw new Error("Privacy-minimised update history did not record changed field names.");
  for (const document of documents) await students.deleteStudentDocument(studentId, document.id, actorId);
  const afterDocumentRemoval = await students.getStudentProfile(studentId);
  if (!afterDocumentRemoval || afterDocumentRemoval.documents.length !== 0) throw new Error("Student document reference did not delete.");
  await students.deleteStudentProfile(studentId, actorId);
  studentId = null;
  console.log(JSON.stringify({ status: "passed", checks: ["create", "update", "history", "PDF/DOCX/JPG/PNG upload", "document removal", "student deletion"] }, null, 2));
} finally {
  if (studentId) await students.deleteStudentProfile(studentId, await founderActorId()).catch(() => undefined);
}

process.exit(0);

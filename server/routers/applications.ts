import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, desc, asc } from "drizzle-orm";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { applications, users, registrationSubmissions, auditLogs } from "../../drizzle/schema";
import * as audit from "../audit";

const STATUS_ORDER = [
  "submitted",
  "documentsReceived",
  "underReview",
  "offerIssued",
  "paymentCompleted",
  "visaProcess",
  "registrationCompleted",
];

export const applicationsRouter = router({
  // 1. applications.list (adminProcedure, query, lists applications with optional status filter)
  list: adminProcedure
    .input(z.object({
      status: z.enum(["submitted", "documentsReceived", "underReview", "offerIssued", "paymentCompleted", "visaProcess", "registrationCompleted"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const database = await db.getDb();
      if (database) {
        let query = database.select({
          id: applications.id,
          userId: applications.userId,
          status: applications.status,
          createdAt: applications.createdAt,
          updatedAt: applications.updatedAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(applications)
        .leftJoin(users, eq(applications.userId, users.id));

        if (input?.status) {
          const results = await query.where(eq(applications.status, input.status)).orderBy(desc(applications.createdAt));
          return results;
        } else {
          const results = await query.orderBy(desc(applications.createdAt));
          return results;
        }
      }

      // In-Memory Fallback
      let list = db.inMemoryStore.applications;
      if (input?.status) {
        list = list.filter(a => a.status === input.status);
      }
      return list.map(app => {
        const user = db.inMemoryStore.users.find(u => u.id === app.userId);
        return {
          ...app,
          userName: user?.name ?? null,
          userEmail: user?.email ?? null,
        };
      });
    }),

  // 2. applications.byId (query, returns application & transition history)
  byId: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const database = await db.getDb();
      let appRecord: any = null;

      if (database) {
        const [row] = await database.select({
          id: applications.id,
          userId: applications.userId,
          status: applications.status,
          createdAt: applications.createdAt,
          updatedAt: applications.updatedAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(applications)
        .leftJoin(users, eq(applications.userId, users.id))
        .where(eq(applications.id, input.id))
        .limit(1);
        appRecord = row;
      } else {
        const found = db.inMemoryStore.applications.find(a => a.id === input.id);
        if (found) {
          const user = db.inMemoryStore.users.find(u => u.id === found.userId);
          appRecord = {
            ...found,
            userName: user?.name ?? null,
            userEmail: user?.email ?? null,
          };
        }
      }

      if (!appRecord) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
      }

      // Authorization guard: Student/user can only view their own application
      const isStaff = ["admin", "super_admin", "founder"].includes(ctx.user.role);
      if (!isStaff && appRecord.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not authorised to view this application." });
      }

      // Fetch transition history from audit logs
      let history: any[] = [];
      if (database) {
        const logs = await database.select()
          .from(auditLogs)
          .where(and(
            eq(auditLogs.targetType, "application" as any),
            eq(auditLogs.targetId, String(appRecord.id))
          ))
          .orderBy(asc(auditLogs.createdAt));

        history = logs.map(log => {
          let metadata: any = {};
          try {
            metadata = log.metadataJson ? JSON.parse(log.metadataJson) : {};
          } catch (e) {}
          return {
            id: log.id,
            fromStatus: metadata.fromStatus ?? null,
            toStatus: metadata.toStatus ?? appRecord.status,
            actorName: log.actorRole === "founder" ? "Founder" : log.actorRole === "super_admin" ? "Super Admin" : "Admissions Team",
            createdAt: log.createdAt,
          };
        });
      } else {
        const logs = audit.inMemoryAuditLogs.filter(log => log.targetType === "application" && String(log.targetId) === String(appRecord.id));
        history = logs.map(log => {
          let metadata: any = {};
          try {
            metadata = log.metadataJson ? JSON.parse(log.metadataJson) : {};
          } catch (e) {}
          return {
            id: log.id,
            fromStatus: metadata.fromStatus ?? null,
            toStatus: metadata.toStatus ?? appRecord.status,
            actorName: log.actorRole === "founder" ? "Founder" : log.actorRole === "super_admin" ? "Super Admin" : "Admissions Team",
            createdAt: log.createdAt,
          };
        });
      }

      let isInternational = false;
      if (appRecord.userEmail) {
        if (database) {
          const [sub] = await database.select().from(registrationSubmissions).where(eq(registrationSubmissions.email, appRecord.userEmail)).limit(1);
          isInternational = sub?.applicantCategory === "international";
        } else {
          const sub = db.inMemoryStore.registrationSubmissions.find(s => s.email === appRecord.userEmail);
          isInternational = sub?.applicantCategory === "international";
        }
      }

      return {
        application: {
          ...appRecord,
          isInternational,
        },
        history,
      };
    }),

  // 3. applications.byUserId (query, returns active application & history for user)
  byUserId: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      // Authorization guard
      const isStaff = ["admin", "super_admin", "founder"].includes(ctx.user.role);
      if (!isStaff && input.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not authorised to view this application." });
      }

      const database = await db.getDb();
      let appRecord: any = null;

      if (database) {
        const [row] = await database.select({
          id: applications.id,
          userId: applications.userId,
          status: applications.status,
          createdAt: applications.createdAt,
          updatedAt: applications.updatedAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(applications)
        .leftJoin(users, eq(applications.userId, users.id))
        .where(eq(applications.userId, input.userId))
        .orderBy(desc(applications.createdAt))
        .limit(1);
        appRecord = row;
      } else {
        const found = db.inMemoryStore.applications.find(a => a.userId === input.userId);
        if (found) {
          const user = db.inMemoryStore.users.find(u => u.id === found.userId);
          appRecord = {
            ...found,
            userName: user?.name ?? null,
            userEmail: user?.email ?? null,
          };
        }
      }

      if (!appRecord) {
        return null;
      }

      // Fetch transition history from audit logs
      let history: any[] = [];
      if (database) {
        const logs = await database.select()
          .from(auditLogs)
          .where(and(
            eq(auditLogs.targetType, "application" as any),
            eq(auditLogs.targetId, String(appRecord.id))
          ))
          .orderBy(asc(auditLogs.createdAt));

        history = logs.map(log => {
          let metadata: any = {};
          try {
            metadata = log.metadataJson ? JSON.parse(log.metadataJson) : {};
          } catch (e) {}
          return {
            id: log.id,
            fromStatus: metadata.fromStatus ?? null,
            toStatus: metadata.toStatus ?? appRecord.status,
            actorName: log.actorRole === "founder" ? "Founder" : log.actorRole === "super_admin" ? "Super Admin" : "Admissions Team",
            createdAt: log.createdAt,
          };
        });
      } else {
        const logs = audit.inMemoryAuditLogs.filter(log => log.targetType === "application" && String(log.targetId) === String(appRecord.id));
        history = logs.map(log => {
          let metadata: any = {};
          try {
            metadata = log.metadataJson ? JSON.parse(log.metadataJson) : {};
          } catch (e) {}
          return {
            id: log.id,
            fromStatus: metadata.fromStatus ?? null,
            toStatus: metadata.toStatus ?? appRecord.status,
            actorName: log.actorRole === "founder" ? "Founder" : log.actorRole === "super_admin" ? "Super Admin" : "Admissions Team",
            createdAt: log.createdAt,
          };
        });
      }

      let isInternational = false;
      if (appRecord.userEmail) {
        if (database) {
          const [sub] = await database.select().from(registrationSubmissions).where(eq(registrationSubmissions.email, appRecord.userEmail)).limit(1);
          isInternational = sub?.applicantCategory === "international";
        } else {
          const sub = db.inMemoryStore.registrationSubmissions.find(s => s.email === appRecord.userEmail);
          isInternational = sub?.applicantCategory === "international";
        }
      }

      return {
        application: {
          ...appRecord,
          isInternational,
        },
        history,
      };
    }),

  // 4. applications.updateStatus (adminProcedure, mutation, sequential logic)
  updateStatus: adminProcedure
    .input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["submitted", "documentsReceived", "underReview", "offerIssued", "paymentCompleted", "visaProcess", "registrationCompleted"]),
      overrideSequence: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      let currentStatus: any = null;
      let userId: number = 0;
      let userEmail: string | null = null;

      if (database) {
        const [appRow] = await database.select().from(applications).where(eq(applications.id, input.id)).limit(1);
        if (appRow) {
          currentStatus = appRow.status;
          userId = appRow.userId;
          const [u] = await database.select().from(users).where(eq(users.id, userId)).limit(1);
          userEmail = u?.email ?? null;
        }
      } else {
        const found = db.inMemoryStore.applications.find(a => a.id === input.id);
        if (found) {
          currentStatus = found.status;
          userId = found.userId;
          const u = db.inMemoryStore.users.find(usr => usr.id === userId);
          userEmail = u?.email ?? null;
        }
      }

      if (!currentStatus) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Application not found" });
      }

      // Check if sequential validation is bypassed
      if (!input.overrideSequence) {
        // Enforce strict transitions
        //submitted → documentsReceived → underReview → offerIssued → paymentCompleted → visaProcess → registrationCompleted

        // Determine if they are an international student
        let isInternational = false;
        if (userEmail) {
          if (database) {
            const [sub] = await database.select().from(registrationSubmissions).where(eq(registrationSubmissions.email, userEmail)).limit(1);
            isInternational = sub?.applicantCategory === "international";
          } else {
            const sub = db.inMemoryStore.registrationSubmissions.find(s => s.email === userEmail);
            isInternational = sub?.applicantCategory === "international";
          }
        }

        const currentIndex = STATUS_ORDER.indexOf(currentStatus);
        const targetIndex = STATUS_ORDER.indexOf(input.status);

        if (currentIndex === -1 || targetIndex === -1) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid application status" });
        }

        let isSequenceValid = false;

        // Normal sequential transition: exactly 1 step ahead
        if (targetIndex === currentIndex + 1) {
          isSequenceValid = true;
        }
        // If not international, transition skips "visaProcess" going paymentCompleted -> registrationCompleted
        else if (currentStatus === "paymentCompleted" && input.status === "registrationCompleted" && !isInternational) {
          isSequenceValid = true;
        }

        if (!isSequenceValid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Out of sequence transition: cannot change status from "${currentStatus}" to "${input.status}" directly. Set overrideSequence to bypass validation.`,
          });
        }
      }

      // Apply the update
      await db.updateApplicationStatus(input.id, input.status);

      // Write transition event to audit logs
      try {
        await audit.writeAuditEvent({
          actor: { id: ctx.user.id, role: ctx.user.role },
          request: ctx.req,
          action: "user.update" as any,
          targetType: "application" as any,
          targetId: input.id,
          description: `Updated application status from "${currentStatus}" to "${input.status}".`,
          metadata: {
            fromStatus: currentStatus,
            toStatus: input.status,
            overrideSequence: input.overrideSequence,
            applicationId: input.id,
          },
        });
      } catch (err) {
        console.error("Failed to write audit event for application status update:", err);
      }

      return { success: true };
    }),
});

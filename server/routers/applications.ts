/**
 * Application Pipeline (A2/S3): очередь и обработка заявок Ф2, трекер для студента.
 *
 * Доступ:
 *   queue / assign / approve / reject / advanceStatus — adminProcedure
 *     (admin, super_admin, founder — зона admin по документам);
 *   overrideStatus — та же процедура с внутренней founder-проверкой (откат только founder);
 *   myStatus — studentProcedure, только своя заявка, без параметров.
 *
 * Каждая мутация пишет аудит; rejected не создаёт аккаунт; visaProcess — только
 * для internationalStudent.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as audit from "../audit";
import { adminProcedure, router, studentProcedure } from "../_core/trpc";
import * as pipeline from "../services/applicationPipeline";
import { PipelineError } from "../services/applicationPipeline";

const submissionIdInput = z.object({ submissionId: z.number().int().positive() });

function pipelineError(error: unknown): never {
  if (error instanceof PipelineError) {
    throw new TRPCError({ code: error.code, message: error.message });
  }
  throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "The application action could not be completed." });
}

type AuditContext = { user: { id: number; role: string }; req: unknown };

async function record(ctx: AuditContext, event: {
  action: "application.assign" | "application.approve" | "application.reject" | "application.advance" | "application.override";
  submissionId?: number;
  applicationId?: number;
  description: string;
  metadata: Record<string, unknown>;
}) {
  try {
    await audit.writeAuditEvent({
      actor: { id: ctx.user.id, role: ctx.user.role as never },
      request: ctx.req as never,
      action: event.action,
      targetType: "user",
      targetId: String(event.applicationId ?? event.submissionId ?? 0),
      targetRole: "student",
      description: event.description,
      metadata: event.metadata,
    });
  } catch {
    audit.reportAuditFailure("applications");
  }
}

export const applicationsRouter = router({
  /** Очередь заявок Ф2 со статусом new/routed, с фильтрами по категории и программе. */
  queue: adminProcedure
    .input(z.object({
      status: z.enum(["new", "routed"]).optional().default("new"),
      applicantCategory: z.string().trim().max(80).optional(),
      programInterest: z.string().trim().max(180).optional(),
    }))
    .query(({ input }) => pipeline.queueSubmissions(input)),

  /** Назначить заявку себе или другому сотруднику; new переходит в routed. */
  assign: adminProcedure
    .input(submissionIdInput.extend({ assigneeUserId: z.number().int().positive().optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await pipeline.assignSubmission(input, ctx.user);
        await record(ctx as AuditContext, {
          action: "application.assign",
          submissionId: input.submissionId,
          description: "Assigned a registration request to a staff member.",
          metadata: { assigneeUserId: result.assignedToUserId },
        });
        return result;
      } catch (error) {
        return pipelineError(error);
      }
    }),

  /** Одобрить: создать student-аккаунт, личное дело и applications(status=submitted). */
  approve: adminProcedure
    .input(submissionIdInput)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await pipeline.approveSubmission(input, ctx.user);
        await record(ctx as AuditContext, {
          action: "application.approve",
          submissionId: input.submissionId,
          description: "Approved a registration request and created the student account.",
          metadata: { userId: result.userId, applicationId: result.applicationId },
        });
        return result;
      } catch (error) {
        return pipelineError(error);
      }
    }),

  /** Отклонить: обязательная причина; аккаунт не создаётся. */
  reject: adminProcedure
    .input(submissionIdInput.extend({ reason: z.string().trim().min(3).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await pipeline.rejectSubmission(input, ctx.user);
        await record(ctx as AuditContext, {
          action: "application.reject",
          submissionId: input.submissionId,
          description: "Rejected a registration request.",
          metadata: { reason: input.reason },
        });
        return result;
      } catch (error) {
        return pipelineError(error);
      }
    }),

  /** Следующая стадия цепочки (только вперёд; visaProcess только для международных). */
  advanceStatus: adminProcedure
    .input(z.object({ applicationId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await pipeline.advanceApplication(input, ctx.user);
        await record(ctx as AuditContext, {
          action: "application.advance",
          applicationId: input.applicationId,
          description: "Advanced the application to the next stage.",
          metadata: { newStatus: result.status },
        });
        return result;
      } catch (error) {
        return pipelineError(error);
      }
    }),

  /** Founder-оверсайд: любая стадия, включая откат. Для остальных — FORBIDDEN. */
  overrideStatus: adminProcedure
    .input(z.object({ applicationId: z.number().int().positive(), status: z.string().trim().max(40) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await pipeline.overrideApplication(input, ctx.user);
        await record(ctx as AuditContext, {
          action: "application.override",
          applicationId: input.applicationId,
          description: "Founder override of the application stage.",
          metadata: { newStatus: result.status },
        });
        return result;
      } catch (error) {
        return pipelineError(error);
      }
    }),

  /**
   * Свой трекер. Параметров нет — только ctx.user.id, поэтому чужую заявку
   * прочитать невозможно. Стадия visaProcess скрыта для не-международных.
   */
  myStatus: studentProcedure.query(async ({ ctx }) => pipeline.myApplicationStatus(ctx.user.id)),
});

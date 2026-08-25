import { TRPCError } from "@trpc/server";
import { router, studentProcedure } from "../_core/trpc";
import { getStudentAttendanceSummary } from "../studentAttendance";

export const studentAttendanceRouter = router({
  summary: studentProcedure.query(async ({ ctx }) => {
    try {
      return await getStudentAttendanceSummary(ctx.user.id);
    } catch (error) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Attendance summary could not be loaded." });
    }
  }),
});

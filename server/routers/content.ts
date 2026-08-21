import { z } from "zod";
import * as db from "../db";
import { publicProcedure, router } from "../_core/trpc";

/** Public site data only. Founder management is intentionally restricted to Users. */
export const contentRouter = router({
  publicAnnouncements: publicProcedure.query(() => db.listPublicAnnouncements()),
  publicPrograms: publicProcedure.query(() => db.listPublicPrograms()),
  publicProgram: publicProcedure.input(z.object({ slug: z.string().min(1) })).query(({ input }) => db.getPublicProgram(input.slug)),
  publicTestimonials: publicProcedure.query(() => db.listPublicTestimonials()),
  publicTeamProfiles: publicProcedure.query(() => db.listPublicTeamProfiles()),
  siteSettings: publicProcedure.query(() => db.listSiteSettings()),
});

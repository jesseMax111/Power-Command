import { pgTable, text, integer, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const verificationsTable = pgTable("verifications", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull(),
  userId: text("user_id").notNull(),
  vote: text("vote").notNull(), // confirm | dispute
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVerificationSchema = createInsertSchema(verificationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertVerification = z.infer<typeof insertVerificationSchema>;
export type Verification = typeof verificationsTable.$inferSelect;

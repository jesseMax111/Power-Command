import { pgTable, text, integer, serial, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  userName: text("user_name"),
  type: text("type").notNull(), // outage | restoration | transformer
  status: text("status").notNull().default("active"), // active | resolved
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  address: text("address"),
  description: text("description"),
  faultType: text("fault_type"), // for transformer reports
  confirmations: integer("confirmations").notNull().default(0),
  disputes: integer("disputes").notNull().default(0),
  confidence: integer("confidence").notNull().default(0),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({
  id: true,
  confirmations: true,
  disputes: true,
  confidence: true,
  verified: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;

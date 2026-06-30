import { pgTable, text, integer, serial, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savedLocationsTable = pgTable("saved_locations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSavedLocationSchema = createInsertSchema(savedLocationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSavedLocation = z.infer<typeof insertSavedLocationSchema>;
export type SavedLocation = typeof savedLocationsTable.$inferSelect;

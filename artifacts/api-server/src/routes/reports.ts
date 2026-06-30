import { Router } from "express";
import { db, reportsTable, verificationsTable, notificationsTable, savedLocationsTable, pushTokensTable } from "@workspace/db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

async function sendExpoPushNotifications(
  notifs: Array<{ userId: string; title: string; body: string }>,
  senderUserId: string,
): Promise<void> {
  const userIds = [...new Set(notifs.map((n) => n.userId))];
  if (userIds.length === 0) return;

  const tokens = await db
    .select()
    .from(pushTokensTable)
    .where(inArray(pushTokensTable.userId, userIds));

  if (tokens.length === 0) return;

  const messages = tokens.map((t) => {
    const notif = notifs.find((n) => n.userId === t.userId);
    return {
      to: t.token,
      title: notif?.title ?? "PowerPulse",
      body: notif?.body ?? "",
      sound: "default",
    };
  });

  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, "Expo push API returned non-OK");
    }
  } catch (err) {
    logger.error({ err }, "Failed to send Expo push notifications");
  }
}

const router = Router();

// GET /reports
router.get("/reports", async (req, res): Promise<void> => {
  try {
    const { lat, lng, radius, type, status, limit = "50" } = req.query as Record<string, string>;
    const conditions: any[] = [];
    if (type) conditions.push(eq(reportsTable.type, type));
    if (status) conditions.push(eq(reportsTable.status, status));

    let reports = await db
      .select()
      .from(reportsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reportsTable.createdAt))
      .limit(Math.min(parseInt(limit) || 50, 200));

    // Filter by radius if lat/lng provided
    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const radiusKm = parseFloat(radius || "50");
      reports = reports.filter((r) => {
        const dLat = (r.latitude - latNum) * (Math.PI / 180);
        const dLng = (r.longitude - lngNum) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(latNum * (Math.PI / 180)) * Math.cos(r.latitude * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
        const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return dist <= radiusKm;
      });
    }

    res.json(reports);
  } catch (err) {
    req.log.error({ err }, "Failed to list reports");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /reports
router.post("/reports", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const { type, latitude, longitude, address, description, faultType, userName } = req.body;
  if (!type || latitude == null || longitude == null) {
    res.status(400).json({ error: "type, latitude, longitude are required" });
    return;
  }
  try {
    // If this is a restoration report, close active outage reports nearby
    if (type === "restoration") {
      const nearby = await db.select().from(reportsTable)
        .where(and(eq(reportsTable.type, "outage"), eq(reportsTable.status, "active")));
      for (const r of nearby) {
        const dLat = (r.latitude - latitude) * (Math.PI / 180);
        const dLng = (r.longitude - longitude) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(latitude * (Math.PI / 180)) * Math.cos(r.latitude * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
        const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (dist <= 1) {
          await db.update(reportsTable).set({ status: "resolved", resolvedAt: new Date() }).where(eq(reportsTable.id, r.id));
        }
      }
    }

    const [report] = await db.insert(reportsTable).values({
      userId,
      userName: userName || null,
      type,
      latitude,
      longitude,
      address: address || null,
      description: description || null,
      faultType: faultType || null,
      status: "active",
    }).returning();

    // Notify users with saved locations nearby
    const savedLocs = await db.select().from(savedLocationsTable);
    const notifs: any[] = [];
    for (const loc of savedLocs) {
      if (loc.userId === userId) continue;
      const dLat = (loc.latitude - latitude) * (Math.PI / 180);
      const dLng = (loc.longitude - longitude) * (Math.PI / 180);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(latitude * (Math.PI / 180)) * Math.cos(loc.latitude * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
      const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (dist <= 5) {
        const titles: Record<string, string> = { outage: "Power Outage Reported", restoration: "Power Restored", transformer: "Transformer Fault" };
        notifs.push({ userId: loc.userId, title: titles[type] || "New Report", body: `New ${type} report near ${loc.name}` });
      }
    }
    if (notifs.length > 0) {
      await db.insert(notificationsTable).values(notifs);
      // Send Expo push notifications for each affected user
      sendExpoPushNotifications(notifs, userId).catch(() => {});
    }

    res.status(201).json(report);
  } catch (err) {
    req.log.error({ err }, "Failed to create report");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /reports/:id
router.get("/reports/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  try {
    const [report] = await db.select().from(reportsTable).where(eq(reportsTable.id, id));
    if (!report) { res.status(404).json({ error: "Not found" }); return; }
    res.json(report);
  } catch (err) {
    req.log.error({ err }, "Failed to get report");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /reports/:id
router.patch("/reports/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const { status, description, resolvedAt } = req.body;
  try {
    const updates: any = {};
    if (status) updates.status = status;
    if (description !== undefined) updates.description = description;
    if (resolvedAt) updates.resolvedAt = new Date(resolvedAt);
    if (status === "resolved" && !updates.resolvedAt) updates.resolvedAt = new Date();
    const [report] = await db.update(reportsTable).set(updates).where(eq(reportsTable.id, id)).returning();
    if (!report) { res.status(404).json({ error: "Not found" }); return; }
    res.json(report);
  } catch (err) {
    req.log.error({ err }, "Failed to update report");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /reports/:id
router.delete("/reports/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  try {
    await db.delete(reportsTable).where(eq(reportsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete report");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /reports/:id/verify
router.post("/reports/:id/verify", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const reportId = parseInt(req.params.id);
  const { vote } = req.body;
  if (!vote || !["confirm", "dispute"].includes(vote)) {
    res.status(400).json({ error: "vote must be confirm or dispute" });
    return;
  }
  try {
    // Upsert verification
    const existing = await db.select().from(verificationsTable)
      .where(and(eq(verificationsTable.reportId, reportId), eq(verificationsTable.userId, userId)));
    if (existing.length > 0) {
      await db.update(verificationsTable).set({ vote }).where(eq(verificationsTable.id, existing[0].id));
    } else {
      await db.insert(verificationsTable).values({ reportId, userId, vote });
    }

    // Recount
    const allVotes = await db.select().from(verificationsTable).where(eq(verificationsTable.reportId, reportId));
    const confirmations = allVotes.filter(v => v.vote === "confirm").length;
    const disputes = allVotes.filter(v => v.vote === "dispute").length;
    const total = allVotes.length;
    const confidence = total > 0 ? Math.round((confirmations / total) * 100) : 0;
    const verified = confirmations >= 3 && confidence >= 70;

    const [report] = await db.update(reportsTable)
      .set({ confirmations, disputes, confidence, verified })
      .where(eq(reportsTable.id, reportId))
      .returning();

    if (!report) { res.status(404).json({ error: "Not found" }); return; }
    res.json(report);
  } catch (err) {
    req.log.error({ err }, "Failed to verify report");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

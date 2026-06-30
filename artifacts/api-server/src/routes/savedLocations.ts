import { Router } from "express";
import { db, savedLocationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/saved-locations", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  try {
    const locs = await db.select().from(savedLocationsTable).where(eq(savedLocationsTable.userId, userId));
    res.json(locs);
  } catch (err) {
    req.log.error({ err }, "Failed to list saved locations");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/saved-locations", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const { name, latitude, longitude, address } = req.body;
  if (!name || latitude == null || longitude == null) {
    res.status(400).json({ error: "name, latitude, longitude are required" });
    return;
  }
  try {
    const [loc] = await db.insert(savedLocationsTable).values({
      userId, name, latitude, longitude, address: address || null,
    }).returning();
    res.status(201).json(loc);
  } catch (err) {
    req.log.error({ err }, "Failed to create saved location");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/saved-locations/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const id = parseInt(req.params.id);
  try {
    await db.delete(savedLocationsTable).where(and(eq(savedLocationsTable.id, id), eq(savedLocationsTable.userId, userId)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete saved location");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

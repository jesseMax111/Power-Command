import { Router } from "express";
import { db, pushTokensTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.post("/push-tokens", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const { token, platform } = req.body;
  if (!token || typeof token !== "string") {
    res.status(400).json({ error: "token is required" });
    return;
  }
  try {
    // Upsert: if this token already exists for this user, update; otherwise insert
    const [existing] = await db
      .select()
      .from(pushTokensTable)
      .where(eq(pushTokensTable.token, token));

    if (existing) {
      if (existing.userId !== userId) {
        // Token was registered to a different user, update ownership
        await db
          .update(pushTokensTable)
          .set({ userId, platform: platform || existing.platform })
          .where(eq(pushTokensTable.id, existing.id));
      }
    } else {
      await db.insert(pushTokensTable).values({
        userId,
        token,
        platform: platform || null,
      });
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to register push token");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

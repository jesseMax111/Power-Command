import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { getAuth, clerkClient } from "@clerk/express";

const router = Router();

// GET /me
router.get("/me", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  try {
    // Try to get from DB first
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (user) {
      res.json(user);
      return;
    }
    // Fetch from Clerk and create user
    const clerkUser = await clerkClient(req).users.getUser(userId);
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.emailAddresses[0]?.emailAddress || "User";
    const email = clerkUser.emailAddresses[0]?.emailAddress || "";
    const [created] = await db.insert(usersTable).values({
      id: userId,
      name,
      email,
      photo: clerkUser.imageUrl || null,
    }).returning();
    res.json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to get user");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /me
router.put("/me", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const { name, phone, photo } = req.body;
  try {
    const [updated] = await db
      .update(usersTable)
      .set({ ...(name && { name }), ...(phone !== undefined && { phone }), ...(photo !== undefined && { photo }) })
      .where(eq(usersTable.id, userId))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update user");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

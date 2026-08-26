import { auth } from "../lib/auth.js";
import { db } from "../db/index.js";
import { creatorProfiles } from "../db/schema.js";
import { eq } from "drizzle-orm";

export async function requireAuth(req: any, res: any, next: any) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  req.user = session.user;
  next();
}

export async function requireCreator(req: any, res: any, next: any) {
  try {
    const [profile] = await db
      .select()
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, req.user.id))
      .limit(1);

    if (!profile) {
      return res.status(403).json({ error: "Creator access required" });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
}
export async function requireTargetIsCreator(req: any, res: any, next: any) {
  try{
  const [targetCreatorProfile] = await db
  .select()
  .from(creatorProfiles)
  .where(eq(creatorProfiles.userId, req.body.creatorId))
  .limit(1);

if (!targetCreatorProfile) {
  return res.status(403).json({ error: "You can only follow creators" });
}
    next();
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
}

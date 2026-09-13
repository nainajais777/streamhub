import {Router} from "express";
import {db} from "../db/index.js";
import {liveStreams} from "../db/schema.js";
import {requireAuth,requireCreator} from "../middleware/auth.js";
export const liveStreamsRouter = Router();
liveStreamsRouter.post("/", requireAuth, requireCreator, async (req: any, res) => {
 if(!req.body.title)
 {
    return res.status(400).json({error : "Title is required"});
 }
    try {
    const [newStream] = await db
      .insert(liveStreams)
      .values({ creatorId: req.user.id, title: req.body.title })
      .returning();
    res.status(201).json(newStream);
  } catch (err: any) {
    if(err.code ==="23505" || err.cause?.code === "23505")
    {
        return res.status(409).json({error :"You are already live streaming"});
    }
res.status(500).json({error : "Something went wrong"});  
  }
});
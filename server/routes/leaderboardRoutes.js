import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// Get Top Users by Reputation Score
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;

    const topUsers = await prisma.user.findMany({
      take: limit,
      orderBy: {
        reputationScore: "desc",
      },
      select: {
        id: true,
        name: true,
        fullName: true,
        role: true,
        reputationScore: true,
      },
    });

    res.status(200).json({ success: true, data: topUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

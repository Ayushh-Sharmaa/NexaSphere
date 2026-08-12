import express from "express";
import crypto from "crypto";
import { requireStudentAuth } from "../middleware/studentAuthMiddleware.js";

const router = express.Router();

router.use(requireStudentAuth);

/**
 * Endpoint to generate adaptive nodes based on resume gaps,
 * current roadmap velocity, and existing nodes.
 */
router.post("/mutate", (req, res) => {
  try {
    const {
      currentNodes = [],
      completedNodeIds = [],
      missingSkills = [],
      weakTechnologies = [],
    } = req.body;

    const newNodes = [];

    // Analyze velocity/stalls based on simple heuristics for now
    // In a real system, this could call an LLM provider.
    const inProgressNodes = currentNodes.filter(
      (n) => n.status === "In Progress"
    );
    const stuckNodes = currentNodes.filter((n) => n.status === "Stuck");

    let xCursor = 200;
    let yCursor = 500;
    const incrementCursors = () => {
      xCursor += 250;
      if (xCursor > 1200) {
        xCursor = 200;
        yCursor += 150;
      }
    };

    // 1. Inject missing skills from resume as Prerequisite Nodes
    for (const skill of missingSkills) {
      if (
        !currentNodes.some((n) =>
          n.title.toLowerCase().includes(skill.toLowerCase())
        )
      ) {
        newNodes.push({
          id: crypto.randomUUID(),
          title: `Intro to ${skill}`,
          description: `Foundational module to bridge resume gaps.`,
          x: xCursor,
          y: yCursor,
          status: "Not Started",
          notes: "AI Recommended.",
          resources: [{ title: `${skill} Official Docs`, url: "#" }],
          prerequisites: [],
          isAiGenerated: true,
          isPrerequisite: true,
          aiReason: `Resume analysis showed a gap in ${skill}.`,
        });
        incrementCursors();
      }
    }

    // 2. Inject foundational nodes if stuck
    for (const stuckNode of stuckNodes) {
      newNodes.push({
        id: crypto.randomUUID(),
        title: `Fundamentals of ${stuckNode.title}`,
        description: `Review core concepts before tackling ${stuckNode.title}.`,
        x: xCursor,
        y: yCursor,
        status: "Not Started",
        notes: "Review required.",
        resources: [],
        prerequisites: [],
        isAiGenerated: true,
        isPrerequisite: true,
        aiReason: `Recommended because you've stalled on ${stuckNode.title}.`,
      });
      incrementCursors();
    }

    // 3. Inject advanced nodes if velocity is high (many completed, few stuck)
    if (completedNodeIds.length > 3 && stuckNodes.length === 0) {
      newNodes.push({
        id: crypto.randomUUID(),
        title: `Advanced Architecture & Scaling`,
        description: `You're progressing fast! Ready for system design?`,
        x: xCursor,
        y: yCursor,
        status: "Not Started",
        notes: "Advanced concepts.",
        resources: [],
        prerequisites: completedNodeIds.slice(-2), // Link to recent completions
        isAiGenerated: true,
        isAdvanced: true,
        aiReason: `High completion velocity detected. Pushing advanced topics.`,
      });
      incrementCursors();
    }

    res.json({ suggestedNodes: newNodes });
  } catch (err) {
    console.error("Adaptive Engine Error:", err);
    res.status(500).json({ error: "Failed to generate adaptive roadmap." });
  }
});

export default router;

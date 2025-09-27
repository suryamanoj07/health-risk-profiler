import express from "express";
import { parseInput, extractFactors, classifyRisk, getRecommendations } from "../controllers/healthController.js";

const router = express.Router();

router.post("/parse", parseInput);
router.post("/factors", extractFactors);
router.post("/risk", classifyRisk);
router.post("/recommendations", getRecommendations);

export default router;

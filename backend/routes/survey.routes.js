import express from "express";
import { parseSurvey, processOCR, upload, saveProfile, getProfiles, getProfile } from "../controllers/survey.controller.js";

const router = express.Router();

// Text-based survey parsing
router.post("/parse", parseSurvey);

// OCR-based survey processing
router.post("/ocr", upload.single('image'), processOCR);

// Profile management
router.post("/profiles", saveProfile);
router.get("/profiles", getProfiles);
router.get("/profiles/:id", getProfile);

export default router;

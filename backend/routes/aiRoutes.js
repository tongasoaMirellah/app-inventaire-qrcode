// backend/routes/aiRoutes.js
import express from "express";
import { aiHandler } from "../controllers/aiController.js";

const router = express.Router();

router.post("/", aiHandler);

export default router;

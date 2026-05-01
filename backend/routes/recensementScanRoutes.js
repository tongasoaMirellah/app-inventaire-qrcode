import express from "express";
import * as RecensementScanController from "../controllers/RecensementScanController.js";
import { verifyToken, permit } from "../middleware/authMiddleware.js";

const router = express.Router();

// Scan QR → récupérer automatiquement le bien
router.post(
  "/scan",
  verifyToken,
  permit("agent", "depositaire", "admin"),
  RecensementScanController.scanQRCode
);

export default router;

import express from "express";
import { getAllAudits } from "../controllers/auditController.js";

const router = express.Router();

router.get("/", getAllAudits);

export default router;

// routes/etatAppreciatifRoutes.js
import express from 'express';
import { generateEtatAppreciatifPdfByPeriod } from '../controllers/EtatAppreciatifController.js';

const router = express.Router();

// ✅ Route POST pour la génération PDF par période
router.post('/pdf-by-period', generateEtatAppreciatifPdfByPeriod);

export default router;
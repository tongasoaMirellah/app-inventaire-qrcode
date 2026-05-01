// backend/routes/inventaireRoutes.js
import express from 'express';
import { genererInventaire, getHistorique, downloadPDF } from '../controllers/InventaireController.js';

const router = express.Router();

router.post('/generer', genererInventaire);
router.get('/historique', getHistorique);
router.get('/telecharger/:id', downloadPDF);

export default router;

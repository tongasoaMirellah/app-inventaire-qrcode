import express from 'express';
import * as RecensementController from '../controllers/RecensementController.js';
import { verifyToken, permit } from '../middleware/authMiddleware.js';

const router = express.Router();

// Créer PV (agent)
router.post('/', verifyToken, permit('agent'), RecensementController.createRecensement);

// Lister tous PV (admin, chef, depositaire)
router.get('/', verifyToken, permit('admin', 'chef', 'depositaire'), RecensementController.getAllRecensements);

// Télécharger PDF
router.get('/:id/pdf', verifyToken, permit('admin', 'chef', 'depositaire', 'agent'), RecensementController.downloadRecensementPDF);
router.get('/:id', verifyToken, permit('admin', 'chef', 'depositaire', 'agent'), RecensementController.downloadRecensementPDF);

// Transmettre PV (agent)
router.post('/:id/transmettre', verifyToken, permit('agent'), RecensementController.transmettreRecensement);

// ✅ Valider PV (depositaire uniquement)
router.post('/:id/valider', verifyToken, permit('depositaire'), RecensementController.validerRecensement);

export default router;


/*import express from 'express';
import * as RecensementController from '../controllers/RecensementController.js';
import { verifyToken, permit } from '../middleware/authMiddleware.js';

const router = express.Router();

// ➕ Créer un PV (autorisé pour agent, depositaire, admin)
router.post('/', verifyToken, permit('agent'/*, 'depositaire', 'admin'*), RecensementController.createRecensement);

// 📄 Lister tous les PV (admin, chef, depositaire)
router.get('/', verifyToken, permit('admin', 'chef', 'depositaire'), RecensementController.getAllRecensements);

// ⬇️ Télécharger le PDF d’un PV
router.get('/:id/pdf', verifyToken, permit('admin', 'chef', 'depositaire', 'agent'), RecensementController.downloadRecensementPDF);

export default router;
*/
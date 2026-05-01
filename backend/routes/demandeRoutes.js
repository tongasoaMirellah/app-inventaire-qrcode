import express from 'express';
import { creerDemande, validerDemande, refuserDemande, getDemandesEnAttente,  getDemandesPourDepositaire} from '../controllers/DemandeController.js';
import { verifyToken} from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, creerDemande);
router.get('/en-attente', verifyToken, getDemandesEnAttente);
router.post('/:demandeId/valider', verifyToken, validerDemande);
router.post('/:demandeId/refuser', verifyToken, refuserDemande);
router.get('/recues', verifyToken, getDemandesPourDepositaire);

export default router;

/*import express from 'express';
import { 
  getAffectations,
  getAffectationById,
  createAffectation,
  updateAffectation,
  deleteAffectation,
  getBiensEnMaintenance,
  remettreBienEnService,
  getBiensToRecensement,
  getBiensDecision,
  setDecisionBien
} from '../controllers/affectationController.js';
import { verifyToken, permit } from '../middleware/authMiddleware.js';

const router = express.Router();

// 🔹 Affectations
router.get('/', verifyToken, permit('admin','depositaire'), getAffectations);
router.get('/:id', verifyToken, permit('admin','depositaire','chef','agent'), getAffectationById);
router.post('/', verifyToken, permit('admin','depositaire'), createAffectation);
router.put('/:id', verifyToken, permit('admin','depositaire'), updateAffectation);
router.delete('/:id', verifyToken, permit('admin','depositaire'), deleteAffectation);

// 🔹 Maintenance et Recensement
router.get('/maintenance', verifyToken, permit('depositaire'), getBiensEnMaintenance);
router.put('/:affectationId/remettre-service', verifyToken, permit('depositaire'), remettreBienEnService);
router.get('/a-recenser', verifyToken, permit('admin','depositaire','agent'), getBiensToRecensement);
router.get('/decision', verifyToken, permit('depositaire'), getBiensDecision);
router.put('/:affectationId/decision', verifyToken, permit('depositaire'), setDecisionBien);

export default router;
*/
import express from 'express';
import { 
  getAffectations,
  getAffectationById,
  createAffectation,
  updateAffectation,
  deleteAffectation,
  getAffectationDetail,
  getBiensEnMaintenance,
  remettreBienEnService,
  getBiensToRecensement,
  getBiensDecision,
  setDecisionBien
} from '../controllers/affectationController.js';
import { verifyToken, permit } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, permit('admin','depositaire'), getAffectations);
router.post('/', verifyToken, permit('admin','depositaire'), createAffectation);
router.get('/maintenance', verifyToken, permit('depositaire'), getBiensEnMaintenance);
router.get('/a-recenser', verifyToken, permit('admin','depositaire','agent'), getBiensToRecensement);
router.get('/decision', verifyToken, permit('depositaire'), getBiensDecision);
router.put('/:affectationId/remettre-service', verifyToken, permit('depositaire'), remettreBienEnService);
router.put('/:affectationId/decision', verifyToken, permit('depositaire'), setDecisionBien);
router.get('/:id', verifyToken, permit('admin','depositaire','chef','agent'), getAffectationById);
router.put('/:id', verifyToken, permit('admin','depositaire'), updateAffectation);
router.delete('/:id', verifyToken, permit('admin','depositaire'), deleteAffectation);
router.get('/:id/detail', verifyToken, permit('admin','depositaire','chef','agent'), getAffectationDetail);

export default router;

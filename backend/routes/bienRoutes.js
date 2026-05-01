/*import express from 'express';
import { 
  createBien,
  getAllBiens,
  getBienById,
  updateBien,
  deleteBien,
  getBiensToRecensement,
  getBiensDecision,
  setDecisionBien,
  generateQrCode,
  findBienByIdentifier,
  remettreBienEnService,
  getBiensEnMaintenance
} from '../controllers/BienController.js';
import { verifyToken, permit } from '../middleware/authMiddleware.js';

const router = express.Router();

// -------------------------------------------------------------
// 🔹 Routes spécifiques AVANT les routes paramétrées
// -------------------------------------------------------------

// Recensement
router.get(
  '/a-recenser',
  verifyToken,
  permit('admin', 'depositaire', 'agent'),
  getBiensToRecensement
);

// Décision post-recensement
router.get(
  '/decision',
  verifyToken,
  permit('depositaire'),
  getBiensDecision
);

router.post(
  '/:id/decision',
  verifyToken,
  permit('depositaire'),
  setDecisionBien
);
router.post(
  '/:id/remettre-service',
  verifyToken,
  permit('depositaire'),
  remettreBienEnService
);

router.get(
  '/maintenance',
  verifyToken,
  permit('depositaire'),
  getBiensEnMaintenance
);

// Scan / QR Code
router.get(
  '/find-by-identifier/:identifier',
  verifyToken,
  permit('admin', 'depositaire', 'agent'),
  findBienByIdentifier
);

router.get(
  '/qrcode/:code',
  verifyToken,
  permit('admin', 'depositaire'),
  generateQrCode
);

// -------------------------------------------------------------
// 🔹 CRUD BIENS (TOUJOURS À LA FIN)
// -------------------------------------------------------------

router.post('/', verifyToken, permit('admin','depositaire'), createBien);
router.get('/', verifyToken, permit('admin','chef','depositaire','agent'), getAllBiens);

router.get('/:id', verifyToken, permit('admin','chef','depositaire','agent'), getBienById);
router.put('/:id', verifyToken, permit('admin','depositaire'), updateBien);
router.delete('/:id', verifyToken, permit('admin','depositaire'), deleteBien);

export default router;
*/
import express from 'express';
import { 
  createBien,
  getAllBiens,
  getBienById,
  updateBien,
  deleteBien,
  //getBiensToRecensement,
  //getBiensDecision,
  //setDecisionBien,
  generateQrCode,
  findBienByIdentifier,
  //remettreBienEnService,
  //getBiensEnMaintenance
} from '../controllers/BienController.js';
import { verifyToken, permit } from '../middleware/authMiddleware.js';

const router = express.Router();

// 🔹 Routes spécifiques AVANT les routes paramétrées

//router.get('/a-recenser', verifyToken, permit('admin','depositaire','agent'), getBiensToRecensement);
//router.get('/decision', verifyToken, permit('depositaire'), getBiensDecision);
//router.post('/:id/decision', verifyToken, permit('depositaire'), setDecisionBien);
//router.post('/:id/remettre-service', verifyToken, permit('depositaire'), remettreBienEnService);
//router.get('/maintenance', verifyToken, permit('depositaire'), getBiensEnMaintenance);

router.get('/find-by-identifier/:identifier', verifyToken, permit('admin','depositaire','agent'), findBienByIdentifier);
router.get('/qrcode/:code', verifyToken, permit('admin','depositaire'), generateQrCode);

// 🔹 CRUD Biens (toujours à la fin)
router.post('/', verifyToken, permit('admin','depositaire'), createBien);
router.get('/', verifyToken, permit('admin','chef','depositaire','agent'), getAllBiens);
router.get('/:id', verifyToken, permit('admin','chef','depositaire','agent'), getBienById);
router.put('/:id', verifyToken, permit('admin','depositaire'), updateBien);
router.delete('/:id', verifyToken, permit('admin','depositaire'), deleteBien);

export default router;

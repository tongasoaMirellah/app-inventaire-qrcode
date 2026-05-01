import express from 'express';
import { verifyToken, permit } from '../middleware/authMiddleware.js';
import {
  getChefDashboard,
  getBiensChef,
  getDemandesChef
} from '../controllers/chefController.js';

const router = express.Router();

router.use(verifyToken);
router.use(permit('chef_departement'));

router.get('/dashboard', getChefDashboard);
router.get('/biens', getBiensChef);
router.get('/demandes', getDemandesChef);

export default router;

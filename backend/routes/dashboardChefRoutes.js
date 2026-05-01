
import express from 'express';

import { getChefDashboardData } from '../controllers/dashboardChefController.js';
import { getBiensAffectesByDepartement } from '../controllers/dashboardChefController.js'; // <-- Import mis à jour

import { verifyToken , permit} from '../middleware/authMiddleware.js'; 

//import { permit } from '../middleware/permit.js'; 



const router = express.Router();



router.get(  '/', verifyToken, permit('chef_departement', 'admin'), getChefDashboardData);
router.get(  '/biens', verifyToken, permit('chef_departement', 'admin'), getBiensAffectesByDepartement);




export default router; 
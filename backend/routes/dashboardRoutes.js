// backend/routes/dashboardRoutes.js

import express from 'express';
import { getDashboardData } from '../controllers/dashboardController.js';
// Vous pouvez ajouter un middleware d'authentification si nécessaire

const router = express.Router();

// Route pour récupérer toutes les données du dashboard
router.get('/dashboard', getDashboardData); 

export default router;
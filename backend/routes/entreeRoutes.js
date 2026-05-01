// backend/routes/entreeRoutes.js
/*
import express from 'express';
import { createEntree } from '../controllers/EntreeController.js'; 

const router = express.Router();

// POST /api/entrees : Ajoute du stock à un bien existant (utilise EntreeController.js)
router.post('/', createEntree); 

// (Ajoutez ici les routes GET si vous avez besoin de récupérer l'historique des entrées)

export default router;*/
import express from 'express';
import { createEntree } from '../controllers/EntreeController.js';
import { verifyToken, permit } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, permit('depositaire'), createEntree);

export default router;

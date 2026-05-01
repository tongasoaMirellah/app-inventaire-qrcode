import express from 'express';
import {
  createSortie,
  getAllSorties,
  getSortieById,
  updateSortie,
  deleteSortie
} from '../controllers/SortieController.js';
import { verifyToken, permit } from '../middleware/authMiddleware.js';

const router = express.Router();

// ➕ Créer une sortie
router.post('/', verifyToken, permit('admin', 'depositaire'), createSortie);

// 📋 Récupérer toutes les sorties
router.get('/', verifyToken, permit('admin', 'chef', 'depositaire'), getAllSorties);

// 🔍 Récupérer une sortie par ID
router.get('/:id', verifyToken, permit('admin', 'chef', 'depositaire'), getSortieById);

// ✏️ Mettre à jour une sortie
router.put('/:id', verifyToken, permit('admin', 'depositaire'), updateSortie);
router.delete('/:id', verifyToken, permit('admin', 'depositaire'), deleteSortie);

export default router;

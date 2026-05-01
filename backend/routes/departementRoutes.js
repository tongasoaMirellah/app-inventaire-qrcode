import express from 'express';
import {
  getAllDepartements,
  getDepartementById,
  createDepartement,
  updateDepartement,
  deleteDepartement
} from '../controllers/DepartementController.js';

const router = express.Router();

// Routes
router.get('/', getAllDepartements);       // Liste tous les départements
router.get('/:id', getDepartementById);   // Détail d'un département
router.post('/', createDepartement);      // Créer
router.put('/:id', updateDepartement);    // Modifier
router.delete('/:id', deleteDepartement); // Supprimer

export default router;

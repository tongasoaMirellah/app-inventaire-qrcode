import express from 'express';
import {
  getAllServices, getServiceById, createService, updateService, deleteService
} from '../controllers/ServiceController.js';
import {
  getAllDepartements, getDepartementById, createDepartement, updateDepartement, deleteDepartement
} from '../controllers/DepartementController.js';
import {
  getAllNomenclatures, getNomenclatureById, createNomenclature, updateNomenclature, deleteNomenclature
} from '../controllers/NomenclatureController.js';
import { verifyToken, permit } from '../middleware/authMiddleware.js';

const router = express.Router();

// Services
router.get('/services', verifyToken, getAllServices);
router.get('/services/:id', verifyToken, getServiceById);
router.post('/services', verifyToken, permit('admin'), createService);
router.put('/services/:id', verifyToken, permit('admin'), updateService);
router.delete('/services/:id', verifyToken, permit('admin'), deleteService);

// Départements
router.get('/departements', verifyToken, getAllDepartements);
router.get('/departements/:id', verifyToken, getDepartementById);
router.post('/departements', verifyToken, permit('admin'), createDepartement);
router.put('/departements/:id', verifyToken, permit('admin'), updateDepartement);
router.delete('/departements/:id', verifyToken, permit('admin'), deleteDepartement);

// Nomenclatures
router.get('/nomenclatures', verifyToken, getAllNomenclatures);
router.get('/nomenclatures/:id', verifyToken, getNomenclatureById);
router.post('/nomenclatures', verifyToken, permit('admin'), createNomenclature);
router.put('/nomenclatures/:id', verifyToken, permit('admin'), updateNomenclature);
router.delete('/nomenclatures/:id', verifyToken, permit('admin'), deleteNomenclature);

export default router;

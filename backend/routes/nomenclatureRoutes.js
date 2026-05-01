import express from 'express';
import { createNomenclature, getAllNomenclatures,getNomenclatureById, updateNomenclature, deleteNomenclature } from '../controllers/NomenclatureController.js';

const router = express.Router();

router.post('/', createNomenclature);
router.get('/', getAllNomenclatures);
router.put('/:id', updateNomenclature);
router.delete('/:id', deleteNomenclature);

export default router;

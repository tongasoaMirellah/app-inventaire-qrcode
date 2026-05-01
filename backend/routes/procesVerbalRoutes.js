import express from 'express';
import { createPV, getAllPV, getPVById } from '../controllers/ProcesVerbalController.js';

const router = express.Router();

router.post('/', createPV);
router.get('/', getAllPV);
router.get('/:id', getPVById);

export default router;

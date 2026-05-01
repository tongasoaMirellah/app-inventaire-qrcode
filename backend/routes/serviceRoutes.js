import express from 'express';
import {
  getServices,
  createService,
  updateService,
  deleteService
} from '../controllers/ServiceController.js';

const router = express.Router();

router.get('/', getServices);          // GET /api/services
router.post('/', createService);       // POST /api/services
router.put('/:id', updateService);     // PUT /api/services/:id
router.delete('/:id', deleteService);  // DELETE /api/services/:id

export default router;

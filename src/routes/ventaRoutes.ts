import express from 'express';
import {
  createVenta,
  getVentas,
  updateVenta,
  cambiarEstadoVenta,
} from '../controllers/ventaController';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

router.post('/create', asyncHandler(createVenta));

router.get('/', asyncHandler(getVentas));

router.put('/update/:idVenta', asyncHandler(updateVenta));

router.put('/estado/:idVenta', asyncHandler(cambiarEstadoVenta));

export default router;

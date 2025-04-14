import { Router, Request, Response, NextFunction } from 'express';
import {
  createDetalleCompra,
  getDetallesCompra,
  updateDetalleCompra,
} from '../controllers/detalleCompraController';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();


router.post('/create', asyncHandler(createDetalleCompra));

router.get('/', asyncHandler(getDetallesCompra));

router.put('/update/:idDetalleCompra', asyncHandler(updateDetalleCompra));

export default router;

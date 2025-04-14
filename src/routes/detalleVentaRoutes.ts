import { Router, Request, Response, NextFunction } from 'express';
import {
  createDetalleVenta,
  getDetallesVenta,
  updateDetalleVenta,
} from '../controllers/detalleVentaContoller';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();


router.post('/create', asyncHandler(createDetalleVenta));
router.get('/', asyncHandler(getDetallesVenta));
router.put('/update/:idDetalleVenta', asyncHandler(updateDetalleVenta));

export default router;

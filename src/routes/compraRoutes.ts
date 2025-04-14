import { Router } from 'express';
import {
  createCompra,
  getCompras,
  updateCompra,
  cambiarEstadoCompra,
  deleteCompra,
} from '../controllers/compraController';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.post('/create', asyncHandler(createCompra));

router.get('/', asyncHandler(getCompras));

router.put('/update/:idCompra', asyncHandler(updateCompra));

router.put('/estado/:idCompra', asyncHandler(cambiarEstadoCompra));

router.delete('/delete/:idCompra', asyncHandler(deleteCompra));

export default router;

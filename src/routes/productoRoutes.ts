import express from 'express';
import {
  createProducto,
  getProductos,
  updateProducto,
  cambiarEstadoProducto
} from '../controllers/productoController';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

router.post('/create', asyncHandler(createProducto));

router.get('/', asyncHandler(getProductos));

router.put('/update/:idProducto', asyncHandler(updateProducto));

router.put('/estado/:idProducto', asyncHandler(cambiarEstadoProducto));

export default router;

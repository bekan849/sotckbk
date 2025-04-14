import express from 'express';
import {
  createProveedor,
  getProveedores,
  updateProveedor,
  cambiarEstadoProveedor
} from '../controllers/proveedorController';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

router.post('/create', asyncHandler(createProveedor));

router.get('/', asyncHandler(getProveedores));

router.put('/update/:idProveedor', asyncHandler(updateProveedor));

router.put('/estado/:idProveedor', asyncHandler(cambiarEstadoProveedor));

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import {
  createCategoria,
  getCategorias,
  updateCategoria,
  cambiarEstadoCategoria,
} from '../controllers/categoriaController';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

router.post('/create', asyncHandler(createCategoria));

router.get('/', asyncHandler(getCategorias));

router.put('/update/:idCategoria', asyncHandler(updateCategoria));

router.put('/estado/:idCategoria', asyncHandler(cambiarEstadoCategoria));

export default router;

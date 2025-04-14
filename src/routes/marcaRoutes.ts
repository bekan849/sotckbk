import express from 'express';
import {
  createMarca,
  getMarcas,
  updateMarca,
  cambiarEstadoMarca
} from '../controllers/marcaController';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

router.post('/create', asyncHandler(createMarca));

router.get('/', asyncHandler(getMarcas));

router.put('/update/:idMarca', asyncHandler(updateMarca));

router.put('/estado/:idMarca', asyncHandler(cambiarEstadoMarca));

export default router;

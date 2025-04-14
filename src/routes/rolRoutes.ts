// backend/src/routes/rolRoutes.ts
import express from 'express';
import {
  createRol,
  getRoles,
  updateRol,
  cambiarEstadoRol,
  getRolById
} from '../controllers/rolController';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

router.get('/', asyncHandler(getRoles));

router.post('/create', asyncHandler(createRol));

router.put('/update/:idRol', asyncHandler(updateRol));

router.put('/estado/:idRol', asyncHandler(cambiarEstadoRol));

router.get("/auth/:idRol", asyncHandler(getRolById));

export default router;

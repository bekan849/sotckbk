// backend/src/routes/userRoutes.ts
import express from 'express';
import {
  createUsuario,
  updateUsuario,
  cambiarEstadoUsuario,
  getUsuarios,
  getUsuarioByUidAuth
} from '../controllers/userController';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();


router.get('/', asyncHandler(getUsuarios));
router.post('/create', asyncHandler(createUsuario));
router.put('/update/:idUsuario', asyncHandler(updateUsuario));
router.put('/estado/:idUsuario', asyncHandler(cambiarEstadoUsuario));
router.get("/auth/:uidAuth",  asyncHandler(getUsuarioByUidAuth));

export default router;

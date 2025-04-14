import express from 'express';
import {
  getUsuarioRol,
  createUsuarioRol,
  updateUsuarioRol,
  cambiarEstadoUsuarioRol,
  getUsuarioRolByUserId
} from '../controllers/usuarioRolController';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

router.post('/create', asyncHandler(createUsuarioRol));

router.get('/', asyncHandler(getUsuarioRol));

router.put('/update/:idUsuarioRol', asyncHandler(updateUsuarioRol));

router.put('/estado/:idUsuarioRol', asyncHandler(cambiarEstadoUsuarioRol));

router.get("/auth/:idUsuario", asyncHandler(getUsuarioRolByUserId));

export default router;

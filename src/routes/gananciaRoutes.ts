import express from 'express';
import { obtenerGananciasDelDia } from '../controllers/gananciacontroller';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

router.get('/dia', asyncHandler(obtenerGananciasDelDia));

export default router;

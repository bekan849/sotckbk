import express from 'express';
import { obtenerResumenDelDia } from '../controllers/gananciacontroller';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

router.get('/dia', asyncHandler(obtenerResumenDelDia));

export default router;

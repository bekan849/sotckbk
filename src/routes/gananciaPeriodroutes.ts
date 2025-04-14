import express from "express";
import { obtenerResumenPorTipo } from "../controllers/gananciaPerioController";
import { asyncHandler } from "../middleware/asyncHandler";

const router = express.Router();

router.get("/resumen", asyncHandler(obtenerResumenPorTipo));

export default router;

import { Request, Response } from "express";
import { calcularResumenDelDia, ResumenDia } from "../utilis/gananciaPEPS";

export const obtenerResumenDelDia = async (_req: Request, res: Response) => {
  try {
    const resultado: ResumenDia = await calcularResumenDelDia();
    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Error al calcular el resumen del día:", error);
    return res.status(500).json({ error: "Error interno al calcular el resumen del día" });
  }
};

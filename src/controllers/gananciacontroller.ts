import { Request, Response } from "express";
import { calcularGananciaDelDia } from "../utilis/gananciaPEPS";

export const obtenerGananciasDelDia = async (_req: Request, res: Response) => {
  try {
    const resultado = await calcularGananciaDelDia();
    res.status(200).json(resultado);
  } catch (error) {
    console.error("Error al calcular la ganancia del día:", error);
    res.status(500).json({ error: "Error interno al calcular ganancias" });
  }
};

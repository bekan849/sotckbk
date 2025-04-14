import { Request, Response } from "express";
import { calcularResumenPorTipo } from "../utilis/calculoResumenPEPS";

export const obtenerResumenPorTipo = async (req: Request, res: Response) => {
  try {
    const tipoParam = req.query.tipo?.toString().toLowerCase();
    const tiposValidos = ["dia", "semana", "mes", "anio"];

    if (!tipoParam || !tiposValidos.includes(tipoParam)) {
      return res.status(400).json({ error: "Tipo de agrupación inválido. Usa: dia, semana, mes o anio." });
    }

    const tipo = tipoParam as "dia" | "semana" | "mes" | "anio";

    const data = await calcularResumenPorTipo(tipo);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error al obtener resumen:", error);
    return res.status(500).json({ error: "Error interno al generar el resumen." });
  }
};

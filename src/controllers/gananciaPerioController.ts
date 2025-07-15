import { Request, Response } from "express";
import { calcularResumenPorTipo } from "../utilis/calculoResumenPEPS";

export const obtenerResumenPorTipo = async (req: Request, res: Response) => {
  try {
    const tipoParam = req.query.tipo?.toString().toLowerCase();
    const periodoParam = req.query.periodo?.toString();

    const tiposValidos = ["dia", "semana", "mes", "anio"];

    if (!tipoParam || !tiposValidos.includes(tipoParam)) {
      return res.status(400).json({
        error: "Tipo de agrupación inválido. Usa: dia, semana, mes o anio.",
      });
    }

    const tipo = tipoParam as "dia" | "semana" | "mes" | "anio";

    // Validar que el periodo sea válido solo si es tipo 'dia' o 'semana'
    if (
      (tipo === "dia" || tipo === "semana") &&
      periodoParam &&
      isNaN(Date.parse(periodoParam))
    ) {
      return res.status(400).json({
        error:
          "El parámetro 'periodo' debe ser una fecha válida en formato YYYY-MM-DD.",
      });
    }

    // Para 'mes' y 'anio' no validamos aquí, se validan en el cálculo

    const resumen = await calcularResumenPorTipo(tipo, periodoParam);
    return res.status(200).json(resumen);
  } catch (error) {
    console.error("Error al obtener resumen:", error);
    return res.status(500).json({
      error: "Error interno al generar el resumen.",
    });
  }
};

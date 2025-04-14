import { Request, Response } from "express";
import {
  createVentaInFirestore,
  getVentasFromFirestore,
  updateVentaInFirestore,
  cambiarEstadoVentaInFirestore,
} from "../models/Venta";

const validarVenta = (
  total: number,
  estado: string,
  idVendedor: string,
  isUpdate: boolean
): string | null => {
  if (!idVendedor || typeof idVendedor !== "string" || !idVendedor.trim()) {
    return "El ID del vendedor es obligatorio y debe ser un string válido.";
  }
  if (isUpdate) {
    if (typeof total !== "number" || total <= 0) {
      return "El total de la venta debe ser un número positivo.";
    }
    const estadosValidos = ["pendiente", "completada", "cancelada"];
    if (!estadosValidos.includes(estado)) {
      return `El estado debe ser uno de: ${estadosValidos.join(", ")}.`;
    }
  }
  return null;
};

export const createVenta = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idVendedor } = req.body;

    if (!idVendedor || typeof idVendedor !== "string" || !idVendedor.trim()) {
      res.status(400).json({ message: "El ID del vendedor es obligatorio y debe ser un string válido." });
      return;
    }

    const idVenta = await createVentaInFirestore(idVendedor.trim());
    res.status(201).json({ message: "Venta creada exitosamente.", idVenta });
  } catch (error) {
    res.status(500).json({ message: "Error al crear la venta: " + (error as Error).message });
  }
};

export const getVentas = async (_req: Request, res: Response): Promise<void> => {
  try {
    const ventas = await getVentasFromFirestore();
    res.status(200).json(ventas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las ventas: " + (error as Error).message });
  }
};

export const updateVenta = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idVenta } = req.params;
    const { total, estado, idVendedor } = req.body;

    const error = validarVenta(total, estado, idVendedor, true);
    if (error) {
      res.status(400).json({ message: error });
      return;
    }

    await updateVentaInFirestore(idVenta, total, estado, idVendedor.trim());
    res.status(200).json({ message: "Venta actualizada exitosamente." });
  } catch (error) {
    const mensaje = (error as Error).message;
    if (mensaje.includes("administrador")) {
      res.status(403).json({ message: mensaje });
    } else {
      res.status(500).json({ message: "Error al actualizar la venta: " + mensaje });
    }
  }
};

export const cambiarEstadoVenta = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idVenta } = req.params;
    const { estado, idUsuario } = req.body;

    if (!["pendiente", "completada", "cancelada"].includes(estado)) {
      res.status(400).json({ message: "El estado debe ser: pendiente, completada o cancelada." });
      return;
    }

    if (!idUsuario || typeof idUsuario !== "string" || !idUsuario.trim()) {
      res.status(400).json({ message: "El ID del usuario es obligatorio." });
      return;
    }

    await cambiarEstadoVentaInFirestore(idVenta, estado, idUsuario.trim());

    res.status(200).json({ message: `Estado de la venta cambiado a ${estado}.` });
  } catch (error) {
    const msg = (error as Error).message;

    if (msg.includes("administrador") || msg.includes("no se puede")) {
      res.status(403).json({ message: msg });
    } else if (msg.includes("Stock insuficiente")) {
      res.status(409).json({ message: msg });
    } else {
      res.status(500).json({ message: "Error al cambiar el estado de la venta: " + msg });
    }
  }
};

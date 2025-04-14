import { Request, Response } from "express";
import {
  createCompraInFirestore,
  getComprasFromFirestore,
  updateCompraInFirestore,
  cambiarEstadoCompraInFirestore,
  deleteCompraInFirestore,
} from "../models/Compra";

function validarCompra(
  total: number,
  idProveedor: string,
  estado?: string,
  isCreate = false
): string | null {
  if (typeof total !== "number" || total <= 0) {
    return "El total debe ser un número positivo.";
  }
  if (!idProveedor || typeof idProveedor !== "string" || !idProveedor.trim()) {
    return "El ID del proveedor es obligatorio.";
  }
  if (!isCreate && estado) {
    const estadosValidos = ["pendiente", "completada", "cancelada"];
    if (!estadosValidos.includes(estado)) {
      return `Estado inválido. Debe ser uno de: ${estadosValidos.join(", ")}.`;
    }
  }
  return null;
}

export const createCompra = async (req: Request, res: Response): Promise<void> => {
  try {
    const { total, idProveedor } = req.body;

    const error = validarCompra(total, idProveedor, undefined, true);
    if (error) {
      res.status(400).json({ message: error });
      return;
    }

    const idCompra = await createCompraInFirestore(total, idProveedor);
    res.status(201).json({ message: "Compra creada exitosamente.", idCompra });
  } catch (error) {
    res.status(500).json({ message: "Error al crear la compra: " + (error as Error).message });
  }
};

export const getCompras = async (_req: Request, res: Response): Promise<void> => {
  try {
    const compras = await getComprasFromFirestore();
    res.status(200).json(compras);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener compras: " + (error as Error).message });
  }
};

export const updateCompra = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idCompra } = req.params;
    const { total, estado, idProveedor } = req.body;

    const error = validarCompra(total, idProveedor, estado);
    if (error) {
      res.status(400).json({ message: error });
      return;
    }

    await updateCompraInFirestore(idCompra, total, estado, idProveedor);
    res.status(200).json({ message: "Compra actualizada correctamente." });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar la compra: " + (error as Error).message });
  }
};

export const cambiarEstadoCompra = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idCompra } = req.params;
    const { estado } = req.body;

    const estadosValidos = ["pendiente", "completada", "cancelada"];
    if (!estado || !estadosValidos.includes(estado)) {
      res.status(400).json({
        message: `El estado debe ser uno de: ${estadosValidos.join(", ")}.`,
      });
      return;
    }

    await cambiarEstadoCompraInFirestore(idCompra, estado);
    res.status(200).json({ message: `Estado de la compra actualizado a "${estado}".` });
  } catch (error) {
    res.status(500).json({ message: "Error al cambiar el estado: " + (error as Error).message });
  }
};

export const deleteCompra = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idCompra } = req.params;

    if (!idCompra || typeof idCompra !== "string") {
      res.status(400).json({ message: "ID de compra inválido." });
      return;
    }

    await deleteCompraInFirestore(idCompra);
    res.status(200).json({ message: "Compra eliminada correctamente." });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar la compra: " + (error as Error).message });
  }
};

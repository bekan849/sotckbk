import { Request, Response } from "express";
import {
  createDetalleCompraInFirestore,
  getDetallesCompraFromFirestore,
  updateDetalleCompraInFirestore,
} from "../models/DetalleCompra";

export const createDetalleCompra = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idCompra, idProductos, cantidad, precioCosto, precioVenta } = req.body;

    const idDetalleCompra = await createDetalleCompraInFirestore(
      idCompra,
      idProductos,
      cantidad,
      precioCosto,
      precioVenta
    );

    res.status(201).json({
      message: "Detalle de compra creado exitosamente.",
      idDetalleCompra,
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getDetallesCompra = async (_req: Request, res: Response): Promise<void> => {
  try {
    const detalles = await getDetallesCompraFromFirestore();
    res.status(200).json(detalles);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const updateDetalleCompra = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idDetalleCompra } = req.params;
    const { idProductos, cantidad, precioCosto, precioVenta } = req.body;

    if (!idDetalleCompra || typeof idDetalleCompra !== "string") {
      res.status(400).json({ message: "ID del detalle de compra inválido." });
      return;
    }

    await updateDetalleCompraInFirestore(
      idDetalleCompra,
      idProductos,
      cantidad,
      precioCosto,
      precioVenta
    );

    res.status(200).json({ message: "Detalle de compra actualizado correctamente." });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

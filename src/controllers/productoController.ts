import { Request, Response } from "express";
import {
  createProductoInFirestore,
  getProductosFromFirestore,
  updateProductoInFirestore,
  cambiarEstadoProductoInFirestore,
} from "../models/Producto";

export const createProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, descripcion, stock, estado, idCategoria, idMarca, imagen } = req.body;

    await createProductoInFirestore(nombre, descripcion, stock, estado, idCategoria, idMarca, imagen);

    res.status(201).json({ message: "Producto creado exitosamente." });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getProductos = async (_req: Request, res: Response): Promise<void> => {
  try {
    const productos = await getProductosFromFirestore();
    res.status(200).json(productos);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const updateProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idProducto } = req.params;
    const { nombre, descripcion, stock, estado, idCategoria, idMarca, imagen } = req.body;

    await updateProductoInFirestore(idProducto, nombre, descripcion, stock, estado, idCategoria, idMarca, imagen);

    res.status(200).json({ message: "Producto actualizado exitosamente." });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const cambiarEstadoProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idProducto } = req.params;
    const { estado } = req.body;

    if (typeof estado !== "boolean") {
      res.status(400).json({ message: "El estado debe ser un valor booleano (true o false)." });
      return;
    }

    await cambiarEstadoProductoInFirestore(idProducto, estado);

    res.status(200).json({ message: `El producto ha sido ${estado ? "activado" : "desactivado"} correctamente.` });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

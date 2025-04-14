import { Request, Response } from "express";
import {
  createProveedorInFirestore,
  getProveedoresFromFirestore,
  updateProveedorInFirestore,
  cambiarEstadoProveedorInFirestore,
} from "../models/Proveedor";

export const createProveedor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, direccion, email, telefono, estado } = req.body;

    await createProveedorInFirestore(nombre, direccion, email, telefono, estado);

    res.status(201).json({ message: "Proveedor creado exitosamente." });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getProveedores = async (req: Request, res: Response): Promise<void> => {
  try {
    const proveedores = await getProveedoresFromFirestore();
    res.status(200).json(proveedores);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const updateProveedor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idProveedor } = req.params;
    const { nombre, direccion, email, telefono, estado } = req.body;

    await updateProveedorInFirestore(idProveedor, nombre, direccion, email, telefono, estado);

    res.status(200).json({ message: "Proveedor actualizado exitosamente." });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const cambiarEstadoProveedor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idProveedor } = req.params;
    const { estado } = req.body;

    if (typeof estado !== "boolean") {
      res.status(400).json({ message: "El estado debe ser un valor booleano (true o false)." });
      return;
    }

    await cambiarEstadoProveedorInFirestore(idProveedor, estado);

    res.status(200).json({
      message: `El estado del proveedor ha sido cambiado a ${estado ? "activo" : "inactivo"}.`,
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

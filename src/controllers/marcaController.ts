import { Request, Response } from "express";
import {
  createMarcaInFirestore,
  getMarcasFromFirestore,
  updateMarcaInFirestore,
  cambiarEstadoMarcaInFirestore,
} from "../models/Marca";

export const createMarca = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, estado } = req.body;

    await createMarcaInFirestore(nombre, estado);

    res.status(201).json({ message: "Marca creada exitosamente." });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getMarcas = async (req: Request, res: Response): Promise<void> => {
  try {
    const marcas = await getMarcasFromFirestore();
    res.status(200).json(marcas);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const updateMarca = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idMarca } = req.params;
    const { nombre, estado } = req.body;

    await updateMarcaInFirestore(idMarca, nombre, estado);

    res.status(200).json({ message: "Marca actualizada exitosamente." });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const cambiarEstadoMarca = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idMarca } = req.params;
    const { estado } = req.body;

    if (typeof estado !== "boolean") {
      res.status(400).json({ message: "El estado debe ser un valor booleano (true o false)." });
      return;
    }

    await cambiarEstadoMarcaInFirestore(idMarca, estado);

    res.status(200).json({
      message: `El estado de la marca ha sido actualizado a ${estado ? "activa" : "inactiva"}.`,
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

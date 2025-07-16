import { Request, Response } from "express";
import {
  createCategoriaInFirestore,
  getCategoriasFromFirestore,
  updateCategoriaInFirestore,
  cambiarEstadoCategoriaInFirestore,
} from "../models/Categoria";

export const createCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, estado } = req.body;

    await createCategoriaInFirestore(nombre, estado);

    res.status(201).json({ message: "Categoría creada exitosamente." });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// ✅ Obtener todas las categorías
export const getCategorias = async (req: Request, res: Response): Promise<void> => {
  try {
    const categorias = await getCategoriasFromFirestore();
    res.status(200).json(categorias);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ✅ Actualizar categoría
export const updateCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idCategoria } = req.params;
    const { nombre, estado } = req.body;

    await updateCategoriaInFirestore(idCategoria, nombre, estado);

    res.status(200).json({ message: "Categoría actualizada exitosamente." });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// ✅ Cambiar estado de la categoría
export const cambiarEstadoCategoria = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idCategoria } = req.params;
    const { estado } = req.body;

    if (typeof estado !== "boolean") {
      res.status(400).json({ message: "El estado debe ser un valor booleano." });
      return;
    }

    await cambiarEstadoCategoriaInFirestore(idCategoria, estado);

    res.status(200).json({
      message: `El estado de la categoría ha sido ${estado ? "activado" : "desactivado"}.`,
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

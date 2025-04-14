import { Request, Response } from "express";
import {
  createRolInFirestore,
  getRolesFromFirestore,
  updateRolInFirestore,
  cambiarEstadoRolInFirestore,
  getRolByIdFromFirestore,
} from "../models/Rol";

// ✅ Crear rol
export const createRol = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, estado } = req.body;

    await createRolInFirestore(nombre, estado);

    res.status(201).json({ message: "Rol creado exitosamente." });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// ✅ Obtener todos los roles
export const getRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const roles = await getRolesFromFirestore();
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

// ✅ Actualizar rol
export const updateRol = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idRol } = req.params;
    const { nombre, estado } = req.body;

    await updateRolInFirestore(idRol, nombre, estado);

    res.status(200).json({ message: "Rol actualizado exitosamente." });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

// ✅ Cambiar estado de rol
export const cambiarEstadoRol = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idRol } = req.params;
    const { estado } = req.body;

    if (typeof estado !== "boolean") {
      res.status(400).json({ message: "El estado debe ser un valor booleano (true o false)." });
      return;
    }

    await cambiarEstadoRolInFirestore(idRol, estado);

    res.status(200).json({
      message: `El estado del rol ha sido cambiado a ${estado ? "activo" : "inactivo"}.`,
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getRolById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idRol } = req.params;
    const rol = await getRolByIdFromFirestore(idRol);

    if (!rol) {
      res.status(404).json({ message: "Rol no encontrado." });
      return;
    }

    res.status(200).json(rol);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

import { Request, Response } from "express";
import {
  createUsuarioRolInFirestore,
  getUsuarioRolFromFirestore,
  updateUsuarioRolInFirestore,
  cambiarEstadoUsuarioRolInFirestore,
  getUsuarioRolByUserIdFromFirestore,
} from "../models/UsuarioRol";

export const createUsuarioRol = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idUsuario, idRol, estado } = req.body;

    await createUsuarioRolInFirestore(idUsuario, idRol, estado);

    res.status(201).json({ message: "Asignación de rol a usuario creada exitosamente." });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getUsuarioRol = async (_req: Request, res: Response): Promise<void> => {
  try {
    const usuarioRol = await getUsuarioRolFromFirestore();
    res.status(200).json(usuarioRol);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const updateUsuarioRol = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idUsuarioRol } = req.params;
    const { idUsuario, idRol, estado } = req.body;

    await updateUsuarioRolInFirestore(idUsuarioRol, idUsuario, idRol, estado);

    res.status(200).json({ message: "Asignación de rol a usuario actualizada exitosamente." });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const cambiarEstadoUsuarioRol = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idUsuarioRol } = req.params;
    const { estado } = req.body;

    if (typeof estado !== "boolean") {
      res.status(400).json({ message: "El estado debe ser un valor booleano (true o false)." });
      return;
    }

    await cambiarEstadoUsuarioRolInFirestore(idUsuarioRol, estado);

    res.status(200).json({ message: `El estado de la asignación ha sido cambiado a ${estado ? "activo" : "inactivo"}.` });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getUsuarioRolByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idUsuario } = req.params;
    const usuarioRol = await getUsuarioRolByUserIdFromFirestore(idUsuario);

    if (!usuarioRol) {
      res.status(404).json({ message: "Asignación no encontrada para el usuario." });
      return;
    }

    res.status(200).json(usuarioRol);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

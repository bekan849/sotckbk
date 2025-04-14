import { Request, Response } from "express";
import {
  createUsuarioInFirestore,
  getUsuariosFromFirestore,
  updateUsuarioInFirestore,
  cambiarEstadoUsuarioInFirestore,
  getUsuarioByUidAuthFromFirestore,
} from "../models/user";

export const createUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, apellido, email, contraseña, telefono, direccion, estado } = req.body;

    await createUsuarioInFirestore(nombre, apellido, email, contraseña, telefono, direccion, estado);

    res.status(201).json({ message: "Usuario creado exitosamente." });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getUsuarios = async (_req: Request, res: Response): Promise<void> => {
  try {
    const usuarios = await getUsuariosFromFirestore();
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getUsuarioByUidAuth = async (req: Request, res: Response): Promise<void> => {
  const { uidAuth } = req.params;

  try {
    const usuario = await getUsuarioByUidAuthFromFirestore(uidAuth);

    if (!usuario) {
      res.status(404).json({ message: "Usuario no encontrado." });
      return;
    }

    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const updateUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idUsuario } = req.params;
    const { nombre, apellido, email, telefono, direccion, estado, contraseña } = req.body;

    await updateUsuarioInFirestore(
      idUsuario,
      nombre,
      apellido,
      email,
      telefono,
      direccion,
      estado,
      contraseña
    );

    res.status(200).json({ message: "Usuario actualizado exitosamente." });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const cambiarEstadoUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idUsuario } = req.params;
    const { estado } = req.body;

    if (typeof estado !== "boolean") {
      res.status(400).json({ message: "El estado debe ser un valor booleano (true o false)." });
      return;
    }

    await cambiarEstadoUsuarioInFirestore(idUsuario, estado);

    res.status(200).json({ message: "Estado del usuario actualizado exitosamente." });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

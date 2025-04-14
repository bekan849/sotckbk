import { Request, Response } from "express";
import {
  getConfigGlobalFromFirestore,
  setConfigGlobalInFirestore,
  ConfigGlobal,
} from "../models/configuracionGlobal";

export const getConfigGlobalController = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await getConfigGlobalFromFirestore();

    if (!config) {
      res.status(404).json({ message: "No hay configuración registrada aún." });
      return;
    }

    res.status(200).json(config);
  } catch (error) {
    console.error("Error al obtener la configuración:", (error as Error).message);
    res.status(500).json({ message: "Error al obtener la configuración global del sistema." });
  }
};

export const setConfigGlobalController = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      nombreEmpresa,
      moneda,
      email,
      sitioWeb,
      ubicacion,
      telefonos,
    } = req.body;

    const datos: Omit<ConfigGlobal, "createdAt" | "updatedAt"> = {
      nombreEmpresa,
      moneda,
      email,
      sitioWeb,
      ubicacion,
      telefonos,
    };

    await setConfigGlobalInFirestore(datos);

    res.status(200).json({ message: "Configuración guardada correctamente." });
  } catch (error) {
    console.error("❌ Error al guardar configuración:", (error as Error).message);
    res.status(400).json({ message: (error as Error).message });
  }
};

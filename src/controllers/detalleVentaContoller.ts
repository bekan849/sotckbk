import { Request, Response } from 'express';
import {
  createDetalleVentaInFirestore,
  getDetallesVentaFromFirestore,
  updateDetalleVentaInFirestore,
} from '../models/DetalleVenta';

const validarProductos = (productos: any[]): string | null => {
  if (!Array.isArray(productos) || productos.length === 0) {
    return 'Debes enviar una lista válida de productos.';
  }

  for (const producto of productos) {
    if (
      !producto.idProducto ||
      typeof producto.idProducto !== 'string' ||
      typeof producto.cantidad !== 'number' ||
      typeof producto.precioVenta !== 'number'
    ) {
      return 'Cada producto debe tener idProducto (string), cantidad (number) y precioVenta (number).';
    }

    if (producto.cantidad <= 0 || producto.precioVenta <= 0) {
      return 'La cantidad y el precio de venta deben ser mayores a 0.';
    }
  }

  return null;
};

export const createDetalleVenta = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idVenta, productos } = req.body;

    if (!idVenta || typeof idVenta !== 'string') {
      res.status(400).json({ message: 'El ID de la venta es obligatorio y debe ser un string válido.' });
      return;
    }

    const error = validarProductos(productos);
    if (error) {
      res.status(400).json({ message: error });
      return;
    }

    const detalleVentaId = await createDetalleVentaInFirestore(idVenta, productos);

    res.status(201).json({
      message: 'Detalle de venta creado exitosamente.',
      idDetalleVenta: detalleVentaId,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al crear el detalle de venta: ' + (error as Error).message,
    });
  }
};

export const getDetallesVenta = async (_req: Request, res: Response): Promise<void> => {
  try {
    const detallesVenta = await getDetallesVentaFromFirestore();
    res.status(200).json(detallesVenta);
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener los detalles de venta: ' + (error as Error).message,
    });
  }
};

export const updateDetalleVenta = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idDetalleVenta } = req.params;
    const { productos, idUsuario } = req.body;

    if (!idDetalleVenta || typeof idDetalleVenta !== 'string') {
      res.status(400).json({ message: 'El ID del detalle de venta es obligatorio.' });
      return;
    }

    if (!idUsuario || typeof idUsuario !== 'string') {
      res.status(400).json({ message: 'El ID del usuario es obligatorio y debe ser válido.' });
      return;
    }

    const error = validarProductos(productos);
    if (error) {
      res.status(400).json({ message: error });
      return;
    }

    await updateDetalleVentaInFirestore(idDetalleVenta, productos, idUsuario);

    res.status(200).json({ message: 'Detalle de venta actualizado correctamente.' });
  } catch (error) {
    const mensaje = (error as Error).message;

    if (mensaje.includes('editar ventas el mismo día')) {
      res.status(403).json({
        message: 'No tienes permisos para editar esta venta fuera del mismo día.',
      });
    } else if (mensaje.includes('Stock insuficiente')) {
      res.status(400).json({ message: mensaje });
    } else {
      res.status(500).json({
        message: 'Error al actualizar el detalle de venta: ' + mensaje,
      });
    }
  }
};

import admin from "../config/firebase";

const db = admin.firestore();

interface VentaDB {
  fechaVenta: admin.firestore.Timestamp;
  total: number;
  estado: "pendiente" | "completada" | "cancelada";
  idVendedor: string;
}

interface Venta {
  idVenta?: string;
  fechaVenta: string;
  total: number;
  estado: "pendiente" | "completada" | "cancelada";
  idVendedor: string;
}

const validarVenta = (
  total: number,
  estado: string,
  idVendedor: string,
  isUpdate: boolean
): string | null => {
  if (!idVendedor || typeof idVendedor !== "string" || !idVendedor.trim()) {
    return "El ID del vendedor es obligatorio y debe ser un string válido.";
  }
  if (isUpdate) {
    if (typeof total !== "number" || total <= 0) {
      return "El total de la venta debe ser un número positivo.";
    }
    const estadosValidos = ["pendiente", "completada", "cancelada"];
    if (!estadosValidos.includes(estado)) {
      return `El estado debe ser uno de: ${estadosValidos.join(", ")}.`;
    }
  }
  return null;
};

export const createVentaInFirestore = async (idVendedor: string): Promise<string> => {
  try {
    const error = validarVenta(0, "completada", idVendedor, false);
    if (error) throw new Error(error);

    const fechaVenta = admin.firestore.Timestamp.fromDate(new Date());

    const ventaRef = db.collection("ventas").doc();
    const ventaData: VentaDB = {
      fechaVenta,
      total: 0,
      estado: "completada",
      idVendedor: idVendedor.trim(),
    };

    await ventaRef.set(ventaData);
    return ventaRef.id;
  } catch (error) {
    throw new Error("Error al crear la venta: " + (error as Error).message);
  }
};

export const getVentasFromFirestore = async (): Promise<Venta[]> => {
  try {
    const snapshot = await db.collection("ventas").get();

    const ventas: Venta[] = snapshot.docs.map((doc) => {
      const data = doc.data() as VentaDB;
      return {
        idVenta: doc.id,
        fechaVenta: data.fechaVenta?.toDate?.().toISOString() ?? "",
        total: data.total,
        estado: data.estado,
        idVendedor: data.idVendedor,
      };
    });

    return ventas;
  } catch (error) {
    throw new Error("Error al obtener las ventas: " + (error as Error).message);
  }
};


const esAdministrador = async (idUsuario: string): Promise<boolean> => {
  const rolSnap = await db
    .collection("usuarioRol")
    .where("idUsuario", "==", idUsuario)
    .where("estado", "==", true)
    .limit(1)
    .get();

  if (rolSnap.empty) return false;

  const rolId = rolSnap.docs[0].data().idRol;
  const rolDoc = await db.collection("roles").doc(rolId).get();

  return rolDoc.exists && rolDoc.data()?.nombre?.toLowerCase() === "administrador";
};

export const updateVentaInFirestore = async (
  idVenta: string,
  total: number,
  estado: "pendiente" | "completada" | "cancelada",
  idVendedor: string
): Promise<void> => {
  try {
    const error = validarVenta(total, estado, idVendedor, true);
    if (error) throw new Error(error);

    const ventaRef = db.collection("ventas").doc(idVenta);
    const ventaDoc = await ventaRef.get();
    if (!ventaDoc.exists) throw new Error("La venta no existe en Firestore.");

    const { fechaVenta } = ventaDoc.data() as VentaDB;
    const esMismoDia = fechaVenta.toDate().toDateString() === new Date().toDateString();

    const admin = await esAdministrador(idVendedor);
    if (!esMismoDia && !admin) {
      throw new Error("Solo un administrador puede editar ventas de días anteriores.");
    }

    await ventaRef.update({ total, estado, idVendedor: idVendedor.trim() });
  } catch (error) {
    throw new Error("Error al actualizar la venta: " + (error as Error).message);
  }
};

export const cambiarEstadoVentaInFirestore = async (
  idVenta: string,
  nuevoEstadoVenta: "pendiente" | "completada" | "cancelada",
  idUsuarioActual: string
): Promise<void> => {
  const estadosValidos = ["pendiente", "completada", "cancelada"];
  if (!estadosValidos.includes(nuevoEstadoVenta)) {
    throw new Error(`El estado debe ser uno de: ${estadosValidos.join(", ")}.`);
  }

  await db.runTransaction(async (transaction) => {
    const ventaRef = db.collection("ventas").doc(idVenta);
    const ventaDoc = await transaction.get(ventaRef);
    if (!ventaDoc.exists) throw new Error("La venta no existe en Firestore.");

    const ventaData = ventaDoc.data() as VentaDB;
    const estadoActual = ventaData.estado;
    const esMismoDia = ventaData.fechaVenta.toDate().toDateString() === new Date().toDateString();
    const admin = await esAdministrador(idUsuarioActual);

    if (!esMismoDia && !admin && estadoActual === "pendiente") {
      throw new Error("Solo un administrador puede cambiar el estado de una venta pendiente en un día distinto.");
    }

    if (estadoActual === "cancelada" && !admin) {
      throw new Error("Solo un administrador puede modificar una venta cancelada.");
    }

    const detallesSnap = await transaction.get(
      db.collection("detalleVenta").where("idVenta", "==", idVenta)
    );

    const nuevoEstadoDetalle = nuevoEstadoVenta === "completada";
    const productosStock: { idProducto: string; cantidad: number; devolver: boolean }[] = [];
    const detallesActualizar: any[] = [];

    for (const doc of detallesSnap.docs) {
      const data = doc.data();
      const cambiaEstado = data.estado !== nuevoEstadoDetalle;

      if (cambiaEstado) {
        for (const p of data.productos) {
          productosStock.push({
            idProducto: p.idProducto,
            cantidad: p.cantidad,
            devolver: data.estado === true,
          });
        }
      }

      detallesActualizar.push({ ref: doc.ref, data, cambiaEstado });
    }

    const productosMap = new Map<string, FirebaseFirestore.DocumentSnapshot>();
    for (const { idProducto } of productosStock) {
      if (!productosMap.has(idProducto)) {
        const prodDoc = await transaction.get(db.collection("productos").doc(idProducto));
        if (!prodDoc.exists) throw new Error(`Producto ${idProducto} no encontrado.`);
        productosMap.set(idProducto, prodDoc);
      }
    }

    for (const { idProducto, cantidad, devolver } of productosStock) {
      const doc = productosMap.get(idProducto)!;
      const stock = doc.data()?.stock || 0;
      const nuevoStock = devolver ? stock + cantidad : stock - cantidad;
      if (nuevoStock < 0) throw new Error(`Stock insuficiente para ${idProducto}.`);

      transaction.update(doc.ref, { stock: nuevoStock });
    }

    for (const det of detallesActualizar) {
      if (det.cambiaEstado) {
        transaction.update(det.ref, { estado: nuevoEstadoDetalle });
      }
    }

    let nuevoTotal = 0;
    for (const det of detallesActualizar) {
      if (nuevoEstadoDetalle) {
        for (const p of det.data.productos) {
          nuevoTotal += p.subTotal;
        }
      }
    }

    transaction.update(ventaRef, {
      estado: nuevoEstadoVenta,
      total: nuevoTotal,
    });
  });
};

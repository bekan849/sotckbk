import admin from "../config/firebase";
import { validarCambioEstadoCompraPEPS } from "../validacionesDeEstado/validarCambioEstadoCompraPEPS";

const db = admin.firestore();

interface CompraDB {
  fechaIngreso: admin.firestore.Timestamp;
  total: number;
  estado: "pendiente" | "completada" | "cancelada";
  idProveedor: string;
}

interface Compra {
  idCompra?: string;
  fechaIngreso: string;
  total: number;
  estado: "pendiente" | "completada" | "cancelada";
  idProveedor: string;
}

const validarCompra = (
  total: number,
  estado: "pendiente" | "completada" | "cancelada",
  idProveedor: string
): string | null => {
  if (!idProveedor || typeof idProveedor !== "string" || !idProveedor.trim()) {
    return "El idProveedor es obligatorio y debe ser una cadena válida.";
  }

  if (total <= 0) {
    return "El total de la compra debe ser un valor positivo.";
  }

  const estadosValidos = ["pendiente", "completada", "cancelada"];
  if (!estadosValidos.includes(estado)) {
    return `El estado debe ser uno de: ${estadosValidos.join(", ")}.`;
  }

  return null;
};

export const createCompraInFirestore = async (
  total: number,
  idProveedor: string
): Promise<string> => {
  try {
    const estado: "pendiente" | "completada" | "cancelada" = "completada";

    const error = validarCompra(total, estado, idProveedor);
    if (error) throw new Error(error);

    const fechaIngreso = admin.firestore.Timestamp.fromDate(new Date());

    const compraRef = db.collection("compras").doc();
    const compraData: CompraDB = {
      fechaIngreso,
      total,
      estado,
      idProveedor,
    };

    await compraRef.set(compraData);
    return compraRef.id;
  } catch (error) {
    throw new Error("Error al crear la compra: " + (error as Error).message);
  }
};

export const getComprasFromFirestore = async (): Promise<Compra[]> => {
  try {
    const snapshot = await db.collection("compras").get();

    const compras: Compra[] = snapshot.docs.map((doc) => {
      const data = doc.data() as CompraDB;
      return {
        idCompra: doc.id,
        fechaIngreso: data.fechaIngreso.toDate().toISOString(), // ✅ ISO string
        total: data.total,
        estado: data.estado,
        idProveedor: data.idProveedor,
      };
    });

    return compras;
  } catch (error) {
    throw new Error(
      "Error al obtener las compras: " + (error as Error).message
    );
  }
};

export const updateCompraInFirestore = async (
  idCompra: string,
  total: number,
  estado: "pendiente" | "completada" | "cancelada",
  idProveedor: string
): Promise<void> => {
  try {
    const compraRef = db.collection("compras").doc(idCompra);
    const compraDoc = await compraRef.get();

    if (!compraDoc.exists) {
      throw new Error("La compra no existe en Firestore.");
    }

    await validarCambioEstadoCompraPEPS(idCompra);

    await compraRef.update({ total, estado, idProveedor });
  } catch (error) {
    throw new Error(
      "Error al actualizar la compra: " + (error as Error).message
    );
  }
};

export const cambiarEstadoCompraInFirestore = async (
  idCompra: string,
  nuevoEstadoCompra: "pendiente" | "completada" | "cancelada"
): Promise<void> => {
  const estadosValidos = ["pendiente", "completada", "cancelada"];
  if (!estadosValidos.includes(nuevoEstadoCompra)) {
    throw new Error(`El estado debe ser uno de: ${estadosValidos.join(", ")}.`);
  }

  const nuevoEstadoDetalle = nuevoEstadoCompra === "completada";

  const compraRef = db.collection("compras").doc(idCompra);
  const compraDoc = await compraRef.get();
  if (!compraDoc.exists) throw new Error("La compra no existe en Firestore.");

  await validarCambioEstadoCompraPEPS(idCompra);

  const detalleSnapshot = await db
    .collection("detalleCompra")
    .where("idCompra", "==", idCompra)
    .get();

  const detallesData = detalleSnapshot.docs.map((doc) => ({
    ref: doc.ref,
    data: doc.data(),
  }));

  const productosIdsSet = new Set<string>();
  detallesData.forEach(({ data }) => {
    const productos = data.idProductos || [];
    productos.forEach((id: string) => productosIdsSet.add(id));
  });

  await db.runTransaction(async (transaction) => {
    const productosDocs: Record<string, FirebaseFirestore.DocumentSnapshot> =
      {};

    for (const idProducto of productosIdsSet) {
      const productoRef = db.collection("productos").doc(idProducto);
      const productoDoc = await transaction.get(productoRef);
      if (!productoDoc.exists)
        throw new Error(`Producto con ID ${idProducto} no existe.`);
      productosDocs[idProducto] = productoDoc;
    }

    let nuevoTotal = 0;

    for (const { ref, data } of detallesData) {
      const estadoActual = data.estado;
      const idProductos: string[] = data.idProductos;
      const cantidades: number[] = data.cantidad;
      const subTotales: number[] = data.subTotal;

      if (estadoActual !== nuevoEstadoDetalle) {
        for (let i = 0; i < idProductos.length; i++) {
          const idProd = idProductos[i];
          const cantidad = cantidades[i];

          const productoRef = productosDocs[idProd].ref;
          const stockActual = productosDocs[idProd].data()?.stock || 0;
          const ajuste = nuevoEstadoDetalle ? cantidad : -cantidad;
          const nuevoStock = stockActual + ajuste;

          if (nuevoStock < 0) {
            throw new Error(`Stock insuficiente para el producto ${idProd}.`);
          }

          transaction.update(productoRef, { stock: nuevoStock });
        }

        transaction.update(ref, { estado: nuevoEstadoDetalle });
      }

      const estaActivo = nuevoEstadoDetalle ? true : estadoActual;
      if (estaActivo) {
        const totalParcial = subTotales.reduce((a, b) => a + b, 0);
        nuevoTotal += totalParcial;
      }
    }

    transaction.update(compraRef, {
      estado: nuevoEstadoCompra,
      total: nuevoTotal,
    });
  });
};

export const deleteCompraInFirestore = async (
  idCompra: string
): Promise<void> => {
  try {
    const compraRef = db.collection("compras").doc(idCompra);
    const compraDoc = await compraRef.get();

    if (!compraDoc.exists) {
      throw new Error("La compra no existe en Firestore.");
    }

    await compraRef.delete();
    console.log(`Compra con ID ${idCompra} eliminada correctamente.`);
  } catch (error) {
    throw new Error("Error al eliminar la compra: " + (error as Error).message);
  }
};

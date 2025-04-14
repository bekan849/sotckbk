import admin from "../config/firebase";

const db = admin.firestore();

interface DetalleVenta {
  idVenta: string;
  productos: {
    idProducto: string;
    cantidad: number;
    precioVenta: number;
    subTotal: number;
  }[];
  estado: boolean;
}

export const createDetalleVentaInFirestore = async (
  idVenta: string,
  productosSolicitados: { idProducto: string; cantidad: number; precioVenta: number }[]
): Promise<string> => {
  const detalleVentaRef = db.collection("detalleVenta").doc();
  const ventaRef = db.collection("ventas").doc(idVenta);

  try {
    await db.runTransaction(async (transaction) => {
      const ventaDoc = await transaction.get(ventaRef);
      if (!ventaDoc.exists) {
        throw new Error(`La venta con ID ${idVenta} no existe.`);
      }

      let totalVenta = 0;
      const productosProcesados: DetalleVenta["productos"] = [];

      const lecturasPEPS: {
        idProducto: string;
        cantidad: number;
        precioVenta: number;
        productoData: FirebaseFirestore.DocumentData;
        productoRef: FirebaseFirestore.DocumentReference;
        detalleConsumir: {
          detalleCompraRef: FirebaseFirestore.DocumentReference;
          index: number;
          cantidadDisponible: number;
          fechaIngreso: number;
          utilizadoArray: number[];
        }[];
      }[] = [];

      for (const { idProducto, cantidad, precioVenta } of productosSolicitados) {
        const productoRef = db.collection("productos").doc(idProducto);
        const productoDoc = await transaction.get(productoRef);
        if (!productoDoc.exists) throw new Error(`El producto ${idProducto} no existe.`);
        const productoData = productoDoc.data();
        if (!productoData?.estado) throw new Error(`El producto ${idProducto} está inactivo.`);

        const detallesSnap = await db
          .collection("detalleCompra")
          .where("idProductos", "array-contains", idProducto)
          .where("estado", "==", true)
          .get();

        const detallesValidos: {
          detalleCompraRef: FirebaseFirestore.DocumentReference;
          index: number;
          cantidadDisponible: number;
          fechaIngreso: number;
          utilizadoArray: number[];
        }[] = [];

        for (const doc of detallesSnap.docs) {
          const data = doc.data();
          const index = (data.idProductos as string[]).indexOf(idProducto);
          if (index === -1) continue;

          const cantidadTotal = data.cantidad?.[index] || 0;
          const utilizado = data.utilizado?.[index] || 0;
          const disponible = cantidadTotal - utilizado;
          if (disponible <= 0) continue;

          const compraRef = db.collection("compras").doc(data.idCompra);
          const compraDoc = await transaction.get(compraRef);
          const compraData = compraDoc.data();

          if (!compraData || !(compraData.fechaIngreso instanceof admin.firestore.Timestamp)) continue;

          detallesValidos.push({
            detalleCompraRef: doc.ref,
            index,
            cantidadDisponible: disponible,
            fechaIngreso: compraData.fechaIngreso.toMillis(),
            utilizadoArray: data.utilizado || [],
          });
        }

        detallesValidos.sort((a, b) => a.fechaIngreso - b.fechaIngreso);

        let restante = cantidad;
        const consumos: typeof detallesValidos = [];

        for (const det of detallesValidos) {
          if (restante <= 0) break;
          const aConsumir = Math.min(restante, det.cantidadDisponible);
          consumos.push({
            ...det,
            cantidadDisponible: aConsumir, 
          });
          restante -= aConsumir;
        }

        if (restante > 0) {
          throw new Error(`Stock insuficiente por método PEPS para el producto ${idProducto}.`);
        }

        lecturasPEPS.push({
          idProducto,
          cantidad,
          precioVenta,
          productoData,
          productoRef,
          detalleConsumir: consumos,
        });
      }

      for (const producto of lecturasPEPS) {
        const { idProducto, cantidad, precioVenta, productoData, productoRef, detalleConsumir } = producto;

        for (const { detalleCompraRef, index, cantidadDisponible, utilizadoArray } of detalleConsumir) {
          while (utilizadoArray.length <= index) utilizadoArray.push(0);
          utilizadoArray[index] += cantidadDisponible;

          transaction.update(detalleCompraRef, { utilizado: utilizadoArray });
        }

        const stockActual = productoData.stock || 0;
        if (stockActual < cantidad) {
          throw new Error(`Stock físico insuficiente para producto ${idProducto}.`);
        }

        transaction.update(productoRef, { stock: stockActual - cantidad });

        const subTotal = cantidad * precioVenta;
        totalVenta += subTotal;

        productosProcesados.push({ idProducto, cantidad, precioVenta, subTotal });
      }

      transaction.set(detalleVentaRef, {
        idVenta,
        productos: productosProcesados,
        estado: true,
      });

      const ventaData = ventaDoc.data();
      const totalActual = ventaData?.total || 0;
      transaction.update(ventaRef, { total: totalActual + totalVenta });
    });

    return detalleVentaRef.id;
  } catch (error) {
    throw new Error("Error al crear el detalle de venta: " + (error as Error).message);
  }
};


export const getDetallesVentaFromFirestore = async (): Promise<(DetalleVenta & { idDetalleVenta: string })[]> => {
  try {
    const detallesVentaSnapshot = await db.collection('detalleVenta').get();
    return detallesVentaSnapshot.docs.map(doc => ({ idDetalleVenta: doc.id, ...doc.data() } as DetalleVenta & { idDetalleVenta: string }));
  } catch (error) {
    throw new Error('Error al obtener los detalles de venta: ' + (error as Error).message);
  }
};


export const updateDetalleVentaInFirestore = async (
  idDetalleVenta: string,
  nuevosProductos: { idProducto: string; cantidad: number; precioVenta: number }[],
  idUsuario: string
): Promise<void> => {
  try {
    await db.runTransaction(async (transaction) => {
      const detalleRef = db.collection("detalleVenta").doc(idDetalleVenta);
      const detalleDoc = await transaction.get(detalleRef);

      if (!detalleDoc.exists) {
        throw new Error(`El detalle de venta con ID ${idDetalleVenta} no existe.`);
      }

      const detalleData = detalleDoc.data();
      if (!detalleData) {
        throw new Error(`Los datos del detalle de venta con ID ${idDetalleVenta} están vacíos o mal formateados.`);
      }
      const idVenta = detalleData.idVenta;
      

      const ventaRef = db.collection("ventas").doc(idVenta);
      const ventaDoc = await transaction.get(ventaRef);
      if (!ventaDoc.exists) {
        throw new Error(`La venta con ID ${idVenta} no existe.`);
      }

      const ventaData = ventaDoc.data();
      const fechaVenta = ventaData?.fechaVenta;
      const estadoVenta = ventaData?.estado;

      if (estadoVenta !== "pendiente" && estadoVenta !== "completada") {
        throw new Error("Solo se puede editar ventas en estado pendiente o completada.");
      }

      const ventaDate = new Date(fechaVenta);
      const today = new Date();
      const esMismoDia =
      ventaDate.toDateString() === today.toDateString();
      const usuarioRolSnap = await db
        .collection("usuarioRol")
        .where("idUsuario", "==", idUsuario)
        .where("estado", "==", true)
        .limit(1)
        .get();

      if (usuarioRolSnap.empty) {
        throw new Error("El usuario no tiene un rol asignado.");
      }

      const usuarioRolData = usuarioRolSnap.docs[0].data();
      const rolId = usuarioRolData.idRol;

      const rolDoc = await transaction.get(db.collection("roles").doc(rolId));
      if (!rolDoc.exists) {
        throw new Error("El rol asignado al usuario no existe.");
      }

      const nombreRol = rolDoc.data()?.nombre;
      if (!esMismoDia && nombreRol !== "Administrador") {
        throw new Error("Solo se puede editar esta venta el mismo día, salvo que sea Administrador.");
      }


      if (!esMismoDia && nombreRol !== "Administrador") {
        throw new Error("Solo se puede editar esta venta el mismo día, salvo que sea Administrador.");
      }

      const originales: Map<string, number> = new Map();
      for (const prod of detalleData.productos || []) {
        originales.set(prod.idProducto, prod.cantidad);
      }

      const nuevos: Map<string, { cantidad: number; precioVenta: number }> = new Map();
      for (const prod of nuevosProductos) {
        nuevos.set(prod.idProducto, {
          cantidad: prod.cantidad,
          precioVenta: prod.precioVenta,
        });
      }

      const idsProductos = new Set([...originales.keys(), ...nuevos.keys()]);
      const productosDocs = new Map<string, FirebaseFirestore.DocumentSnapshot>();

      for (const id of idsProductos) {
        const prodRef = db.collection("productos").doc(id);
        const prodDoc = await transaction.get(prodRef);
        if (!prodDoc.exists) {
          throw new Error(`El producto con ID ${id} no existe.`);
        }

        const prodData = prodDoc.data();
        if (!prodData?.estado) {
          throw new Error(`El producto con ID ${id} está inactivo y no puede venderse.`);
        }

        productosDocs.set(id, prodDoc);
      }

      let nuevoTotalDetalle = 0;
      const productosProcesados = [];

      for (const [id, datosNuevo] of nuevos.entries()) {
        const cantidadNueva = datosNuevo.cantidad;
        const precioVentaNuevo = datosNuevo.precioVenta;
        const cantidadOriginal = originales.get(id) || 0;
        const diferencia = cantidadNueva - cantidadOriginal;

        const productoDoc = productosDocs.get(id)!;
        const stockActual = productoDoc.data()?.stock || 0;
        const nuevoStock = stockActual - diferencia;

        if (nuevoStock < 0) {
          throw new Error(`Stock insuficiente para el producto ${id}.`);
        }

        transaction.update(productoDoc.ref, { stock: nuevoStock });

        const subTotal = cantidadNueva * precioVentaNuevo;
        nuevoTotalDetalle += subTotal;

        productosProcesados.push({
          idProducto: id,
          cantidad: cantidadNueva,
          precioVenta: precioVentaNuevo,
          subTotal,
        });
      }

      for (const [id, cantidadOriginal] of originales.entries()) {
        if (!nuevos.has(id)) {
          const productoDoc = productosDocs.get(id)!;
          const stockActual = productoDoc.data()?.stock || 0;
          const nuevoStock = stockActual + cantidadOriginal;
          transaction.update(productoDoc.ref, { stock: nuevoStock });
        }
      }

      transaction.update(detalleRef, {
        productos: productosProcesados,
      });

      const detallesSnap = await db
        .collection("detalleVenta")
        .where("idVenta", "==", idVenta)
        .get();

      let totalFinal = 0;
      for (const doc of detallesSnap.docs) {
        if (doc.id === idDetalleVenta) {
          totalFinal += nuevoTotalDetalle;
        } else {
          const data = doc.data();
          if (data.estado) {
            totalFinal += (data.productos || []).reduce((acc: number, p: any) => acc + p.subTotal, 0);
          }
        }
      }

      transaction.update(ventaRef, { total: totalFinal });
    });
  } catch (error) {
    throw new Error("Error al actualizar el detalle de venta: " + (error as Error).message);
  }
};

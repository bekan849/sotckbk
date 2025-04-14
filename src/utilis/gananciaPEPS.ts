import admin from "../config/firebase";

const db = admin.firestore();

const formatearFecha = (fecha: Date): string => {
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const calcularGananciaDelDia = async (): Promise<{ gananciaTotal: number; fecha: string }> => {
  const hoy = new Date();
  const fechaActual = formatearFecha(hoy);

  let gananciaTotal = 0;

  const ventasSnapshot = await db
    .collection("ventas")
    .where("estado", "==", "completada")
    .get();

  const detalleVentaSnapshot = await db.collection("detalleVenta").get();

  const ventasDelDia = ventasSnapshot.docs.filter((venta) => {
    const fechaVentaTimestamp = venta.data().fechaVenta;
    if (!(fechaVentaTimestamp instanceof admin.firestore.Timestamp)) return false;

    const fechaVenta = fechaVentaTimestamp.toDate();
    return formatearFecha(fechaVenta) === fechaActual;
  });

  const detallesVentaDelDia = detalleVentaSnapshot.docs.filter((detalle) => {
    const ventaId = detalle.data().idVenta;
    return ventasDelDia.some((v) => v.id === ventaId);
  });

  const comprasSnap = await db
    .collection("compras")
    .where("estado", "==", "completada")
    .orderBy("fechaIngreso", "asc")
    .get();

  const detalleCompraSnap = await db.collection("detalleCompra").get();

  const stockPEPS: Record<string, { cantidad: number; precioCompra: number }[]> = {};

  for (const compra of comprasSnap.docs) {
    const idCompra = compra.id;
    const detalles = detalleCompraSnap.docs.filter(
      (doc) => doc.data().idCompra === idCompra && doc.data().estado === true
    );

    for (const det of detalles) {
      const data = det.data();
      const ids = data.idProductos as string[];
      const cantidades = data.cantidad as number[];
      const preciosCompra = data.precioCosto as number[];

      ids.forEach((idProd, i) => {
        if (!stockPEPS[idProd]) stockPEPS[idProd] = [];
        stockPEPS[idProd].push({
          cantidad: cantidades[i],
          precioCompra: preciosCompra[i],
        });
      });
    }
  }

  for (const detalle of detallesVentaDelDia) {
    const data = detalle.data();
    const productos = data.productos as {
      idProducto: string;
      cantidad: number;
      precioVenta: number;
      subTotal: number;
    }[];

    for (const p of productos) {
      const { idProducto, cantidad, precioVenta } = p;
      let cantidadRestante = cantidad;

      const lotes = stockPEPS[idProducto];
      if (!lotes) continue;

      for (const lote of lotes) {
        if (cantidadRestante <= 0) break;

        const cantidadConsumir = Math.min(lote.cantidad, cantidadRestante);
        const gananciaPorUnidad = precioVenta - lote.precioCompra;
        gananciaTotal += cantidadConsumir * gananciaPorUnidad;

        lote.cantidad -= cantidadConsumir;
        cantidadRestante -= cantidadConsumir;
      }
    }
  }

  return {
    gananciaTotal,
    fecha: `${hoy.getDate()}/${hoy.getMonth() + 1}/${hoy.getFullYear()}`
  };
};

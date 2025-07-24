import admin from "../config/firebase";

const db = admin.firestore();

const formatearFecha = (fecha: Date): string => {
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export interface ResumenDia {
  fecha: string;
  ventasCount: number;
  totalVendido: number;
  gananciaTotal: number;
}

export const calcularResumenDelDia = async (): Promise<ResumenDia> => {
  const hoy = new Date();
  const fechaActual = formatearFecha(hoy);

  const ventasSnap = await db
    .collection("ventas")
    .where("estado", "==", "completada")
    .get();

  const ventasDelDia = ventasSnap.docs.filter((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const ts = doc.data().fechaVenta;
    if (!(ts instanceof admin.firestore.Timestamp)) return false;
    const fechaVenta = ts.toDate();
    return formatearFecha(fechaVenta) === fechaActual;
  });

  const ventasCount = ventasDelDia.length;

  const totalVendido = ventasDelDia.reduce((sum: number, doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const t = doc.data().total;
    return sum + (typeof t === "number" ? t : 0);
  }, 0);

  const detalleVentaSnap = await db.collection("detalleVenta").get();
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
      (d: FirebaseFirestore.QueryDocumentSnapshot) =>
        d.data().idCompra === idCompra && d.data().estado === true
    );

    for (const det of detalles) {
      const { idProductos, cantidad, precioCosto } = det.data() as {
        idProductos: string[];
        cantidad: number[];
        precioCosto: number[];
      };

      idProductos.forEach((id: string, i: number) => {
        if (!stockPEPS[id]) stockPEPS[id] = [];
        stockPEPS[id].push({
          cantidad: cantidad[i],
          precioCompra: precioCosto[i],
        });
      });
    }
  }

  let gananciaTotal = 0;

  for (const ventaDoc of ventasDelDia) {
    const ventaId = ventaDoc.id;
    const detalle = detalleVentaSnap.docs.find(
      (d: FirebaseFirestore.QueryDocumentSnapshot) => d.data().idVenta === ventaId
    );

    if (!detalle) continue;

    const productos = (detalle.data().productos as {
      idProducto: string;
      cantidad: number;
      precioVenta: number;
    }[]) || [];

    for (const { idProducto, cantidad, precioVenta } of productos) {
      let restante = cantidad;
      const lotes = stockPEPS[idProducto] || [];
      for (const lote of lotes) {
        if (restante <= 0) break;
        const usar = Math.min(restante, lote.cantidad);
        gananciaTotal += usar * (precioVenta - lote.precioCompra);
        lote.cantidad -= usar;
        restante -= usar;
      }
    }
  }

  return {
    fecha: `${hoy.getDate()}/${hoy.getMonth() + 1}/${hoy.getFullYear()}`,
    ventasCount,
    totalVendido,
    gananciaTotal,
  };
};

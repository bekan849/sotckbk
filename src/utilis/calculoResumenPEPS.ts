import admin from "../config/firebase";
import { agruparPorPeriodo } from "./agruparPorPeriodo";

const db = admin.firestore();

export const calcularResumenPorTipo = async (tipo: "dia" | "semana" | "mes" | "anio") => {
  const ventasSnap = await db.collection("ventas").where("estado", "==", "completada").get();
  const detalleVentaSnap = await db.collection("detalleVenta").get();
  const comprasSnap = await db.collection("compras").where("estado", "==", "completada").orderBy("fechaIngreso", "asc").get();
  const detalleCompraSnap = await db.collection("detalleCompra").get();

  const stockPEPS: Record<string, { cantidad: number; precioCompra: number }[]> = {};

  for (const compra of comprasSnap.docs) {
    const idCompra = compra.id;
    const detalles = detalleCompraSnap.docs.filter((doc) => doc.data().idCompra === idCompra && doc.data().estado);

    for (const det of detalles) {
      const { idProductos, cantidad, precioCosto } = det.data();
      idProductos.forEach((id: string, i: number) => {
        if (!stockPEPS[id]) stockPEPS[id] = [];
        stockPEPS[id].push({ cantidad: cantidad[i], precioCompra: precioCosto[i] });
      });
    }
  }

  const resumen: Record<string, { total: number; ganancia: number }> = {};

  for (const ventaDoc of ventasSnap.docs) {
    const venta = ventaDoc.data();
    const ventaId = ventaDoc.id;
    const fechaFirestore = venta.fechaVenta;
    const fecha = (fechaFirestore instanceof admin.firestore.Timestamp)
      ? fechaFirestore.toDate()
      : new Date(fechaFirestore);
    
    if (isNaN(fecha.getTime())) continue;
    

    const totalVenta = venta.total;
    let gananciaVenta = 0;

    const detalle = detalleVentaSnap.docs.find((doc) => doc.data().idVenta === ventaId);
    if (detalle) {
      for (const { idProducto, cantidad, precioVenta } of detalle.data().productos) {
        let restante = cantidad;
        const lotes = stockPEPS[idProducto];
        if (!lotes) continue;

        for (const lote of lotes) {
          if (restante <= 0) break;
          const usar = Math.min(restante, lote.cantidad);
          gananciaVenta += usar * (precioVenta - lote.precioCompra);
          lote.cantidad -= usar;
          restante -= usar;
        }
      }
    }

    const periodo = agruparPorPeriodo(fecha, tipo);
    if (!resumen[periodo]) resumen[periodo] = { total: 0, ganancia: 0 };
    resumen[periodo].total += totalVenta;
    resumen[periodo].ganancia += gananciaVenta;
  }

  return { tipo, resumen };
};

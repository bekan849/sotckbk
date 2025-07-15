import admin from "../config/firebase";
import { agruparPorPeriodo } from "./agruparPorPeriodo";
import { esDelPeriodo } from "./agruparPorPeriodo";
import { toZonedTime } from "date-fns-tz";

const ZONA_HORARIA = "America/La_Paz";
const db = admin.firestore();

const MESES: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3,
  mayo: 4, junio: 5, julio: 6, agosto: 7,
  septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

export const calcularResumenPorTipo = async (
  tipo: "dia" | "semana" | "mes" | "anio",
  periodoStr?: string
) => {
  let compararCon = new Date(); // Valor por defecto: ahora

  if (periodoStr) {
    try {
      if (tipo === "mes") {
        const [mesTexto, anioTexto] = periodoStr.toLowerCase().split("-");
        const mes = MESES[mesTexto];

        if (mes === undefined) throw new Error("Mes inválido");

        const anio = anioTexto ? parseInt(anioTexto) : new Date().getFullYear();
        compararCon = new Date(anio, mes, 1);
      } else if (tipo === "anio") {
        const anio = parseInt(periodoStr);
        if (isNaN(anio)) throw new Error("Año inválido");
        compararCon = new Date(anio, 0, 1);
      } else {
if (tipo === "dia" || tipo === "semana") {
  compararCon = toZonedTime(`${periodoStr}T00:00:00`, ZONA_HORARIA);
}      }
    } catch (err) {
      console.warn("Periodo no válido:", err);
      // Dejar compararCon como fecha actual si el formato no es válido
    }
  }

  const ventasSnap = await db
    .collection("ventas")
    .where("estado", "==", "completada")
    .get();

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
      (doc) =>
        doc.data().idCompra === idCompra &&
        doc.data().estado
    );

    for (const det of detalles) {
      const { idProductos, cantidad, precioCosto } = det.data();

      idProductos.forEach((id: string, i: number) => {
        if (!stockPEPS[id]) stockPEPS[id] = [];
        stockPEPS[id].push({
          cantidad: cantidad[i],
          precioCompra: precioCosto[i],
        });
      });
    }
  }

  const resumen: Record<string, { total: number; ganancia: number }> = {};

  for (const ventaDoc of ventasSnap.docs) {
    const venta = ventaDoc.data();
    const ventaId = ventaDoc.id;
    const fechaFirestore = venta.fechaVenta;

    const fecha = fechaFirestore instanceof admin.firestore.Timestamp
      ? fechaFirestore.toDate()
      : new Date(fechaFirestore);

    if (isNaN(fecha.getTime())) continue;
    if (!esDelPeriodo(fecha, tipo, compararCon)) continue;

    const totalVenta = venta.total;
    let gananciaVenta = 0;

    const detalle = detalleVentaSnap.docs.find(
      (doc) => doc.data().idVenta === ventaId
    );

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

    const clavePeriodo = agruparPorPeriodo(fecha, tipo);

    if (!resumen[clavePeriodo]) {
      resumen[clavePeriodo] = { total: 0, ganancia: 0 };
    }

    resumen[clavePeriodo].total += totalVenta;
    resumen[clavePeriodo].ganancia += gananciaVenta;
  }

  return { tipo, resumen };
};

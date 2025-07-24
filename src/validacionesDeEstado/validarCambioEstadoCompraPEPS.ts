import admin from "../config/firebase";

const db = admin.firestore();

export const validarCambioEstadoCompraPEPS = async (idCompra: string): Promise<void> => {
  const compraRef = db.collection("compras").doc(idCompra);
  const compraDoc = await compraRef.get();

  if (!compraDoc.exists) {
    throw new Error("La compra no existe.");
  }

  const compraData = compraDoc.data();
  if (compraData?.estado !== "completada") {
    return;
  }

  const detallesSnapshot = await db
    .collection("detalleCompra")
    .where("idCompra", "==", idCompra)
    .get();

  if (detallesSnapshot.empty) {
    return;
  }

  const productosAValidar: { idProducto: string; cantidad: number }[] = [];

  detallesSnapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
    const detalle = doc.data();
    detalle.idProductos.forEach((idProd: string, i: number) => {
      productosAValidar.push({
        idProducto: idProd,
        cantidad: detalle.cantidad[i]
      });
    });
  });

  for (const { idProducto, cantidad } of productosAValidar) {
    const comprasSnap = await db
      .collection("compras")
      .where("estado", "==", "completada")
      .orderBy("fechaIngreso", "asc")
      .get();

    const comprasPEPS: { idCompra: string; cantidad: number }[] = [];

    for (const compDoc of comprasSnap.docs) {
      const compId = compDoc.id;
      const detalleSnap = await db
        .collection("detalleCompra")
        .where("idCompra", "==", compId)
        .get();

      detalleSnap.docs.forEach((d: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = d.data();
        data.idProductos.forEach((id: string, i: number) => {
          if (id === idProducto) {
            comprasPEPS.push({ idCompra: compId, cantidad: data.cantidad[i] });
          }
        });
      });
    }

    const ventasSnap = await db.collection("detalleVenta").get();

    const ventas = ventasSnap.docs
      .map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data())
      .filter((v: any) => v.estado === true)
      .flatMap((v: any) =>
        v.productos.filter((p: any) => p.idProducto === idProducto)
      );

    let ventasPendientes = ventas.reduce((acc: number, v: any) => acc + v.cantidad, 0);

    for (const item of comprasPEPS) {
      if (ventasPendientes === 0) break;

      const usados = Math.min(ventasPendientes, item.cantidad);
      ventasPendientes -= usados;

      if (item.idCompra === idCompra && usados > 0) {
        throw new Error(
          `No se puede cambiar el estado: ya se han vendido ${usados} unidad(es) del producto ${idProducto} provenientes de esta compra.`
        );
      }
    }
  }
};

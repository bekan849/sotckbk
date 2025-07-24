import admin from "../config/firebase";

const db = admin.firestore();

export interface DetalleCompra {
  idCompra: string;
  idProductos: string[];
  cantidad: number[];
  precioCosto: number[];
  precioVenta: number[];
  subTotal: number[];
  utilizado: number[];
  estado: boolean;
  idDetalleCompra?: string;
}

const validarDetalleCompra = (
  idCompra: string,
  idProductos: string[],
  cantidad: number[],
  precioCosto: number[],
  precioVenta: number[]
): void => {
  if (!idCompra || typeof idCompra !== "string" || !idCompra.trim()) {
    throw new Error("El ID de la compra es obligatorio y debe ser válido.");
  }
  const arrays = [idProductos, cantidad, precioCosto, precioVenta];
  if (!arrays.every(Array.isArray)) {
    throw new Error("Todos los campos deben ser arreglos.");
  }
  const len = idProductos.length;
  if (
    ![cantidad, precioCosto, precioVenta].every((arr) => arr.length === len)
  ) {
    throw new Error("Todos los arreglos deben tener la misma longitud.");
  }
  for (let i = 0; i < len; i++) {
    if (!idProductos[i] || typeof idProductos[i] !== "string") {
      throw new Error(`ID de producto inválido en posición ${i}.`);
    }
    if (cantidad[i] <= 0 || precioCosto[i] <= 0 || precioVenta[i] <= 0) {
      throw new Error(
        `Valores numéricos deben ser mayores a 0 para el producto ${idProductos[i]}.`
      );
    }
    if (precioVenta[i] < precioCosto[i]) {
      throw new Error(
        `El precio de venta no puede ser menor al costo para el producto ${idProductos[i]}.`
      );
    }
  }
};

export const createDetalleCompraInFirestore = async (
  idCompra: string,
  idProductos: string[],
  cantidad: number[],
  precioCosto: number[],
  precioVenta: number[]
): Promise<string> => {
  validarDetalleCompra(
    idCompra,
    idProductos,
    cantidad,
    precioCosto,
    precioVenta
  );

  const subTotal = cantidad.map((cant, i) => cant * precioCosto[i]);
  const totalCompra = subTotal.reduce((acc, val) => acc + val, 0);
  const utilizado = cantidad.map(() => 0);

  const detalleRef = db.collection("detalleCompra").doc();
  const compraRef = db.collection("compras").doc(idCompra);

  await db.runTransaction(async (tx) => {
    const productosSnap: admin.firestore.DocumentSnapshot[] = [];
    const productosRef = idProductos.map((id) =>
      db.collection("productos").doc(id)
    );

    for (let ref of productosRef) {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error(`Producto no encontrado: ${ref.id}`);
      productosSnap.push(snap);
    }

    for (let i = 0; i < productosSnap.length; i++) {
      const data = productosSnap[i].data();
      const stockActual = data?.stock || 0;
      tx.update(productosRef[i], { stock: stockActual + cantidad[i] });
    }

    tx.set(detalleRef, {
      idCompra,
      idProductos,
      cantidad,
      precioCosto,
      precioVenta,
      subTotal,
      utilizado,
      estado: true,
    });

    tx.update(compraRef, { total: totalCompra });
  });

  return detalleRef.id;
};

export const getDetallesCompraFromFirestore = async (): Promise<
  (DetalleCompra & { idDetalleCompra: string })[]
> => {
  const snapshot = await db.collection("detalleCompra").get();
  return snapshot.docs.map((doc) => ({
    idDetalleCompra: doc.id,
    ...(doc.data() as DetalleCompra),
  }));
};
export const updateDetalleCompraInFirestore = async (
  idDetalleCompra: string,
  idProductos: string[],
  cantidad: number[],
  precioCosto: number[],
  precioVenta: number[]
): Promise<void> => {
  const detalleRef = db.collection("detalleCompra").doc(idDetalleCompra);
  const detalleSnap = await detalleRef.get();
  if (!detalleSnap.exists) throw new Error("El detalle de compra no existe.");

  const detallePrevio = detalleSnap.data() as DetalleCompra;
  const idCompra = detallePrevio.idCompra;

  validarDetalleCompra(idCompra, idProductos, cantidad, precioCosto, precioVenta);

  const subTotal = cantidad.map((cant, i) => cant * precioCosto[i]);
  const totalCompra = subTotal.reduce((acc, val) => acc + val, 0);
  const utilizado = cantidad.map(() => 0);

  const compraRef = db.collection("compras").doc(idCompra);

  const productoRefsActuales = idProductos.map((id) =>
    db.collection("productos").doc(id)
  );

  const productosEliminados = detallePrevio.idProductos.filter(
    (idAnt) => !idProductos.includes(idAnt)
  );
  const productoRefsEliminados = productosEliminados.map((id) =>
    db.collection("productos").doc(id)
  );

  await db.runTransaction(async (tx) => {
    const productoSnapsActuales = await Promise.all(
      productoRefsActuales.map((ref) => tx.get(ref))
    );
    const productoSnapsEliminados = await Promise.all(
      productoRefsEliminados.map((ref) => tx.get(ref))
    );

    for (let i = 0; i < productoSnapsActuales.length; i++) {
      if (!productoSnapsActuales[i].exists)
        throw new Error(`Producto no encontrado: ${idProductos[i]}`);
    }

    const estabaActivaAntes = detallePrevio.estado === true;

    // 🔁 ACTUALIZAR productos actuales (modificados o nuevos)
    for (let i = 0; i < productoRefsActuales.length; i++) {
      const ref = productoRefsActuales[i];
      const snap = productoSnapsActuales[i];
      const data = snap.data() || {};
      const stockActual = data.stock || 0;

      const indexPrevio = detallePrevio.idProductos.findIndex(
        (id) => id === idProductos[i]
      );
      const cantidadPrev = indexPrevio !== -1 ? detallePrevio.cantidad[indexPrevio] : 0;

      let ajusteStock = 0;

      if (estabaActivaAntes) {
        // si estaba completada antes → usar diferencia
        ajusteStock = cantidad[i] - cantidadPrev;
      } else {
        // si estaba cancelada o pendiente → sumar toda la nueva cantidad
        ajusteStock = cantidad[i];
      }

      tx.update(ref, { stock: stockActual + ajusteStock });
    }

    // 🔁 REVERTIR stock de productos eliminados (solo si estaba activa)
    if (estabaActivaAntes) {
      for (let i = 0; i < productosEliminados.length; i++) {
        const ref = productoRefsEliminados[i];
        const snap = productoSnapsEliminados[i];
        const data = snap.data() || {};
        const stockActual = data.stock || 0;

        const indexPrevio = detallePrevio.idProductos.findIndex(
          (id) => id === productosEliminados[i]
        );
        const cantidadPrev = detallePrevio.cantidad[indexPrevio] || 0;

        tx.update(ref, { stock: stockActual - cantidadPrev });
      }
    }

    // 🔁 Actualizar el detalle y la compra
    tx.update(detalleRef, {
      idProductos,
      cantidad,
      precioCosto,
      precioVenta,
      subTotal,
      utilizado,
      estado: true,
    });

    tx.update(compraRef, { total: totalCompra });
  });
};

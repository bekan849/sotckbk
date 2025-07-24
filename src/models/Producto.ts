import admin from "../config/firebase";

const db = admin.firestore();

export interface Producto {
  codigoProd: string;
  nombre: string;
  descripcion: string;
  stock: number;
  estado: boolean;
  idCategoria: string;
  idMarca: string;
  imagen: string;
  idProducto?: string;
}

const generateCodigoProducto = async (
  nombre: string,
  idMarca: string
): Promise<string> => {
  const counterDocRef = db.collection("counters").doc("productCounter");

  const newNumber = await db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterDocRef);
    let currentNumber = 0;
    if (!counterDoc.exists) {
      currentNumber = 1;
      transaction.set(counterDocRef, { count: currentNumber });
    } else {
      const data = counterDoc.data();
      currentNumber = (data && data.count ? data.count : 0) + 1;
      transaction.update(counterDocRef, { count: currentNumber });
    }
    return currentNumber;
  });

  const nombrePart = nombre.trim().substring(0, 3).toUpperCase();
  const marcaPart = idMarca.trim().substring(0, 3).toUpperCase();
  const numeroPart = String(newNumber).padStart(3, "0");

  return `${nombrePart}-${marcaPart}-${numeroPart}`;
};

const validarProducto = (
  nombre: string,
  descripcion: string,
  stock: number,
  estado: boolean,
  idCategoria: string,
  idMarca: string,
  imagen: string
): string | null => {
  if (!nombre || nombre.trim().length < 3 || nombre.length > 100)
    return "El nombre es obligatorio y debe tener entre 3 y 100 caracteres.";
  if (!descripcion || descripcion.trim().length < 5)
    return "La descripción es obligatoria.";
  if (stock < 0) return "El stock no puede ser negativo.";
  if (typeof estado !== "boolean") return "El estado debe ser booleano.";
  if (!idCategoria || !idMarca)
    return "Los IDs de categoría y marca son obligatorios.";
  if (
    !imagen ||
    !/^https?:\/\/.+\.(jpg|jpeg|png|gif|bmp)$/i.test(imagen)
  )
    return "La URL de la imagen es obligatoria y debe ser válida.";
  return null;
};

export const createProductoInFirestore = async (
  nombre: string,
  descripcion: string,
  stock: number,
  estado: boolean,
  idCategoria: string,
  idMarca: string,
  imagen: string
): Promise<void> => {
  try {
    const error = validarProducto(
      nombre,
      descripcion,
      stock,
      estado,
      idCategoria,
      idMarca,
      imagen
    );
    if (error) throw new Error(error);

    const codigoProd = await generateCodigoProducto(nombre, idMarca);

    const productoData: Producto = {
      codigoProd,
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      stock,
      estado,
      idCategoria: idCategoria.trim(),
      idMarca: idMarca.trim(),
      imagen: imagen.trim(),
    };

    const productoRef = db.collection("productos").doc();
    await productoRef.set(productoData);
  } catch (error) {
    throw new Error("Error al crear el producto: " + (error as Error).message);
  }
};

export const getProductosFromFirestore = async (): Promise<
  (Producto & { idProducto: string })[]
> => {
  try {
    const snapshot = await db
      .collection("productos")
      .select(
        "codigoProd",
        "nombre",
        "descripcion",
        "stock",
        "estado",
        "idCategoria",
        "idMarca",
        "imagen"
      )
      .get();

    return snapshot.docs.map((doc) => ({
      idProducto: doc.id,
      ...(doc.data() as Omit<Producto, "idProducto">),
    }));
  } catch (error) {
    throw new Error(
      "Error al obtener los productos: " + (error as Error).message
    );
  }
};

export const updateProductoInFirestore = async (
  idProducto: string,
  nombre: string,
  descripcion: string,
  stock: number,
  estado: boolean,
  idCategoria: string,
  idMarca: string,
  imagen: string
): Promise<void> => {
  try {
    const error = validarProducto(
      nombre,
      descripcion,
      stock,
      estado,
      idCategoria,
      idMarca,
      imagen
    );
    if (error) throw new Error(error);

    const productoRef = db.collection("productos").doc(idProducto);
    await productoRef.update({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      stock,
      estado,
      idCategoria: idCategoria.trim(),
      idMarca: idMarca.trim(),
      imagen: imagen.trim(),
    });
  } catch (error) {
    throw new Error(
      "Error al actualizar el producto: " + (error as Error).message
    );
  }
};

export const cambiarEstadoProductoInFirestore = async (
  idProducto: string,
  estado: boolean
): Promise<void> => {
  try {
    if (typeof estado !== "boolean") {
      throw new Error("El estado debe ser true o false.");
    }
    const productoRef = db.collection("productos").doc(idProducto);
    await productoRef.update({ estado });
  } catch (error) {
    throw new Error(
      "Error al cambiar el estado del producto: " + (error as Error).message
    );
  }
};

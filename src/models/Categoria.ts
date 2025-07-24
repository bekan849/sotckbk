import admin from "../config/firebase";

const db = admin.firestore();

interface Categoria {
  nombre: string;
  estado: boolean;
  idCategoria?: string;
}

const esNombreCategoriaDuplicado = async (
  nombre: string,
  excluirId?: string
): Promise<boolean> => {
  const nombreUpper = nombre.trim().toUpperCase();
  const querySnapshot = await db
    .collection("categorias")
    .where("nombre", "==", nombreUpper)
    .get();

  return querySnapshot.docs.some((doc) => doc.id !== excluirId);
};

const validarCategoria = (nombre: string): string | null => {
  if (!nombre || nombre.trim().length < 3) {
    return "El nombre de la categoría es obligatorio y debe tener al menos 3 caracteres.";
  }
  if (nombre.trim().length > 50) {
    return "El nombre de la categoría no puede exceder los 50 caracteres.";
  }
  return null;
};

export const createCategoriaInFirestore = async (
  nombre: string,
  estado: boolean
): Promise<void> => {
  try {
    const error = validarCategoria(nombre);
    if (error) throw new Error(error);

    const duplicado = await esNombreCategoriaDuplicado(nombre);
    if (duplicado) {
      throw new Error("Ya existe una categoría con ese nombre.");
    }

    const categoriaRef = db.collection("categorias").doc();
    const categoriaData: Categoria = {
      nombre: nombre.trim().toUpperCase(),
      estado,
    };

    await categoriaRef.set(categoriaData);
  } catch (error) {
    throw new Error("Error al crear la categoría: " + (error as Error).message);
  }
};

export const getCategoriasFromFirestore = async (): Promise<Categoria[]> => {
  try {
    const snapshot = await db
      .collection("categorias")
      .select("nombre", "estado")
      .get();

    return snapshot.docs.map((doc) => ({
      idCategoria: doc.id,
      ...(doc.data() as Categoria),
    }));
  } catch (error) {
    throw new Error("Error al obtener las categorías: " + (error as Error).message);
  }
};

export const updateCategoriaInFirestore = async (
  idCategoria: string,
  nombre: string,
  estado: boolean
): Promise<void> => {
  try {
    const error = validarCategoria(nombre);
    if (error) throw new Error(error);

    const duplicado = await esNombreCategoriaDuplicado(nombre, idCategoria);
    if (duplicado) {
      throw new Error("Ya existe otra categoría con ese nombre.");
    }

    const categoriaRef = db.collection("categorias").doc(idCategoria);
    await categoriaRef.update({
      nombre: nombre.trim().toUpperCase(),
      estado,
    });
  } catch (error) {
    throw new Error("Error al actualizar la categoría: " + (error as Error).message);
  }
};

export const cambiarEstadoCategoriaInFirestore = async (
  idCategoria: string,
  estado: boolean
): Promise<void> => {
  try {
    const categoriaRef = db.collection("categorias").doc(idCategoria);
    await categoriaRef.update({ estado });
  } catch (error) {
    throw new Error("Error al cambiar el estado de la categoría: " + (error as Error).message);
  }
};

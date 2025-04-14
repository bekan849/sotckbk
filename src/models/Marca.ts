import admin from "../config/firebase";

const db = admin.firestore();

export interface Marca {
  nombre: string;
  estado: boolean;
  idMarca?: string;
}

const validarMarca = (nombre: string): string | null => {
  if (!nombre || nombre.trim().length < 3) {
    return "El nombre de la marca debe tener al menos 3 caracteres.";
  }
  if (nombre.trim().length > 50) {
    return "El nombre de la marca no puede exceder los 50 caracteres.";
  }
  return null;
};

const esNombreMarcaDuplicado = async (
  nombre: string,
  excluirId?: string
): Promise<boolean> => {
  const normalizado = nombre.trim().toLowerCase();
  const snapshot = await db
    .collection("marcas")
    .where("nombre", "==", normalizado)
    .get();

  return snapshot.docs.some((doc) => doc.id !== excluirId);
};

export const createMarcaInFirestore = async (
  nombre: string,
  estado: boolean
): Promise<void> => {
  try {
    const error = validarMarca(nombre);
    if (error) throw new Error(error);

    const duplicado = await esNombreMarcaDuplicado(nombre);
    if (duplicado) throw new Error("Ya existe una marca con ese nombre.");

    const marcaData: Marca = {
      nombre: nombre.trim().toLowerCase(),
      estado,
    };

    await db.collection("marcas").add(marcaData);
  } catch (error) {
    throw new Error("Error al crear la marca: " + (error as Error).message);
  }
};

export const getMarcasFromFirestore = async (): Promise<Marca[]> => {
  try {
    const snapshot = await db
      .collection("marcas")
      .select("nombre", "estado")
      .get();

    return snapshot.docs.map((doc) => ({
      idMarca: doc.id,
      ...(doc.data() as Marca),
    }));
  } catch (error) {
    throw new Error("Error al obtener las marcas: " + (error as Error).message);
  }
};

export const updateMarcaInFirestore = async (
  idMarca: string,
  nombre: string,
  estado: boolean
): Promise<void> => {
  try {
    const error = validarMarca(nombre);
    if (error) throw new Error(error);

    const duplicado = await esNombreMarcaDuplicado(nombre, idMarca);
    if (duplicado) throw new Error("Ya existe otra marca con ese nombre.");

    await db.collection("marcas").doc(idMarca).update({
      nombre: nombre.trim().toLowerCase(),
      estado,
    });
  } catch (error) {
    throw new Error("Error al actualizar la marca: " + (error as Error).message);
  }
};

export const cambiarEstadoMarcaInFirestore = async (
  idMarca: string,
  estado: boolean
): Promise<void> => {
  try {
    if (typeof estado !== "boolean") {
      throw new Error("El estado debe ser true o false.");
    }

    await db.collection("marcas").doc(idMarca).update({ estado });
  } catch (error) {
    throw new Error("Error al cambiar el estado de la marca: " + (error as Error).message);
  }
};

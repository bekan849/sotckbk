import admin from "../config/firebase";

const db = admin.firestore();

export interface Rol {
  nombre: string;
  estado: boolean;
  idRol?: string;
}

const validarRol = (nombre: string, estado: boolean): void => {
  if (!nombre || nombre.trim().length < 3) {
    throw new Error("El nombre del rol es obligatorio y debe tener al menos 3 caracteres.");
  }
  if (nombre.trim().length > 50) {
    throw new Error("El nombre del rol no puede exceder los 50 caracteres.");
  }
  if (typeof estado !== "boolean") {
    throw new Error("El estado debe ser un valor booleano (true o false).");
  }
};

export const createRolInFirestore = async (
  nombre: string,
  estado: boolean
): Promise<void> => {
  try {
    validarRol(nombre, estado);

    const rolRef = db.collection("roles").doc();
    const rolData: Rol = {
      nombre: nombre.trim().toLowerCase(),
      estado,
    };

    await rolRef.set(rolData);
  } catch (error) {
    throw new Error("Error al crear el rol: " + (error as Error).message);
  }
};

export const getRolesFromFirestore = async (): Promise<Rol[]> => {
  try {
    const snapshot = await db
      .collection("roles")
      .select("nombre", "estado")
      .get();

    return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({
      idRol: doc.id,
      ...(doc.data() as Omit<Rol, "idRol">),
    }));
  } catch (error) {
    throw new Error("Error al obtener los roles: " + (error as Error).message);
  }
};

export const updateRolInFirestore = async (
  idRol: string,
  nombre: string,
  estado: boolean
): Promise<void> => {
  try {
    validarRol(nombre, estado);

    const rolRef = db.collection("roles").doc(idRol);
    await rolRef.update({
      nombre: nombre.trim().toLowerCase(),
      estado,
    });
  } catch (error) {
    throw new Error("Error al actualizar el rol: " + (error as Error).message);
  }
};

export const cambiarEstadoRolInFirestore = async (
  idRol: string,
  estado: boolean
): Promise<void> => {
  try {
    if (typeof estado !== "boolean") {
      throw new Error("El estado debe ser un valor booleano (true o false).");
    }

    const rolRef = db.collection("roles").doc(idRol);
    await rolRef.update({ estado });
  } catch (error) {
    throw new Error("Error al cambiar el estado del rol: " + (error as Error).message);
  }
};

export const getRolByIdFromFirestore = async (
  idRol: string
): Promise<Rol | null> => {
  try {
    const doc = await db.collection("roles").doc(idRol).get();

    if (!doc.exists) return null;

    return {
      idRol: doc.id,
      ...(doc.data() as Omit<Rol, "idRol">),
    };
  } catch (error) {
    throw new Error("Error al obtener el rol por ID: " + (error as Error).message);
  }
};

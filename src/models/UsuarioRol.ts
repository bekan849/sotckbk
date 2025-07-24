import admin from "../config/firebase";

const db = admin.firestore();

interface UsuarioRolDB {
  idUsuario: string;
  idRol: string;
  fechaAsigna: admin.firestore.Timestamp;
  estado: boolean;
}

export interface UsuarioRol {
  idUsuarioRol?: string;
  idUsuario: string;
  idRol: string;
  fechaAsigna: string;
  estado: boolean;
}

const validarUsuarioRol = (
  idUsuario: string,
  idRol: string,
  estado: boolean
): void => {
  if (!idUsuario || typeof idUsuario !== "string" || !idUsuario.trim()) {
    throw new Error("El ID del usuario es obligatorio y debe ser válido.");
  }
  if (!idRol || typeof idRol !== "string" || !idRol.trim()) {
    throw new Error("El ID del rol es obligatorio y debe ser válido.");
  }
  if (typeof estado !== "boolean") {
    throw new Error("El estado debe ser un valor booleano.");
  }
};

export const createUsuarioRolInFirestore = async (
  idUsuario: string,
  idRol: string,
  estado: boolean
): Promise<void> => {
  try {
    validarUsuarioRol(idUsuario, idRol, estado);

    const usuarioRolData: UsuarioRolDB = {
      idUsuario: idUsuario.trim(),
      idRol: idRol.trim(),
      fechaAsigna: admin.firestore.Timestamp.now(),
      estado,
    };

    await db.collection("usuarioRol").add(usuarioRolData);
  } catch (error) {
    throw new Error(
      "Error al crear la asignación de usuarioRol: " +
        (error as Error).message
    );
  }
};

export const getUsuarioRolFromFirestore = async (): Promise<UsuarioRol[]> => {
  try {
    const snapshot = await db
      .collection("usuarioRol")
      .orderBy("fechaAsigna", "desc")
      .get();

    return snapshot.docs.map(
      (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = doc.data() as UsuarioRolDB;
        return {
          idUsuarioRol: doc.id,
          idUsuario: data.idUsuario,
          idRol: data.idRol,
          estado: data.estado,
          fechaAsigna: data.fechaAsigna.toDate().toISOString(),
        };
      }
    );
  } catch (error) {
    throw new Error(
      "Error al obtener las asignaciones de usuarioRol: " +
        (error as Error).message
    );
  }
};

export const getUsuarioRolByUserIdFromFirestore = async (
  idUsuario: string
): Promise<UsuarioRol | null> => {
  try {
    const snapshot = await db
      .collection("usuarioRol")
      .where("idUsuario", "==", idUsuario.trim())
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data() as UsuarioRolDB;

    return {
      idUsuarioRol: doc.id,
      idUsuario: data.idUsuario,
      idRol: data.idRol,
      estado: data.estado,
      fechaAsigna: data.fechaAsigna.toDate().toISOString(),
    };
  } catch (error) {
    throw new Error(
      "Error al obtener el usuarioRol por ID de usuario: " +
        (error as Error).message
    );
  }
};

export const updateUsuarioRolInFirestore = async (
  idUsuarioRol: string,
  idUsuario: string,
  idRol: string,
  estado: boolean
): Promise<void> => {
  try {
    validarUsuarioRol(idUsuario, idRol, estado);

    const usuarioRolRef = db.collection("usuarioRol").doc(idUsuarioRol);
    const doc = await usuarioRolRef.get();

    if (!doc.exists) {
      throw new Error("La asignación usuarioRol no existe.");
    }

    const data = doc.data() as UsuarioRolDB;

    const nuevaFecha =
      data.idRol !== idRol.trim()
        ? admin.firestore.Timestamp.now()
        : data.fechaAsigna;

    await usuarioRolRef.update({
      idUsuario: idUsuario.trim(),
      idRol: idRol.trim(),
      fechaAsigna: nuevaFecha,
      estado,
    });
  } catch (error) {
    throw new Error(
      "Error al actualizar la asignación de usuarioRol: " +
        (error as Error).message
    );
  }
};

export const cambiarEstadoUsuarioRolInFirestore = async (
  idUsuarioRol: string,
  estado: boolean
): Promise<void> => {
  try {
    if (typeof estado !== "boolean") {
      throw new Error("El estado debe ser un valor booleano.");
    }

    await db.collection("usuarioRol").doc(idUsuarioRol).update({ estado });
  } catch (error) {
    throw new Error(
      "Error al cambiar el estado del usuarioRol: " +
        (error as Error).message
    );
  }
};

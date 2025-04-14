import admin from "../config/firebase";
import firebase from "firebase-admin";

const db = admin.firestore();

interface UsuarioDB {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  fechaReg: admin.firestore.Timestamp;
  estado: boolean;
  uidAuth: string;
}

export interface Usuario {
  idUsuario?: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  fechaReg: string;
  estado: boolean;
  uidAuth: string;
}

const validarUsuario = (
  nombre: string,
  apellido: string,
  email: string,
  telefono: string,
  direccion: string,
  contraseña?: string,
  isCreate = false
): void => {
  if (!nombre || nombre.trim().length < 3 || nombre.length > 50)
    throw new Error("El nombre debe tener entre 3 y 50 caracteres.");

  if (!apellido || apellido.trim().length < 3 || apellido.length > 50)
    throw new Error("El apellido debe tener entre 3 y 50 caracteres.");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email))
    throw new Error("El correo electrónico es inválido.");

  if (!telefono || isNaN(Number(telefono)) || telefono.trim().length < 7)
    throw new Error("El teléfono debe ser numérico y tener al menos 8 dígitos.");

  if (!direccion || direccion.trim().length < 5)
    throw new Error("La dirección debe tener al menos 5 caracteres.");

  if (isCreate && (!contraseña || contraseña.trim().length < 6))
    throw new Error("La contraseña es obligatoria y debe tener al menos 6 caracteres.");

  if (!isCreate && contraseña && contraseña.trim().length < 6)
    throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
};

const esUsuarioDuplicado = async (
  email: string,
  telefono: string,
  nombre: string,
  apellido: string,
  excluirId?: string
): Promise<boolean> => {
  const querySnapshot = await db.collection("usuarios").get();
  return querySnapshot.docs.some((doc) => {
    const data = doc.data() as UsuarioDB;
    const esDuplicado =
      (data.email === email ||
        data.telefono === telefono ||
        (data.nombre === nombre && data.apellido === apellido));
    return excluirId ? doc.id !== excluirId && esDuplicado : esDuplicado;
  });
};

export const createUsuarioInFirestore = async (
  nombre: string,
  apellido: string,
  email: string,
  contraseña: string,
  telefono: string,
  direccion: string,
  estado: boolean
): Promise<void> => {
  try {
    validarUsuario(nombre, apellido, email, telefono, direccion, contraseña, true);

    const nombreLower = nombre.trim().toLowerCase();
    const apellidoLower = apellido.trim().toLowerCase();
    const emailLower = email.trim().toLowerCase();
    const telefonoTrim = telefono.trim();
    const direccionLower = direccion.trim().toLowerCase();

    const duplicado = await esUsuarioDuplicado(emailLower, telefonoTrim, nombreLower, apellidoLower);
    if (duplicado) throw new Error("Ya existe un usuario con ese nombre, apellido, email o teléfono.");

    const userRecord = await firebase.auth().createUser({
      email: emailLower,
      password: contraseña,
      displayName: `${nombreLower} ${apellidoLower}`,
    });

    const usuarioData: UsuarioDB = {
      nombre: nombreLower,
      apellido: apellidoLower,
      email: emailLower,
      telefono: telefonoTrim,
      direccion: direccionLower,
      fechaReg: admin.firestore.Timestamp.now(),
      estado,
      uidAuth: userRecord.uid,
    };

    await db.collection("usuarios").doc(userRecord.uid).set(usuarioData);
  } catch (error) {
    throw new Error("Error al crear el usuario: " + (error as Error).message);
  }
};

export const getUsuariosFromFirestore = async (): Promise<Usuario[]> => {
  try {
    const snapshot = await db
      .collection("usuarios")
      .select("nombre", "apellido", "email", "telefono", "direccion", "fechaReg", "estado", "uidAuth")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as UsuarioDB;
      return {
        idUsuario: doc.id,
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion,
        estado: data.estado,
        uidAuth: data.uidAuth,
        fechaReg: data.fechaReg?.toDate?.().toISOString() ?? "",
      };
    });
  } catch (error) {
    throw new Error("Error al obtener los usuarios: " + (error as Error).message);
  }
};

export const updateUsuarioInFirestore = async (
  idUsuario: string,
  nombre: string,
  apellido: string,
  email: string,
  telefono: string,
  direccion: string,
  estado: boolean,
  contraseña?: string
): Promise<void> => {
  try {
    validarUsuario(nombre, apellido, email, telefono, direccion, contraseña, false);

    const nombreLower = nombre.trim().toLowerCase();
    const apellidoLower = apellido.trim().toLowerCase();
    const emailLower = email.trim().toLowerCase();
    const telefonoTrim = telefono.trim();
    const direccionLower = direccion.trim().toLowerCase();

    const duplicado = await esUsuarioDuplicado(emailLower, telefonoTrim, nombreLower, apellidoLower, idUsuario);
    if (duplicado) throw new Error("Ya existe otro usuario con ese nombre, apellido, email o teléfono.");

    const usuarioRef = db.collection("usuarios").doc(idUsuario);
    const usuarioSnapshot = await usuarioRef.get();
    if (!usuarioSnapshot.exists) throw new Error("Usuario no encontrado.");

    await usuarioRef.update({
      nombre: nombreLower,
      apellido: apellidoLower,
      email: emailLower,
      telefono: telefonoTrim,
      direccion: direccionLower,
      estado,
    });

    await firebase.auth().updateUser(idUsuario, {
      email: emailLower,
      displayName: `${nombreLower} ${apellidoLower}`,
    });

    if (contraseña && contraseña.trim().length >= 6) {
      await firebase.auth().updateUser(idUsuario, { password: contraseña });
    }
  } catch (error) {
    throw new Error("Error al actualizar el usuario: " + (error as Error).message);
  }
};

export const cambiarEstadoUsuarioInFirestore = async (
  idUsuario: string,
  estado: boolean
): Promise<void> => {
  try {
    const usuarioRef = db.collection("usuarios").doc(idUsuario);
    await usuarioRef.update({ estado });
  } catch (error) {
    throw new Error("Error al cambiar el estado del usuario: " + (error as Error).message);
  }
};

export const getUsuarioByUidAuthFromFirestore = async (
  uidAuth: string
): Promise<Usuario | null> => {
  const snapshot = await db
    .collection("usuarios")
    .where("uidAuth", "==", uidAuth)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data() as UsuarioDB;

  return {
    idUsuario: doc.id,
    nombre: data.nombre,
    apellido: data.apellido,
    email: data.email,
    telefono: data.telefono,
    direccion: data.direccion,
    estado: data.estado,
    uidAuth: data.uidAuth,
    fechaReg: data.fechaReg.toDate().toISOString(),
  };
};

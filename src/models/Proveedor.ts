import admin from "../config/firebase";

const db = admin.firestore();

export interface Proveedor {
  nombre: string;
  direccion: string;
  email: string;
  telefono: number;
  estado: boolean;
  idProveedor?: string;
}

const validarProveedor = (
  nombre: string,
  direccion: string,
  email: string,
  telefono: number
): void => {
  if (!nombre || nombre.trim().length < 3) {
    throw new Error("El nombre debe tener al menos 3 caracteres.");
  }
  if (nombre.trim().length > 50) {
    throw new Error("El nombre no puede exceder los 50 caracteres.");
  }
  if (!direccion || direccion.trim().length < 5) {
    throw new Error("La dirección debe tener al menos 5 caracteres.");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new Error("El correo electrónico proporcionado no es válido.");
  }
  if (telefono <= 0 || isNaN(telefono)) {
    throw new Error("El teléfono debe ser un número positivo válido.");
  }
};

const esProveedorDuplicado = async (
  nombre: string,
  email: string,
  telefono: number,
  excludeId?: string
): Promise<boolean> => {
  const snapshot = await db.collection("proveedores").get();

  const normalizado = (texto: string) => texto.trim().toLowerCase();

  return snapshot.docs.some((doc) => {
    if (excludeId && doc.id === excludeId) return false;

    const data = doc.data() as Proveedor;

    return (
      data &&
      (normalizado(data.nombre) === normalizado(nombre) ||
        normalizado(data.email) === normalizado(email) ||
        data.telefono === telefono)
    );
  });
};

export const createProveedorInFirestore = async (
  nombre: string,
  direccion: string,
  email: string,
  telefono: number,
  estado: boolean
): Promise<void> => {
  try {
    validarProveedor(nombre, direccion, email, telefono);

    const duplicado = await esProveedorDuplicado(nombre, email, telefono);
    if (duplicado)
      throw new Error("Ya existe un proveedor con el mismo nombre, correo o teléfono.");

    const proveedorRef = db.collection("proveedores").doc();
    const proveedorData: Proveedor = {
      nombre: nombre.trim().toLowerCase(),
      direccion: direccion.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      telefono,
      estado,
    };

    await proveedorRef.set(proveedorData);
  } catch (error) {
    throw new Error("Error al crear el proveedor: " + (error as Error).message);
  }
};

export const getProveedoresFromFirestore = async (): Promise<Proveedor[]> => {
  try {
    const snapshot = await db
      .collection("proveedores")
      .select("nombre", "direccion", "email", "telefono", "estado")
      .get();

    return snapshot.docs.map((doc) => ({
      idProveedor: doc.id,
      ...(doc.data() as Proveedor),
    }));
  } catch (error) {
    throw new Error("Error al obtener los proveedores: " + (error as Error).message);
  }
};

export const updateProveedorInFirestore = async (
  idProveedor: string,
  nombre: string,
  direccion: string,
  email: string,
  telefono: number,
  estado: boolean
): Promise<void> => {
  try {
    validarProveedor(nombre, direccion, email, telefono);

    const duplicado = await esProveedorDuplicado(nombre, email, telefono, idProveedor);
    if (duplicado)
      throw new Error("Ya existe otro proveedor con el mismo nombre, correo o teléfono.");

    const proveedorRef = db.collection("proveedores").doc(idProveedor);
    await proveedorRef.update({
      nombre: nombre.trim().toLowerCase(),
      direccion: direccion.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      telefono,
      estado,
    });
  } catch (error) {
    throw new Error("Error al actualizar el proveedor: " + (error as Error).message);
  }
};

export const cambiarEstadoProveedorInFirestore = async (
  idProveedor: string,
  estado: boolean
): Promise<void> => {
  try {
    const proveedorRef = db.collection("proveedores").doc(idProveedor);
    await proveedorRef.update({ estado });
  } catch (error) {
    throw new Error("Error al cambiar el estado del proveedor: " + (error as Error).message);
  }
};

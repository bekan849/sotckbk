import admin from "../config/firebase";

const db = admin.firestore();
const CONFIG_DOC_ID = "datosGlobales";

export interface ConfigGlobal {
  nombreEmpresa: string;
  moneda: "Bs";
  email: string;
  sitioWeb?: string;
  ubicacion: {
    direccion: string;
    ciudad: string;
    pais: "Bolivia";
  };
  telefonos: {
    telefono1: string;
    telefono2: string;
  };
  createdAt?: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

const validarConfig = (data: Partial<ConfigGlobal>): void => {
  const errores: string[] = [];

  if (!data.nombreEmpresa || data.nombreEmpresa.trim().length < 3) {
    errores.push("El nombre de la empresa es requerido y debe tener al menos 3 caracteres.");
  }

  if (!data.ubicacion?.direccion || data.ubicacion.direccion.trim().length < 5) {
    errores.push("La dirección es requerida y debe tener al menos 5 caracteres.");
  }

  if (!data.ubicacion?.ciudad || data.ubicacion.ciudad.trim().length < 2) {
    errores.push("La ciudad es requerida y debe ser válida.");
  }

  if (data.ubicacion?.pais !== "Bolivia") {
    errores.push("El país debe ser 'Bolivia'.");
  }

  if (data.moneda !== "Bs") {
    errores.push("La moneda debe ser 'Bs'.");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errores.push("El correo electrónico proporcionado no es válido.");
  }

  if (!data.telefonos?.telefono1 || data.telefonos.telefono1.trim().length < 6) {
    errores.push("El teléfono 1 es requerido y debe ser válido.");
  }

  if (!data.telefonos?.telefono2 || data.telefonos.telefono2.trim().length < 6) {
    errores.push("El teléfono 2 es requerido y debe ser válido.");
  }

  if (errores.length > 0) {
    throw new Error(errores.join(" "));
  }
};

export const setConfigGlobalInFirestore = async (
  data: Omit<ConfigGlobal, "createdAt" | "updatedAt">
): Promise<void> => {
  validarConfig(data);

  const ref = db.collection("configuracion").doc(CONFIG_DOC_ID);
  const doc = await ref.get();

  const now = admin.firestore.Timestamp.now();

  const previousData = doc.exists ? (doc.data() as ConfigGlobal) : null;

  await ref.set({
    ...data,
    nombreEmpresa: data.nombreEmpresa.trim(),
    email: data.email.trim().toLowerCase(),
    sitioWeb: data.sitioWeb?.trim() || "",
    ubicacion: {
      direccion: data.ubicacion.direccion.trim(),
      ciudad: data.ubicacion.ciudad.trim(),
      pais: "Bolivia",
    },
    telefonos: {
      telefono1: data.telefonos.telefono1.trim(),
      telefono2: data.telefonos.telefono2.trim(),
    },
    createdAt: previousData?.createdAt || now,
    updatedAt: now,
  });
};

export const getConfigGlobalFromFirestore = async (): Promise<ConfigGlobal | null> => {
  const doc = await db.collection("configuracion").doc(CONFIG_DOC_ID).get();
  return doc.exists ? (doc.data() as ConfigGlobal) : null;
};

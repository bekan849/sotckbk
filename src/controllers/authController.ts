import { Request, Response } from "express";
import admin from "../config/firebase";
import { UserModel } from "../models/userAuth";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: "AIzaSyC8vk7itiWd5drIE2JXdevLEVzvIf_-frY",
    authDomain: "stockbk-c5aed.firebaseapp.com",
  });
}

const MAX_INTENTOS = 5;
const BLOQUEO_HORAS = 24;

export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body;
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress || "desconocida";

  const db = admin.firestore();

  if (!email || !password) {
    return res.status(400).json({ message: "Email y contraseña son requeridos." });
  }

  const loginEmailRef = db.collection("loginFallido").doc(email.toLowerCase());
  const loginIpRef = db.collection("loginFallidoIP").doc(ip);

  try {
    const [emailDoc, ipDoc] = await Promise.all([loginEmailRef.get(), loginIpRef.get()]);
    const now = admin.firestore.Timestamp.now().toDate();

    const estaBloqueado = (doc: FirebaseFirestore.DocumentSnapshot) => {
      const data = doc.data();
      if (!data || data.intentos < MAX_INTENTOS) return false;

      const ultimo = data.ultimoIntento?.toDate?.();
      if (!ultimo) return false;

      const expira = new Date(ultimo.getTime() + BLOQUEO_HORAS * 60 * 60 * 1000);
      return now < expira;
    };

    if (estaBloqueado(emailDoc)) {
      return res.status(403).json({
        message: "Demasiados intentos fallidos con este email. Intenta más tarde.",
      });
    }

    if (estaBloqueado(ipDoc)) {
      return res.status(403).json({
        message: "Demasiados intentos fallidos desde esta IP. Intenta más tarde.",
      });
    }

    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    if (!user) throw new Error("No se pudo autenticar al usuario.");
    const uid = user.uid;
    const idToken = await user.getIdToken();

    const usuarioDoc = await db.collection("usuarios").doc(uid).get();
    if (!usuarioDoc.exists || usuarioDoc.data()?.estado !== true) {
      return res.status(403).json({ message: "Usuario deshabilitado o inexistente." });
    }

    const asignacionSnap = await db
      .collection("usuarioRol")
      .where("idUsuario", "==", uid)
      .where("estado", "==", true)
      .limit(1)
      .get();

    if (asignacionSnap.empty) {
      return res.status(403).json({ message: "El usuario no tiene un rol asignado activo." });
    }

    const { idRol } = asignacionSnap.docs[0].data();
    const rolDoc = await db.collection("roles").doc(idRol).get();
    if (!rolDoc.exists || rolDoc.data()?.estado !== true) {
      return res.status(403).json({ message: "El rol asignado está inactivo o no existe." });
    }

    await Promise.all([loginEmailRef.delete(), loginIpRef.delete()]);

    const userRecord = await admin.auth().getUser(uid);
    const usuario: UserModel = {
      uid: userRecord.uid,
      email: userRecord.email ?? null,
      displayName: userRecord.displayName ?? null,
      token: idToken,
      rol: rolDoc.data()?.nombre.trim() ?? "",
    };

    return res.status(200).json(usuario);
  } catch (error: any) {
    const now = admin.firestore.Timestamp.now();

    const actualizarIntento = async (ref: FirebaseFirestore.DocumentReference) => {
      const snap = await ref.get();
      if (snap.exists) {
        const data = snap.data() || {};
        const nuevosIntentos = (data.intentos || 0) + 1;
        await ref.update({ intentos: nuevosIntentos, ultimoIntento: now });
      } else {
        await ref.set({ intentos: 1, ultimoIntento: now });
      }
    };

    await Promise.all([actualizarIntento(loginEmailRef), actualizarIntento(loginIpRef)]);

    return res.status(401).json({ message: "Email o contraseña incorrectos." });
  }
};

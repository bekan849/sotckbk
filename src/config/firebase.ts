import admin from 'firebase-admin';
import dotenv from 'dotenv';
import serviceAccount from './firebaseServiceAccount.json';

dotenv.config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export default admin;

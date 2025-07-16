import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS!);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

export default admin;

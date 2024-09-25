
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC0DY5JCx-S4sslJ1MiTIlM4aON5dA3MJw",
  authDomain: "mkvps-538e4.firebaseapp.com",
  projectId: "mkvps-538e4",
  storageBucket: "mkvps-538e4.appspot.com",
  messagingSenderId: "51431411792",
  appId: "1:51431411792:web:abbab8437cf01cd2684155",
  measurementId: "G-HCF49RWFC5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);


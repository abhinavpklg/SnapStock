// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB2_miTg-CeUVAphx0OpNAYtTBM2OZgeMc",
  authDomain: "snapstock-345fd.firebaseapp.com",
  projectId: "snapstock-345fd",
  storageBucket: "snapstock-345fd.appspot.com",
  messagingSenderId: "631361811034",
  appId: "1:631361811034:web:b1458bdd33cb7659eede63",
  measurementId: "G-31T24BFNGV"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const storage = getStorage(app);
export { firestore, storage };
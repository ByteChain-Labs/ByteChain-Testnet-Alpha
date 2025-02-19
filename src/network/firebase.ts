import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"


const firebaseConfig = {
  apiKey: "AIzaSyBSxYlyxAw_li09nCZmjuc3eCOlboKqc5U",
  authDomain: "bytechain-bc.firebaseapp.com",
  projectId: "bytechain-bc",
  storageBucket: "bytechain-bc.firebasestorage.app",
  messagingSenderId: "462823593162",
  appId: "1:462823593162:web:12933a358b24b12f0fd033",
  measurementId: "G-LPLMJYN6GJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


export { app, db };
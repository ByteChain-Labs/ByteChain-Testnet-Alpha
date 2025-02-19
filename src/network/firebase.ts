import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";
import { promises as fs } from "fs";

const firebaseConfig = {
  apiKey: "AIzaSyBSxYlyxAw_li09nCZmjuc3eCOlboKqc5U",
  authDomain: "bytechain-bc.firebaseapp.com",
  projectId: "bytechain-bc",
  storageBucket: "bytechain-bc.firebasestorage.app",
  messagingSenderId: "462823593162",
  appId: "1:462823593162:web:12933a358b24b12f0fd033",
  measurementId: "G-LPLMJYN6GJ",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };

/**
 *  @param filePath - The path to the bcnode setup.txt file.
 */

export async function loginNodeFromSetupFile(filePath: string): Promise<void> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");
    let publicKey = "";
    let blockchainAddress = "";

    for (const line of lines) {
      const parts = line.split(":");
      if (parts.length >= 2) {
        const key = parts[0].trim().toLowerCase();
        const value = parts.slice(1).join(":").trim();
        if (key === "publickey" || key === "public key") {
          publicKey = value;
        } else if (
          key === "blockchainaddress" ||
          key === "blockchain address"
        ) {
          blockchainAddress = value;
        }
      }
    }

    if (!publicKey || !blockchainAddress) {
      console.error(
        "Public key or blockchain address missing in the setup file."
      );
      return;
    }

    // checks if node is registered
    const nodesRef = collection(db, "nodes"); // Reference to the "nodes" collection.
    const q = query(
      nodesRef,
      where("blockchainAddress", "==", blockchainAddress)
    );
    const querySnapshot = await getDocs(q);

    // login if registered
    if (!querySnapshot.empty) {
      console.log("Node already registered. Logging in...");
      // Additional login tasks to be added here
      return;
    }

    // If not register.
    const newNode = {
      publicKey,
      blockchainAddress,
      registeredAt: new Date().toISOString(),
    };
    const docRef = await addDoc(nodesRef, newNode);

    console.log("Node registered successfully with ID:", docRef.id);
  } catch (error) {
    console.error("Error logging in node from setup file:", error);
  }
}

loginNodeFromSetupFile("../../bcnode-setup.txt")
  .then(() => console.log("Login process complete."))
  .catch((error) =>
    console.error("Login process encountered an error:", error)
  );

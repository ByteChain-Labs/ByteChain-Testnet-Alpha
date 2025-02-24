import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  DocumentData,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";
import { promises as fs } from "fs";
import { writeFile } from "fs/promises";


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

export async function loginNodeFromSetupFile(filePath: string): Promise<string> {
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
      throw new Error("Missing public key or blockchain address")
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
      return blockchainAddress;
    }

    // If not register.
    const newNode = {
      publicKey,
      blockchainAddress,
      registeredAt: new Date().toISOString(),
    };
    const docRef = await addDoc(nodesRef, newNode);

    console.log("Node registered successfully with ID:", docRef.id);
    return blockchainAddress
  } catch (error) {
    console.error("Error logging in node from setup file:", error);
    throw error
  }
}



/**
 * @param filePath - The filepath for peers.txt
 */
async function writePeersToFile(filePath: string, content: string): Promise<void> {
  try {
      await writeFile(filePath, content, "utf-8");
      console.log("Peers written to file successfully")
  } catch (error) {
      console.error("Error writing peers to file: ", error);
  }
}


/*
  Todo make sure that the node does not add itself as a peer in peers.txt
  and also make sure that if an error occurs during login no peer should
  be written inside peers.txt
*/
async function getRandomPeers(filePath: string, blockchainAddress: string): Promise<void> {
  const nodesRef = collection(db, "nodes");
  
  try {
    const snapshot = await getDocs(nodesRef);
    const nodes = snapshot.docs.map(doc => doc.data());

    if (nodes.length === 0) {
      console.log("No peer found.");
      return
    }

    const filteredNodes = nodes.filter(node => node.blockchainAddress !== blockchainAddress);

    if (filteredNodes.length === 0) {
      console.log("No peer found after filtering out self.");
      return
    }

    const randomNodes = filteredNodes
      .sort(() => Math.random() - 0.5)
      .slice(0, 8);

    const randomNodesStr = JSON.stringify(randomNodes, null, 2);
    
    await writePeersToFile(filePath, randomNodesStr);

    console.log("Peers fetched successfully.");
  } catch (error) {
    console.error("Error fetching peers: ", error);
  }
}




loginNodeFromSetupFile("./bcnode-setup.txt")
    .then((blockchainAddress) => getRandomPeers("./peers.txt", blockchainAddress))
    .then(() => console.log("Login process complete."))
    .catch((error) => console.error("Login process encountered an error:", error));

import { useEffect, useState } from "react";
import Transfer from "./Transfer";
import { io } from "socket.io-client";
const socket = io("http://localhost:3000");

const Dashboard = ({ address, bc }) => {
  const [showTransfer, setShowTransfer] = useState(false);
  const [balance, setBalance] = useState();
  useEffect(() => {
    async function fetchBalance() {
      const bal = await bc.get_bal(address);
      setBalance(bal);
    }
    socket.on("blockMined", (block) => fetchBalance());
    return () => socket.off("blockMined", (block) => fetchBalance());
  }, []);

  const toggleTransfer = (e, state, response) => {
    e.preventDefault();
    if (state === "on") {
      setShowTransfer(true);
      return;
    }
    if (state === "cancel") {
      response = window.confirm("Are you sure you want to cancel this transaction?");
    }
    setShowTransfer(!response);
  };
  return (
    <div className="w-screen h-screen flex flex-col justify-start items-start gap-4 pt-4">
      <p className="ml-4">
        <span className="font-bold text-lg">Blockchain Address: </span>
        {address || "loading..."}
      </p>
      <p className="ml-4">
        <span className="font-bold text-lg">Account Balance: </span>
        {balance === undefined ? "loading..." : balance}
      </p>
      {!showTransfer && (
        <button onClick={(e) => toggleTransfer(e, "on")} className="px-2 py-1 rounded-md border-2 mt-2 ml-4">
          Transfer
        </button>
      )}
      {showTransfer && <Transfer toggleTransfer={toggleTransfer} />}
    </div>
  );
};
export default Dashboard;

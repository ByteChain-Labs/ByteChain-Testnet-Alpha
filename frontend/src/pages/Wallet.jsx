import React, { useState } from "react";
import { CiWallet } from "react-icons/ci";

const Wallet = () => {
  const [hasWallet, setHasWallet] = useState(false);
  const [walletData, setWalletData] = useState(null);

  const handleNewWallet = async () => {
    try {
      const response = await fetch("http://localhost:3001/create-new-wallet");

      if (!response.ok) {
        throw Error("The response from the server is not ok!");
      }

      const data = await response.json();
      data.name = "Wallet 1";
      console.log(data);
      setWalletData(data);
      setHasWallet(true);
    } catch (err) {
      console.log("Failed to create a new wallet: \n" + err);
    }
  };

  const handleSend = async () => {
    try {
      const amount = prompt(
        "How much do you wish to send? : \n Please enter only numeric values as there are functions to resolve a problem relating to wrong input\n And doing so will stop the server from running\n"
      );
      const recipient = prompt("Enter the recipient's blockchain address");
      const response = await fetch("http://localhost:3001/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          sender: walletData.blockchainAddress,
          recipient: recipient,
          publicKey: walletData.publicKey,
          privateKey: walletData.privateKey,
        }),
      });

      if (!response.ok) {
        throw Error("Network response not ok");
      }

      const result = await response.json();
      console.log(result);
    } catch (err) {
      console.log("Error sending: \n" + err);
    }
  };

  return (
    <div className="wallet">
      {hasWallet && (
        <div className="walletCont">
          <div className="balance">
            <span>
              <CiWallet />
              <p id="wallet" title={walletData.blockchainAddress}>
                {walletData.name}
              </p>
            </span>
            <div>
              <p>BALANCE: </p>
              <h2>$0.00</h2>
            </div>
          </div>
          <div className="operations">
            <button onClick={handleSend}>SEND</button>
          </div>
        </div>
      )}
      {!hasWallet && (
        <div className="walletNotFound">
          <h1>No Wallet Found!</h1>
          <button onClick={handleNewWallet}>Create a new wallet</button>
        </div>
      )}
    </div>
  );
};

export default Wallet;

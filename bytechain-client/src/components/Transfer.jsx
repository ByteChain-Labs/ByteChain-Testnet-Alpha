import { useState } from "react";

const Transfer = ({ toggleTransfer }) => {
  const [receipientAddress, setReceipientAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const transact = (e) => {
    e.preventDefault();
    const response = window.confirm(`Are you sure you want to send ${transferAmount} to ${receipientAddress}`);
    toggleTransfer(e, "send", response);
  };
  return (
    <div className="w-11/12 lg:w-1/2 h-1/2 flex flex-col justify-start self-center items-center pt-4 gap-8 bg-[#0c0c0c] rounded-lg">
      <p className="font-bold text-lg">Transfer to a receipient</p>
      <form method="post" className="w-11/12 h-full flex flex-col items-center gap-7" onSubmit={(e) => transact(e)}>
        <input
          type="text"
          className="rounded-md pl-2 bg-black border-2 w-full h-8 outline-none"
          placeholder="receipient blockchain address"
          value={receipientAddress}
          onChange={(e) => setReceipientAddress(e.target.value)}
        />
        <input
          type="number"
          className="rounded-md pl-2 bg-black border-2 w-full h-8 outline-none"
          placeholder="amount"
          value={transferAmount}
          onChange={(e) => setTransferAmount(e.target.value)}
        />
        <div className="flex gap-4">
          <button
            type="submit"
            className="w-min rounded-md px-2 py-1 bg-black border-2 duration-500 hover:bg-[#09b80f]"
          >
            SEND
          </button>
          <button
            className="w-min rounded-md px-2 py-1 bg-black border-2 duration-500 hover:bg-[#b80f09]"
            onClick={(e) => toggleTransfer(e, "cancel")}
          >
            CANCEL
          </button>
        </div>
      </form>
    </div>
  );
};
export default Transfer;

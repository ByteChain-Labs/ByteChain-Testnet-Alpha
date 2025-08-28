const CreateAccount = ({ bc, setAddress }) => {
  const newAccount = () => {
    bc.createAccount();
    const address = bc.wallet.account.blockchain_addr;
    localStorage.setItem("address", address);
    setAddress(address);
  };
  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center gap-4">
      <p>No accounts detected</p>
      <button onClick={() => newAccount()} className="bg-gray-500 text-gray-900 p-2 rounded-md hover:text-white">
        Create New Account
      </button>
    </div>
  );
};
export default CreateAccount;

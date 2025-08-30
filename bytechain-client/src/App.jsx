import BCWeb3 from "bc-web3js"
import CreateAccount from "./components/CreateAccount";
import Dashboard from "./components/Dashboard";
import { useState } from "react";

function App() {
  const [address, setAddress] = useState(localStorage.getItem("address"));
  const bc = new BCWeb3("http://localhost:4000");
  return (
    <div className="App">
      {!address && <CreateAccount bc={bc} setAddress={setAddress} />}
      {address && <Dashboard address={address} bc={bc} />}
    </div>
  );
}

export default App;

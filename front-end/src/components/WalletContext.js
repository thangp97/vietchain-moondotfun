import React, { createContext, useState } from "react";

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);

  return (
    <WalletContext.Provider value={{ address, setAddress, balance, setBalance }}>
      {children}
    </WalletContext.Provider>
  );
};

require('dotenv').config()
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  defaultNetwork: "sepolia",
  networks: {
    sepolia: {
      url: process.env.MAINNET_RPC_URL,
      accounts: [process.env.ADDRESS_PRIVATE_KEY],
      chainId: 11155111,
    },
    hardhat: {
      forking: {
        url: process.env.MAINNET_RPC_URL
      }
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};

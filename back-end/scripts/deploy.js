// scripts/deploy.js
const { ethers, network } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log(`Deploying TokenFactory to ${network.name}...`);
  console.log("Timestamp:", new Date().toISOString());
  
  // Lấy thông tin deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Kiểm tra balance đủ để deploy không
  if (balance < ethers.parseEther("0.01")) {
    console.error("Insufficient balance! Need at least 0.01 ETH for deployment");
    process.exit(1);
  }

  try {
    // Deploy TokenFactory contract
    console.log("\nGetting TokenFactory contract factory...");
    const TokenFactory = await ethers.getContractFactory("TokenFactory");
    
    console.log("Deploying contract...");
    const tokenFactory = await TokenFactory.deploy();
    
    console.log("Waiting for deployment confirmation...");
    await tokenFactory.waitForDeployment();

    const contractAddress = await tokenFactory.getAddress();
    const deploymentTx = tokenFactory.deploymentTransaction();
    
    console.log("\nTokenFactory deployed successfully!");
    console.log("Contract Address:", contractAddress);
    console.log("Transaction Hash:", deploymentTx.hash);
    console.log("Gas Used:", deploymentTx.gasLimit.toString());
    
    // Verify contract constants
    console.log("\nVerifying contract constants...");
    const maxSupply = await tokenFactory.MAX_SUPPLY ? "Available" : "Not available";
    const creationFee = await tokenFactory.MEMETOKEN_CREATION_FEE ? "Available" : "Not available";
    console.log("MAX_SUPPLY:", maxSupply);
    console.log("CREATION_FEE:", creationFee);

    // Save deployment info
    const deploymentInfo = {
      network: network.name,
      contractName: "TokenFactory",
      contractAddress: contractAddress,
      deployer: deployer.address,
      deploymentHash: deploymentTx.hash,
      gasUsed: deploymentTx.gasLimit.toString(),
      timestamp: new Date().toISOString(),
      blockNumber: await ethers.provider.getBlockNumber(),
      // Contract constants for reference
      constants: {
        MAX_SUPPLY: "1000000000000000000000000", // 1M * 10^18
        INIT_SUPPLY_PERCENT: "20%",
        CREATION_FEE: "0.0001 ETH",
        FUNDING_GOAL: "24 ETH",
        UNISWAP_V2_FACTORY: "0xF62c03E08ada871A0bEb309762E260a7a6a880E6",
        UNISWAP_V2_ROUTER: "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3"
      }
    };

    // Create deployments directory if not exists
    if (!fs.existsSync('deployments')) {
      fs.mkdirSync('deployments');
    }

    // Save to file
    const filename = `deployments/${network.name}-deployment.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("Deployment info saved to:", filename);

    // Show next steps
    console.log("\nDeployment completed successfully!");
    console.log("\nNext steps:");
    console.log("1. Verify contract on Etherscan:");
    console.log(`   npx hardhat verify --network ${network.name} ${contractAddress}`);
    console.log("\n2. Test create token function:");
    console.log(`   Use contract address: ${contractAddress}`);
    console.log("   Required fee: 0.0001 ETH");
    console.log("\n3. Update your frontend/backend with new contract address");

    if (network.name === "sepolia") {
      console.log("\n🔗 View on Sepolia Etherscan:");
      console.log(`https://sepolia.etherscan.io/address/${contractAddress}`);
    }

    return contractAddress;

  } catch (error) {
    console.error("Deployment failed:", error);
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error("Not enough ETH for gas fees");
    } else if (error.code === 'NETWORK_ERROR') {
      console.error("Network connection issue");
    }
    
    process.exit(1);
  }
}

// Execute deployment
main()
  .then((address) => {
    console.log(`\nFinal contract address: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script execution failed:", error);
    process.exit(1);
  });
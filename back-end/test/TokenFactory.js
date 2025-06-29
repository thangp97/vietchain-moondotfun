// const { expect } = require("chai");
// const hre = require("hardhat");
// const {time} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

// describe("Token Factory", function() {
//     it("Should Create Meme Token Success", async function() {
//         const tokenFactoryct = await hre.ethers.deployContract("TokenFactory");
//         const tx = await tokenFactoryct.createMemeToken("Test","TEST",
//         "This is test", "image.png", {
//             value: hre.ethers.parseEther("0.0001")
//         })
//         const memecoins = await tokenFactoryct.getAllMemeTokens();
//         console.log("Memecoins ",memecoins)
//     });

//     it("Should revert if incorrect value of memeToken Creation fee is passed", async function () {
//         const tokenCt = await hre.ethers.deployContract("TokenFactory");
//         await expect(tokenCt.createMemeToken("Test", "TEST", "This is test", "image.png", {
//             value: hre.ethers.parseEther("0.00001")
//         })).to.be.revertedWith("fee not paid for memetoken creation");
//     });

//     it("Purchase Meme Token", async function() {
//         const tokenFactoryct = await hre.ethers.deployContract("TokenFactory");
//         const tx = await tokenFactoryct.createMemeToken("Test","TEST",
//         "This is test", "image.png", {
//             value: hre.ethers.parseEther("0.0001")
//         })
//         const memeTokenAddress = await tokenFactoryct.memeTokenAddresses(0);

//         const tx2 = await tokenFactoryct.buyMemeToken(memeTokenAddress, 800000, {
//             value: hre.ethers.parseEther("24")
//         });
//         const memecoins = await tokenFactoryct.getAllMemeTokens();
//         console.log("Memecoins ", memecoins)
//     })
// })

const {expect} = require("chai");
const hre = require("hardhat");
const {time} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Token Factory", function () {
    it("Should create the meme token successfully", async function () {
        const tokenCt = await hre.ethers.deployContract("TokenFactory");
        const tx = await tokenCt.createMemeToken("Test", "TEST", "img://img.png", "hello there", {
            value: hre.ethers.parseEther("0.0001")
        });
        const memecoins = await tokenCt.getAllMemeTokens();
        console.log("Memecoins ", memecoins)
    });

    it("Should revert if incorrect value of memeToken Creation fee is passed", async function () {
        const tokenCt = await hre.ethers.deployContract("TokenFactory");
        await expect(tokenCt.createMemeToken("Test", "TEST", "img://img.png", "hello there", {
            value: hre.ethers.parseEther("0.00001")
        })).to.be.revertedWith("fee not paid for memetoken creation");
    });

    it("Should allow a user to purchase the meme token", async function() {
        const tokenCt = await hre.ethers.deployContract("TokenFactory");
        const tx1 = await tokenCt.createMemeToken("Test", "TEST", "img://img.png", "hello there", {
            value: hre.ethers.parseEther("0.0001")
        });
        const memeTokenAddress = await tokenCt.memeTokenAddresses(0)
        const tx2 = await tokenCt.buyMemeToken(memeTokenAddress, 800000, {
            value: hre.ethers.parseEther("24")
        });
        const memecoins = await tokenCt.getAllMemeTokens();
        console.log("Memecoins ", memecoins)
    });

    it("Should allow a user to sell meme token", async function () {
        const [owner, user] = await hre.ethers.getSigners();

        const tokenCt = await hre.ethers.deployContract("TokenFactory");

        await tokenCt.connect(owner).createMemeToken("Test", "TEST", "img://img.png", "hello there", {
            value: hre.ethers.parseEther("0.0001")
        });

        const memeTokenAddress = await tokenCt.memeTokenAddresses(0);
        const memeToken = await hre.ethers.getContractAt("Token", memeTokenAddress);

        const buyQty = 800000;
        const buyValue = hre.ethers.parseEther("24");
        await tokenCt.connect(user).buyMemeToken(memeTokenAddress, buyQty, {
            value: buyValue
        });

        const balanceBefore = await hre.ethers.provider.getBalance(user.address);

        const sellQty = 200000;
        const tx = await tokenCt.connect(user).sellMemeToken(memeTokenAddress, sellQty);
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed * receipt.gasPrice;

        const balanceAfter = await hre.ethers.provider.getBalance(user.address);

        console.log("Balance before sell:", hre.ethers.formatEther(balanceBefore));
        console.log("Balance after sell :", hre.ethers.formatEther(balanceAfter));
        console.log("ETH received:", hre.ethers.formatEther(balanceAfter - balanceBefore + gasUsed));

        const userTokenBalance = await memeToken.balanceOf(user.address);
        expect(userTokenBalance).to.equal(BigInt(buyQty - sellQty) * BigInt(10 ** 18)); // DECIMALS
    });

})
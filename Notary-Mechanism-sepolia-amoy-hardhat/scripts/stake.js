require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require('fs');
require("dotenv").config();
const { parseEther } = require('ethers/lib/utils');

const NotaryABI = require("../artifacts/contracts/Notary.sol/Notary.json");
const TokenABI = require("../artifacts/contracts/Token.sol/Token.json");

const {NODE_URL_ARBITRUM, NODE_URL_AMOY, ARBITRUM_PRIVATE_KEY01, AMOY_PRIVATE_KEY01} = process.env;

const arbitrumProvider = new ethers.providers.JsonRpcProvider(NODE_URL_ARBITRUM);
const amoyProvider = new ethers.providers.JsonRpcProvider(NODE_URL_AMOY);

const arbitrumWallet = new ethers.Wallet(ARBITRUM_PRIVATE_KEY01, arbitrumProvider);
const amoyWallet = new ethers.Wallet(AMOY_PRIVATE_KEY01, amoyProvider);

const tokenAddressArbitrum = "0x5C86F4a99047385927284BacFD088B071Bdb4936";
const notaryAddressArbitrum = "0xAC02A4C9CA4Be4eFDA700712d2593578BDB89F67";

const tokenAddressAmoy = "0xa30Cd28aEE64f98b72d0f18C19B772c7D42c4908";
const notaryAddressAmoy = "0xC29C149dA1FAe5B55aB2896E9BaB3EA35E5b89d1";  

async function main() {

    const gasConfig = {
        maxPriorityFeePerGas: ethers.utils.parseUnits("25", "gwei"), // Ajuste conforme a rede
        maxFeePerGas: ethers.utils.parseUnits("50", "gwei"), // Ajuste conforme a rede
        gasLimit: 1000000
    };

    const ArbitrumTokenContract = new ethers.Contract(tokenAddressArbitrum, TokenABI.abi, arbitrumWallet);
    const ArbitrumNotaryContract = new ethers.Contract(notaryAddressArbitrum, NotaryABI.abi, arbitrumWallet);
    const amoyTokenContract = new ethers.Contract(tokenAddressAmoy, TokenABI.abi, amoyWallet);
    const amoyNotaryContract = new ethers.Contract(notaryAddressAmoy, NotaryABI.abi, amoyWallet);
    
    const amount = parseEther('10');
    const aproveArbitrum = await ArbitrumTokenContract.connect(arbitrumWallet).approve(ArbitrumNotaryContract.address, amount, gasConfig);
    await aproveArbitrum.wait();

    const stakeArbitrum = await ArbitrumNotaryContract.connect(arbitrumWallet).stake(amount, gasConfig);
    await stakeArbitrum.wait();

    console.log("amount: ", await ArbitrumTokenContract.allowance(arbitrumWallet.address, notaryAddressArbitrum));
    console.log("balanceOf: ", await ArbitrumTokenContract.balanceOf(notaryAddressArbitrum));

    const aproveAmoy = await amoyTokenContract.connect(amoyWallet).approve(amoyNotaryContract.address, amount, gasConfig);
    await aproveAmoy.wait();

    const stakeAmoy = await amoyNotaryContract.connect(amoyWallet).stake(amount, gasConfig);
    await stakeAmoy.wait();

    console.log("amount: ", await amoyTokenContract.allowance(amoyWallet.address, notaryAddressAmoy));
    console.log("balanceOf: ", await amoyTokenContract.balanceOf(notaryAddressAmoy));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
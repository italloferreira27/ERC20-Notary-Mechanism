require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require('fs');
require("dotenv").config();
const { parseEther } = require('ethers/lib/utils');

const NotaryABI = require("../artifacts/contracts/Notary.sol/Notary.json");
const TokenABI = require("../artifacts/contracts/Token.sol/Token.json");

const {NODE_URL_AVALANCHE, NODE_URL_AMOY, AVALANCHE_PRIVATE_KEY01, AMOY_PRIVATE_KEY01} = process.env;

const avalancheProvider = new ethers.providers.JsonRpcProvider(NODE_URL_AVALANCHE);
const amoyProvider = new ethers.providers.JsonRpcProvider(NODE_URL_AMOY);

const avalancheWallet = new ethers.Wallet(AVALANCHE_PRIVATE_KEY01, avalancheProvider);
const amoyWallet = new ethers.Wallet(AMOY_PRIVATE_KEY01, amoyProvider);

const tokenAddressAvalanche = "0x704aDB991E8C5Bc72A00f064D0A4f2fF8c2C8A1B"; // Preencha com o endereço do token na Avalanche
const notaryAddressAvalanche = "0x8070cDb82E1991866dbb459e13A7b38e0662e7A8"; // Preencha com o endereço do notário na Avalanche

const tokenAddressAmoy = "0x6a288157c6fA51014289Ad0b133D4cdb67bD78E9"; // Preencha com o endereço do token na Amoy
const notaryAddressAmoy = "0x27f677B17e0acc9207A2648B664F866c7f278AA5"; // Preencha com o endereço do notário na Amoy

async function main() {

    const gasConfig = {
        maxPriorityFeePerGas: ethers.utils.parseUnits("25", "gwei"), // Ajuste conforme a rede
        maxFeePerGas: ethers.utils.parseUnits("50", "gwei"), // Ajuste conforme a rede
        gasLimit: 1000000
    };

    const AvalancheTokenContract = new ethers.Contract(tokenAddressAvalanche, TokenABI.abi, avalancheWallet);
    const AvalancheNotaryContract = new ethers.Contract(notaryAddressAvalanche, NotaryABI.abi, avalancheWallet);
    const amoyTokenContract = new ethers.Contract(tokenAddressAmoy, TokenABI.abi, amoyWallet);
    const amoyNotaryContract = new ethers.Contract(notaryAddressAmoy, NotaryABI.abi, amoyWallet);

    const amount = parseEther('500000');
    const approveAvalanche = await AvalancheTokenContract.connect(avalancheWallet).approve(AvalancheNotaryContract.address, amount, gasConfig);
    await approveAvalanche.wait();

    const stakeAvalanche = await AvalancheNotaryContract.connect(avalancheWallet).stake(amount, gasConfig);
    await stakeAvalanche.wait();

    console.log("amount: ", await AvalancheTokenContract.allowance(avalancheWallet.address, notaryAddressAvalanche));
    console.log("balanceOf: ", await AvalancheTokenContract.balanceOf(notaryAddressAvalanche));

    const approveAmoy = await amoyTokenContract.connect(amoyWallet).approve(amoyNotaryContract.address, amount, gasConfig);
    await approveAmoy.wait();

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

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
const fs = require('fs');
require("dotenv").config();
const { utils } = require("ethers");
const { parseEther } = require('ethers/lib/utils');
const axios = require('axios');


const NotaryABI = require("../artifacts/contracts/Notary.sol/Notary.json");
const TokenABI = require("../artifacts/contracts/Token.sol/Token.json");

const { NODE_URL_AVALANCHE, NODE_URL_AMOY, AVALANCHE_PRIVATE_KEY01, AVALANCHE_PRIVATE_KEY02, AMOY_PRIVATE_KEY01, AMOY_PRIVATE_KEY02 } = process.env;

async function getCryptoPrice(cryptoId) {
    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd`);
        const price = response.data[cryptoId].usd;
        return price;
    } catch (error) {
        console.error(`Erro ao buscar o preço de ${cryptoId}:`, error);
        return null;
    }
}

async function main() {
    const tokenAddressAvalanche = "0x704aDB991E8C5Bc72A00f064D0A4f2fF8c2C8A1B";
    const notaryAddressAvalanche = "0x8070cDb82E1991866dbb459e13A7b38e0662e7A8";

    const tokenAddressAmoy = "0x6a288157c6fA51014289Ad0b133D4cdb67bD78E9";
    const notaryAddressAmoy = "0x27f677B17e0acc9207A2648B664F866c7f278AA5";  

    const avalancheProvider = new ethers.providers.JsonRpcProvider(NODE_URL_AVALANCHE);
    const amoyProvider = new ethers.providers.JsonRpcProvider(NODE_URL_AMOY);

    const avalancheWallet = new ethers.Wallet(AVALANCHE_PRIVATE_KEY01, avalancheProvider);
    const amoyWallet = new ethers.Wallet(AMOY_PRIVATE_KEY01, amoyProvider);

    const avalancheTokenContract = new ethers.Contract(tokenAddressAvalanche, TokenABI.abi, avalancheWallet);
    const avalancheNotaryContract = new ethers.Contract(notaryAddressAvalanche, NotaryABI.abi, avalancheWallet);
    const amoyTokenContract = new ethers.Contract(tokenAddressAmoy, TokenABI.abi, amoyWallet);
    const amoyNotaryContract = new ethers.Contract(notaryAddressAmoy, NotaryABI.abi, amoyWallet);

    const networkName = hre.network.name;
    const chainIdHex = await hre.network.provider.send("eth_chainId");
    const chainIdDec = parseInt(chainIdHex, 16);
    console.log(`Network: ${networkName} | ChainId: (${chainIdDec})`);
    
    if (chainIdDec == 43113) { // Avalanche Mainnet Chain ID
        console.log("Avalanche -> Amoy");
        const amount = parseEther('1');
        const fullTimeStart = Date.now();

        const timeAproveAvalancheStart = Date.now(); 
        const approveAvalanche = await avalancheTokenContract.connect(avalancheWallet).approve(
            avalancheNotaryContract.address, 
            amount, 
            { gasLimit: 1000000, maxFeePerGas: ethers.utils.parseUnits('30', 'gwei'), maxPriorityFeePerGas: ethers.utils.parseUnits('1.5', 'gwei') }
        );

        const receiptAvalancheApprove = await approveAvalanche.wait();
        const gasUsedApproveAvalanche = receiptAvalancheApprove.gasUsed;
        const timeAproveAvalancheEnd = Date.now();
        const timeAproveAvalanche = (timeAproveAvalancheEnd - timeAproveAvalancheStart);

        const publicKeyAmoy02 = utils.computeAddress(AMOY_PRIVATE_KEY02);

        const timeDepositAvalancheStart = Date.now();
        const depositAvalanche = await avalancheNotaryContract.connect(avalancheWallet).deposit(
            amount, 
            publicKeyAmoy02, 
            { gasLimit: 1000000, maxFeePerGas: ethers.utils.parseUnits('30', 'gwei'), maxPriorityFeePerGas: ethers.utils.parseUnits('1.5', 'gwei') }
        );
        const receiptDepositAvalanche = await depositAvalanche.wait();
        const gasUsedDepositAvalanche = receiptDepositAvalanche.gasUsed;
        const timeDepositAvalancheEnd = Date.now();
        const timeDepositAvalanche = (timeDepositAvalancheEnd - timeDepositAvalancheStart);

        const id = await avalancheNotaryContract.lastDepositID();
        console.log("ID último depósito: ", id.toString());

        const timeExecuteBridgeAmoyStart = Date.now();
        const executeBridgeAmoy = await amoyNotaryContract.connect(amoyWallet).executeBridge(
            id, 
            publicKeyAmoy02, 
            amount, 
            { 
                gasLimit: 1000000, 
                maxFeePerGas: ethers.utils.parseUnits('30', 'gwei'), 
                maxPriorityFeePerGas: ethers.utils.parseUnits('25', 'gwei') 
            }
        );
        const receiptExecuteBridgeAmoy = await executeBridgeAmoy.wait();
        const gasUsedExecuteBridgeAmoy = receiptExecuteBridgeAmoy.gasUsed;
        const timeExecuteBridgeAmoyEnd = Date.now();
        const timeExecuteBridgeAmoy = (timeExecuteBridgeAmoyEnd - timeExecuteBridgeAmoyStart);

        console.log("BalanceOf: ", await amoyTokenContract.balanceOf(publicKeyAmoy02));

        const fullTimeEnd = Date.now();
        const fullTime = (fullTimeEnd - fullTimeStart);
        console.log("Full Time: ", fullTime, "ms");

        const gasPriceAmoy = await amoyProvider.getGasPrice();
        const gasPriceAvalanche = await avalancheProvider.getGasPrice();

        // Data
        const timeElapsed = Date.now();
        const today = new Date(timeElapsed);
        const date = today.toISOString();
        console.log("\nDate: ", date);

        // Preço
        const cryptoId = 'avalanche-2';  // Avalanche
        const cryptoId2 = 'matic-network';        // Amoy  
        const priceAvalanche = await getCryptoPrice(cryptoId);
        const priceAmoy = await getCryptoPrice(cryptoId2);

        if (priceAvalanche !== null || priceAmoy !== null) {
            console.log(`Preço atual de ${cryptoId} em USD: $${priceAvalanche}`);
            console.log(`Preço atual de ${cryptoId2} em USD: $${priceAmoy}`);
        }

        const csvData = [
            [date, gasUsedApproveAvalanche.toString(), gasUsedDepositAvalanche.toString(), gasUsedExecuteBridgeAmoy.toString(), timeAproveAvalanche, timeDepositAvalanche, timeExecuteBridgeAmoy, priceAvalanche, priceAmoy, fullTime, gasPriceAvalanche.toString(), gasPriceAmoy.toString()]
        ];

        const csvContent = csvData.map(e => e.join(",")).join("\n");

        if (!fs.existsSync('./metrics/transactionAvalanche_Amoy.csv')) {
            const headers = 'date,gasUsedApproveAvalanche,gasUsedDepositAvalanche,gasUsedExecuteBridgeAmoy,timeAproveAvalanche,timeDepositAvalanche,timeExecuteBridgeAmoy,priceAvalanche,priceAmoy,full Time(ms),gasPriceAvalanche,gasPriceAmoy\n';
            fs.appendFileSync('./metrics/transactionAvalanche_Amoy.csv', headers);
        }
    
        // Append the CSV data to the file
        fs.appendFileSync('./metrics/transactionAvalanche_Amoy.csv', csvContent + '\n', (err) => {
            if (err) {
                console.error('Error writing to file', err);
            } else {
                console.log('Data successfully appended to CSV file!');
            }
        });
    } else if (chainIdDec == 80002) { // AMOY Chain ID
        console.log("Amoy -> Fuji");

        const gasConfig = {
            maxPriorityFeePerGas: ethers.utils.parseUnits("30", "gwei"), // Ajuste conforme a rede
            maxFeePerGas: ethers.utils.parseUnits("60", "gwei"), // Ajuste conforme a rede
            gasLimit: 1000000
        };

        const amount = parseEther('1');
        const fullTimeStart = Date.now();

        const timeAproveAmoyStart = Date.now();
        const aproveAmoy = await amoyTokenContract.connect(amoyWallet).approve(
            amoyNotaryContract.address, 
            amount, 
            gasConfig
        );
        const receiptAmoyAprove = await aproveAmoy.wait();
        const gasUsedApproveAmoy = receiptAmoyAprove.gasUsed;
        const timeAproveAmoyEnd = Date.now();
        const timeAproveAmoy = (timeAproveAmoyEnd - timeAproveAmoyStart);

        const publicKeyAvax02 = utils.computeAddress(AVALANCHE_PRIVATE_KEY02);

        const timeDepositAmoyStart = Date.now();
        const depositAmoy = await amoyNotaryContract.connect(amoyWallet).deposit(
            amount, 
            publicKeyAvax02, 
            gasConfig
        );
        const receiptDepositAmoy = await depositAmoy.wait();
        const gasUsedDepositAmoy = receiptDepositAmoy.gasUsed;
        const timeDepositAmoyEnd = Date.now();
        const timeDepositAmoy = (timeDepositAmoyEnd - timeDepositAmoyStart);

        const id = await amoyNotaryContract.lastDepositID();
        console.log("id last deposit: ", id.toString());

        const timeExecuteBridgeAvalancheStart = Date.now();
        const executeBridgeAvax = await avalancheNotaryContract.connect(avalancheWallet).executeBridge(
            id, 
            publicKeyAvax02, 
            amount, 
            { 
                gasLimit: 1000000, 
                maxFeePerGas: ethers.utils.parseUnits('60', 'gwei'), 
                maxPriorityFeePerGas: ethers.utils.parseUnits('30', 'gwei') 
            }
        );
        const receiptExecuteBridgeAvax = await executeBridgeAvax.wait();
        const gasUsedExecuteBridgeAvalanche = receiptExecuteBridgeAvax.gasUsed;
        const timeExecuteBridgeAvalancheEnd = Date.now();
        const timeExecuteBridgeAvalanche = (timeExecuteBridgeAvalancheEnd - timeExecuteBridgeAvalancheStart);

        console.log("balanceOf: ", await avalancheTokenContract.balanceOf(publicKeyAvax02));

        const fullTimeEnd = Date.now();
        const fullTime = (fullTimeEnd - fullTimeStart);
        console.log("Full Time: ", fullTime, "ms");

        const gasPriceAmoy = await amoyProvider.getGasPrice();
        const gasPriceAvax = await avalancheProvider.getGasPrice();

        // date
        const timeElapsed = Date.now();
        const today = new Date(timeElapsed);
        const date = today.toISOString();
        console.log("\nDate: ", date);

        // price
        const cryptoId = 'avalanche-2';   // Avalanche
        const cryptoId2 = 'matic-network';  // Amoy
        const priceAvax = await getCryptoPrice(cryptoId);
        const priceAmoy = await getCryptoPrice(cryptoId2);

        if (priceAmoy !== null || priceAvax !== null) {
            console.log(`Preço atual de ${cryptoId} em USD: $${priceAvax}`);
            console.log(`Preço atual de ${cryptoId2} em USD: $${priceAmoy}`);
        }

        const csvData = [
            [date, gasUsedApproveAmoy.toString(), gasUsedDepositAmoy.toString(), gasUsedExecuteBridgeAvalanche.toString(), timeAproveAmoy, timeDepositAmoy, timeExecuteBridgeAvalanche, priceAmoy, priceAvax, fullTime, gasPriceAmoy.toString(), gasPriceAvax.toString()]
        ];

        // Convert array to CSV string
        const csvContent = csvData.map(e => e.join(",")).join("\n");

        // Check if the file already exists, if not, add headers
        if (!fs.existsSync('./metrics/transactionAmoy_Avalanche.csv')) {
            const headers = 'date,gasUsedApproveAmoy,gasUsedDepositAmoy,gasUsedExecuteBridgeAvalanche,timeAproveAmoy,timeDepositAmoy,timeExecuteBridgeAvalanche,priceAmoy,priceAvax(USD),full Time(ms),gasPriceAmoy,gasPriceAvax\n';
            fs.appendFileSync('./metrics/transactionAmoy_Avalanche.csv', headers);
        }

        // Append the CSV data to the file
        fs.appendFileSync('./metrics/transactionAmoy_Avalanche.csv', csvContent + '\n', (err) => {
            if (err) {
                console.error('Error writing to file', err);
            } else {
                console.log('Data successfully appended to CSV file!');
            }
        });
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
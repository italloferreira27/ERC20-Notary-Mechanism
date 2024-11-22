require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
const fs = require('fs');
require("dotenv").config();
const { utils } = require("ethers");
const { parseEther } = require('ethers/lib/utils');
const axios = require('axios');


const NotaryABI = require("../artifacts/contracts/Notary.sol/Notary.json");
const TokenABI = require("../artifacts/contracts/Token.sol/Token.json");

const {NODE_URL_ARBITRUM, NODE_URL_AMOY, ARBITRUM_PRIVATE_KEY01, AMOY_PRIVATE_KEY01, AMOY_PRIVATE_KEY02} = process.env;

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
    const tokenAddressArbitrum = "0x5C86F4a99047385927284BacFD088B071Bdb4936";
    const notaryAddressArbitrum = "0xAC02A4C9CA4Be4eFDA700712d2593578BDB89F67";
    
    const tokenAddressAmoy = "0xa30Cd28aEE64f98b72d0f18C19B772c7D42c4908";
    const notaryAddressAmoy = "0xC29C149dA1FAe5B55aB2896E9BaB3EA35E5b89d1";  

    const arbitrumProvider = new ethers.providers.JsonRpcProvider(NODE_URL_ARBITRUM);
    const amoyProvider = new ethers.providers.JsonRpcProvider(NODE_URL_AMOY);

    const arbitrumWallet = new ethers.Wallet(ARBITRUM_PRIVATE_KEY01, arbitrumProvider);
    const amoyWallet = new ethers.Wallet(AMOY_PRIVATE_KEY01, amoyProvider);

    const arbitrumTokenContract = new ethers.Contract(tokenAddressArbitrum, TokenABI.abi, arbitrumWallet);
    const arbitrumNotaryContract = new ethers.Contract(notaryAddressArbitrum, NotaryABI.abi, arbitrumWallet);
    const amoyTokenContract = new ethers.Contract(tokenAddressAmoy, TokenABI.abi, amoyWallet);
    const amoyNotaryContract = new ethers.Contract(notaryAddressAmoy, NotaryABI.abi, amoyWallet);

    const networkName = hre.network.name;
    const chainIdHex = await hre.network.provider.send("eth_chainId");
    const chainIdDec = parseInt(chainIdHex, 16);
    console.log(`Network: ${networkName} | ChainId: (${chainIdDec})`);
    
    if(chainIdDec == 421614){
        console.log("Arbitrum -> Amoy")
        const amount = parseEther('1');
        const fullTimeStart = Date.now();

        const timeAproveArbitrumStart = Date.now(); 
        const aproveArbitrum = await arbitrumTokenContract.connect(arbitrumWallet).approve(
            arbitrumNotaryContract.address, 
            amount, 
            { gasLimit: 1000000, maxFeePerGas: ethers.utils.parseUnits('30', 'gwei'), maxPriorityFeePerGas: ethers.utils.parseUnits('1.5', 'gwei') }
        );
        const receiptArbitrumAprove = await aproveArbitrum.wait();
        const gasUsedApproveArbitrum = receiptArbitrumAprove.gasUsed;
        const timeAproveArbitrumEnd = Date.now();
        const timeAproveArbitrum = (timeAproveArbitrumEnd - timeAproveArbitrumStart);

        const publicKeyAmoy02 = utils.computeAddress(AMOY_PRIVATE_KEY02);

        const timeDepositArbitrumStart = Date.now();
        const depositArbitrum = await arbitrumNotaryContract.connect(arbitrumWallet).deposit(
            amount, 
            publicKeyAmoy02, 
            { gasLimit: 1000000, maxFeePerGas: ethers.utils.parseUnits('30', 'gwei'), maxPriorityFeePerGas: ethers.utils.parseUnits('1.5', 'gwei') }
        );
        const receiptDepositArbitrum = await depositArbitrum.wait();
        const gasUsedDepositArbitrum = receiptDepositArbitrum.gasUsed;
        const timeDepositArbitrumEnd = Date.now();
        const timeDepositArbitrum = (timeDepositArbitrumEnd - timeDepositArbitrumStart);

        const id = await arbitrumNotaryContract.lastDepositID();
        console.log("id lasr deposit: ", id.toString());

        
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
        
        console.log("balanceOf: ", await amoyTokenContract.balanceOf(publicKeyAmoy02));

        const fullTimeEnd = Date.now();
        const fullTime = (fullTimeEnd - fullTimeStart);
        console.log("Full Time: ", fullTime, "ms");
        
        const gasPriceAmoy = await amoyProvider.getGasPrice();
        const gasPriceArbitrum = await arbitrumProvider.getGasPrice();

        // date
        const timeElapsed = Date.now();
        const today = new Date(timeElapsed);
        const date = today.toISOString();
        console.log("\nDate: ", date);

        // price
        const cryptoId = 'matic-network';  // Amoy
        const cryptoId2 = 'ethereum';      // Arbitrum  
        const priceAmoy = await getCryptoPrice(cryptoId);
        const priceArbitrum = await getCryptoPrice(cryptoId2);

        if (priceAmoy !== null || priceArbitrum !== null) {
            console.log(`Preço atual de ${cryptoId} em USD: $${priceAmoy}`);
            console.log(`Preço atual de ${cryptoId2} em USD: $${priceArbitrum}`);
        }


        const csvData = [
            [date, gasUsedApproveArbitrum.toString(), gasUsedDepositArbitrum.toString(), gasUsedExecuteBridgeAmoy.toString(), timeAproveArbitrum, timeDepositArbitrum, timeExecuteBridgeAmoy, priceAmoy, priceArbitrum, fullTime, gasPriceAmoy.toString(), gasPriceArbitrum.toString()]
        ];

        // Convert array to CSV string
        const csvContent = csvData.map(e => e.join(",")).join("\n");

        // Check if the file already exists, if not, add headers
        if (!fs.existsSync('./metrics/transactionArb_Amoy.csv')) {
            const headers = 'date,gasUsedApproveArbitrum,gasUsedDepositArbitrum,gasUsedExecuteBridgeAmoy,timeAproveArbitrum,timeDepositArbitrum,timeExecuteBridgeAmoy,priceAmoy,priceArbitrum(USD),priceArbitrum(USD),priceArbitrum (USD),full Time(ms),gasPriceAmoy,gasPriceArbitrum\n';
            fs.appendFileSync('./metrics/transactionArb_Amoy.csv', headers);
        }

        // Append the CSV data to the file
        fs.appendFileSync('./metrics/transactionArb_Amoy.csv', csvContent + '\n', (err) => {
            if (err) {
                console.error('Error writing to file', err);
            } else {
                console.log('Data successfully appended to CSV file!');
            }
        });
    }else if(chainIdDec == 80002){
        console.log("Amoy -> Arbitrum");
        
        const gasConfig = {
            maxPriorityFeePerGas: ethers.utils.parseUnits("25", "gwei"), // Ajuste conforme a rede
            maxFeePerGas: ethers.utils.parseUnits("50", "gwei"), // Ajuste conforme a rede
            gasLimit: 1000000
        };
        
        const amount = parseEther('1');
        const fullTimeStart = Date.now();

        const timeAproveAmoyStart = Date.now();
        const aproveAmoy = await amoyTokenContract.connect(amoyWallet).approve(
            amoyNotaryContract.address, 
            amount, 
            gasConfig//{ gasLimit: 1000000, maxFeePerGas: ethers.utils.parseUnits('30', 'gwei'), maxPriorityFeePerGas: ethers.utils.parseUnits('1.5', 'gwei') }
        );
        const receiptAmoyAprove = await aproveAmoy.wait();
        const gasUsedApproveAmoy = receiptAmoyAprove.gasUsed;
        const timeAproveAmoyEnd = Date.now();
        const timeAproveAmoy = (timeAproveAmoyEnd - timeAproveAmoyStart);

        const publicKeyArbitrum02 = utils.computeAddress(AMOY_PRIVATE_KEY02);

        const timeDepositAmoyStart = Date.now();
        const depositAmoy = await amoyNotaryContract.connect(amoyWallet).deposit(
            amount, 
            publicKeyArbitrum02, 
            gasConfig//{ gasLimit: 1000000, maxFeePerGas: ethers.utils.parseUnits('30', 'gwei'), maxPriorityFeePerGas: ethers.utils.parseUnits('1.5', 'gwei') }
        );
        const receiptDepositAmoy = await depositAmoy.wait();
        const gasUsedDepositAmoy = receiptDepositAmoy.gasUsed;
        const timeDepositAmoyEnd = Date.now();
        const timeDepositAmoy = (timeDepositAmoyEnd - timeDepositAmoyStart);

        const id = await amoyNotaryContract.lastDepositID();
        console.log("id lasr deposit: ", id.toString());

        const timeExecuteBridgeArbitrumStart = Date.now();
        const executeBridgeArbitrum = await arbitrumNotaryContract.connect(arbitrumWallet).executeBridge(
            id, 
            publicKeyArbitrum02, 
            amount, 
            { 
                gasLimit: 1000000, 
                maxFeePerGas: ethers.utils.parseUnits('30', 'gwei'), 
                maxPriorityFeePerGas: ethers.utils.parseUnits('25', 'gwei') 
            }
        );
        const receiptExecuteBridgeArbitrum = await executeBridgeArbitrum.wait();
        const gasUsedExecuteBridgeArbitrum = receiptExecuteBridgeArbitrum.gasUsed;
        const timeExecuteBridgeArbitrumEnd = Date.now();
        const timeExecuteBridgeArbitrum = (timeExecuteBridgeArbitrumEnd - timeExecuteBridgeArbitrumStart);

        console.log("balanceOf: ", await arbitrumTokenContract.balanceOf(publicKeyArbitrum02));

        const fullTimeEnd = Date.now();
        const fullTime = (fullTimeEnd - fullTimeStart);
        console.log("Full Time: ", fullTime, "ms");

        const gasPriceAmoy = await amoyProvider.getGasPrice();
        const gasPriceArbitrum = await arbitrumProvider.getGasPrice();

        // date
        const timeElapsed = Date.now();
        const today = new Date(timeElapsed);
        const date = today.toISOString();
        console.log("\nDate: ", date);

        // price
        const cryptoId = 'ethereum';      // Arbitrum
        const cryptoId2 = 'matic-network';  // Amoy
        const priceArbitrum = await getCryptoPrice(cryptoId);
        const priceAmoy = await getCryptoPrice(cryptoId2);

        if (priceAmoy !== null || priceArbitrum !== null) {
            console.log(`Preço atual de ${cryptoId} em USD: $${priceArbitrum}`);
            console.log(`Preço atual de ${cryptoId2} em USD: $${priceAmoy}`);
        }

        const csvData = [
            [date, gasUsedApproveAmoy.toString(), gasUsedDepositAmoy.toString(), gasUsedExecuteBridgeArbitrum.toString(), timeAproveAmoy, timeDepositAmoy, timeExecuteBridgeArbitrum, priceAmoy, priceArbitrum, fullTime, gasPriceAmoy.toString(), gasPriceArbitrum.toString()]
        ];

        // Convert array to CSV string
        const csvContent = csvData.map(e => e.join(",")).join("\n");

        // Check if the file already exists, if not, add headers
        if (!fs.existsSync('./metrics/transactionAmoy_Arb.csv')) {
            const headers = 'date,gasUsedApproveAmoy,gasUsedDepositAmoy,gasUsedExecuteBridgeArbitrum,timeAproveAmoy,timeDepositAmoy,timeExecuteBridgeArbitrum,priceAmoy,priceArbitrum(USD),full Time(ms),gasPriceAmoy,gasPriceArbitrum\n';
            fs.appendFileSync('./metrics/transactionAmoy_Arb.csv', headers);
        }

        // Append the CSV data to the file
        fs.appendFileSync('./metrics/transactionAmoy_Arb.csv', csvContent + '\n', (err) => {
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

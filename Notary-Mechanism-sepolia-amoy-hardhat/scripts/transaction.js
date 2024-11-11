require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require('fs');
require("dotenv").config();
const { utils } = require("ethers");
const { parseEther } = require('ethers/lib/utils');

const NotaryABI = require("../artifacts/contracts/Notary.sol/Notary.json");
const TokenABI = require("../artifacts/contracts/Token.sol/Token.json");

const {NODE_URL_ARBITRUM, NODE_URL_AMOY, ARBITRUM_PRIVATE_KEY01, AMOY_PRIVATE_KEY01, AMOY_PRIVATE_KEY02} = process.env;

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

    const amount = parseEther('1');
    
    const aproveArbitrum = await arbitrumTokenContract.connect(arbitrumWallet).approve(
        arbitrumNotaryContract.address, 
        amount, 
        { gasLimit: 1000000, maxFeePerGas: ethers.utils.parseUnits('30', 'gwei'), maxPriorityFeePerGas: ethers.utils.parseUnits('1.5', 'gwei') }
    );
    await aproveArbitrum.wait();

    const publicKeyAmoy02 = utils.computeAddress(AMOY_PRIVATE_KEY02);

    const depositArbitrum = await arbitrumNotaryContract.connect(arbitrumWallet).deposit(
        amount, 
        publicKeyAmoy02, 
        { gasLimit: 1000000, maxFeePerGas: ethers.utils.parseUnits('30', 'gwei'), maxPriorityFeePerGas: ethers.utils.parseUnits('1.5', 'gwei') }
    );
    await depositArbitrum.wait();
    console.log("id: ", await arbitrumNotaryContract.lastDepositID());

    const executeBridgeAmoy = await amoyNotaryContract.connect(amoyWallet).executeBridge(
        10001, 
        publicKeyAmoy02, 
        amount, 
        { 
            gasLimit: 1000000, 
            maxFeePerGas: ethers.utils.parseUnits('30', 'gwei'), 
            maxPriorityFeePerGas: ethers.utils.parseUnits('25', 'gwei') 
        }
    );
    await executeBridgeAmoy.wait();
    
    console.log("balanceOf: ", await amoyTokenContract.balanceOf(publicKeyAmoy02));
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

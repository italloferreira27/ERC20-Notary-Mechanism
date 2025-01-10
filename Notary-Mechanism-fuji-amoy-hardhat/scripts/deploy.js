require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

const {AVALANCHE_PRIVATE_KEY01, AVALANCHE_PRIVATE_KEY02, AVALANCHE_PRIVATE_KEY03, AMOY_PRIVATE_KEY01, AMOY_PRIVATE_KEY02,AMOY_PRIVATE_KEY03} = process.env;

async function main() {
    const networkName = hre.network.name;
    const chainIdHex = await hre.network.provider.send("eth_chainId");
    const chainIdDec = parseInt(chainIdHex, 16);
    let holders;
    console.log(`Network: ${networkName} | ChainId: (${chainIdDec})`);

    if(chainIdDec == 43113){
        console.log("Deploying on AVALANCHE:");
        holders = [
            new ethers.Wallet(AVALANCHE_PRIVATE_KEY01).address,
            new ethers.Wallet(AVALANCHE_PRIVATE_KEY02).address,
            new ethers.Wallet(AVALANCHE_PRIVATE_KEY03).address
        ];

        // console.log(`private keys: ${holders}`);

    }else if(chainIdDec == 80002){
        console.log("Deploying on AMOY:");
        holders = [
            new ethers.Wallet(AMOY_PRIVATE_KEY01).address,
            new ethers.Wallet(AMOY_PRIVATE_KEY02).address,
            new ethers.Wallet(AMOY_PRIVATE_KEY03).address
        ];

        // console.log(`private keys: ${holders}`);

    }else{
        throw new Error("Please indicate your network! (sepolia or amoy)");
    }

    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy(holders);
    console.log("Tokens address: ", token.address);

    const Notary = await ethers.getContractFactory("Notary");
    const notary = await Notary.deploy(token.address);
    console.log("Notary address: ", notary.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

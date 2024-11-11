/** @type import('hardhat/config').HardhatUserConfig */
require('@nomiclabs/hardhat-ethers');
require("dotenv").config();

const {ALCHEMY_API_KEY, NODE_URL_ARBITRUM, NODE_URL_AMOY, CHAIN_ID_ARBITRUM, CHAIN_ID_AMOY, ARBITRUM_PRIVATE_KEY01, ARBITRUM_PRIVATE_KEY02, ARBITRUM_PRIVATE_KEY03, AMOY_PRIVATE_KEY01, AMOY_PRIVATE_KEY02,AMOY_PRIVATE_KEY03} = process.env;

module.exports = {
  solidity: "0.8.24",

  networks: {
    hardhat: {
    },
    arbitrum: {
      url: `https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      chainId: 421614,
      accounts: [ARBITRUM_PRIVATE_KEY01, ARBITRUM_PRIVATE_KEY02, ARBITRUM_PRIVATE_KEY03],
    },
    amoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      chainId: 80002,
      accounts: [AMOY_PRIVATE_KEY01, AMOY_PRIVATE_KEY02, AMOY_PRIVATE_KEY03],
    },
  },
};
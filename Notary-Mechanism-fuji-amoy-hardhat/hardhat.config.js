/** @type import('hardhat/config').HardhatUserConfig */
require('@nomiclabs/hardhat-waffle');
require("dotenv").config();

module.exports = {
  solidity: "0.8.24",

  networks: {
    hardhat: {
    },
    avalanche: {
      url: `${process.env.NODE_URL_AVALANCHE}`,
      chainId: 43113,
      accounts: [process.env.AVALANCHE_PRIVATE_KEY01, process.env.AVALANCHE_PRIVATE_KEY02, process.env.AVALANCHE_PRIVATE_KEY03],
    },
    amoy: {
      url: `${process.env.NODE_URL_AMOY}`,
      chainId: 80002,
      accounts: [process.env.AMOY_PRIVATE_KEY01, process.env.AMOY_PRIVATE_KEY02, process.env.AMOY_PRIVATE_KEY03],
    },
  },
};

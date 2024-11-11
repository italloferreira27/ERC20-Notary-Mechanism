// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    uint256 public constant MINT_AMOUNT_PER_USER = 1000000;

    constructor(address[] memory holders) ERC20("Token", "TK") {
        for (uint256 i = 0; i < holders.length; i++) {
            _mint(holders[i], MINT_AMOUNT_PER_USER * 10 ** decimals());
        }
    }
}
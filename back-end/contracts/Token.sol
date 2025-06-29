// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {

    address admin;
    address public factoryAddress;

    constructor(string memory name, string memory symbol, uint initiaMintValue, address _factoryAddress) ERC20(name,symbol){
        _mint(msg.sender, initiaMintValue);
        admin = msg.sender;
        factoryAddress = _factoryAddress;
    }

    function mint(uint qty, address receiver) external returns(uint){
        
        require(msg.sender == admin, "caller not admin");
        _mint(receiver,qty);
        return 1;
    }

    function burn(address from, uint amount) external {
        require(msg.sender == factoryAddress, "Only factory can burn");
        _burn(from, amount);
    }

}
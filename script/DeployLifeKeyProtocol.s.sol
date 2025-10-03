// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {LifeKeyProtocol} from "../src/LifeKeyProtocol.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployLifeKeyProtocolScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the implementation contract
        LifeKeyProtocol implementation = new LifeKeyProtocol();

        // Prepare the initializer data (assuming initialize() is the correct initializer)
        bytes memory initializer = abi.encodeWithSignature("initialize()");

        // Deploy the proxy, pointing to the implementation and calling initialize()
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initializer
        );

        // Log addresses
        console.log(
            "LifeKeyProtocol implementation deployed at:",
            address(implementation)
        );
        console.log("LifeKeyProtocol proxy deployed at:", address(proxy));

        vm.stopBroadcast();
    }
}

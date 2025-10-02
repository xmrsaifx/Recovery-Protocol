// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {LifeKeyProtocol} from "../src/LifeKeyProtocol.sol";

contract CounterScript is Script {
    LifeKeyProtocol public lifeKeyProtocol;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        lifeKeyProtocol = new LifeKeyProtocol();

        vm.stopBroadcast();
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {LifeKeyProtocol} from "../src/LifeKeyProtocol.sol";

contract LifeKeyProtocolTest is Test {
    LifeKeyProtocol internal protocol;

    address internal constant UPGRADE_ADMIN = address(0xA11CE);
    address internal constant OWNER = address(0x01);
    address internal constant BENEFICIARY_ONE = address(0x02);
    address internal constant BENEFICIARY_TWO = address(0x03);
    address internal constant BENEFICIARY_THREE = address(0x04);
    address internal constant NEW_OWNER = address(0x05);

    event LifeKeyCreated(
        uint256 indexed lifeKeyId,
        address indexed owner,
        address[] beneficiaries,
        address[] assets
    );

    event BeneficiariesUpdated(
        uint256 indexed lifeKeyId,
        address indexed owner,
        address[] newBeneficiaries
    );

    event BeneficiariesRemoved(
        uint256 indexed lifeKeyId,
        address indexed owner,
        address[] removedBeneficiaries
    );

    event AssetsAdded(
        uint256 indexed lifeKeyId,
        address indexed owner,
        address[] newAssets
    );

    event RecoveryCancelled(uint256 indexed lifeKeyId, address indexed owner);

    event LifeKeyDeleted(uint256 indexed lifeKeyId, address indexed owner);

    event RecoveryClaimed(
        uint256 indexed lifeKeyId,
        address indexed previousOwner,
        address indexed newOwner
    );

    function setUp() external {
        LifeKeyProtocol implementation = new LifeKeyProtocol();
        bytes memory initData = abi.encodeCall(LifeKeyProtocol.initialize, ());
        vm.prank(UPGRADE_ADMIN);
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );
        protocol = LifeKeyProtocol(address(proxy));
    }

    function testCreateLifeKeyEmitsEvent() external {
        address[] memory beneficiaries = _beneficiariesTwo();
        address[] memory assets = _assetsSingle();

        vm.expectEmit(true, true, false, true, address(protocol));
        emit LifeKeyCreated(1, OWNER, beneficiaries, assets);

        vm.prank(OWNER);
        protocol.createLifeKey(beneficiaries, assets);
    }

    function testUpdateBeneficiariesEmitsEvent() external {
        uint256 id = _createDefaultLifeKey();
        address[] memory updatedBeneficiaries = new address[](1);
        updatedBeneficiaries[0] = BENEFICIARY_ONE;

        vm.expectEmit(true, true, false, true, address(protocol));
        emit BeneficiariesUpdated(id, OWNER, updatedBeneficiaries);

        vm.prank(OWNER);
        protocol.updateBeneficiaries(id, updatedBeneficiaries);
    }

    function testRemoveBeneficiariesEmitsEvent() external {
        uint256 id = _createLifeKeyWithThreeBeneficiaries();
        address[] memory removalTargets = new address[](2);
        removalTargets[0] = BENEFICIARY_ONE;
        removalTargets[1] = BENEFICIARY_THREE;

        address[] memory removed = new address[](2);
        removed[0] = BENEFICIARY_ONE;
        removed[1] = BENEFICIARY_THREE;

        vm.expectEmit(true, true, false, true, address(protocol));
        emit BeneficiariesRemoved(id, OWNER, removed);

        vm.prank(OWNER);
        protocol.removeBeneficiaries(id, removalTargets);
    }

    function testAddAssetsEmitsEvent() external {
        uint256 id = _createDefaultLifeKey();
        address[] memory newAssets = new address[](2);
        newAssets[0] = address(0x10);
        newAssets[1] = address(0x11);

        vm.expectEmit(true, true, false, true, address(protocol));
        emit AssetsAdded(id, OWNER, newAssets);

        vm.prank(OWNER);
        protocol.addAssets(id, newAssets);
    }

    function testCancelRecoveryEmitsEvent() external {
        uint256 id = _createDefaultLifeKey();

        vm.prank(BENEFICIARY_ONE);
        protocol.initiateRecovery(id, NEW_OWNER);

        vm.expectEmit(true, true, false, false, address(protocol));
        emit RecoveryCancelled(id, OWNER);

        vm.prank(OWNER);
        protocol.cancleRecoveryRequest(id);
    }

    function testDeleteLifeKeyEmitsEvent() external {
        uint256 id = _createDefaultLifeKey();

        vm.expectEmit(true, true, false, false, address(protocol));
        emit LifeKeyDeleted(id, OWNER);

        vm.prank(OWNER);
        protocol.deleteLifeKey(id);
    }

    function testClaimLifeKeyEmitsEvent() external {
        uint256 id = _createDefaultLifeKey();

        vm.prank(BENEFICIARY_ONE);
        protocol.initiateRecovery(id, NEW_OWNER);

        vm.prank(BENEFICIARY_TWO);
        protocol.approveRecovery(id);

        vm.expectEmit(true, true, true, false, address(protocol));
        emit RecoveryClaimed(id, OWNER, NEW_OWNER);

        vm.prank(NEW_OWNER);
        protocol.claimLifeKey(id);

        assertFalse(protocol.lifeKeyCreated(OWNER));
    }

    function _createDefaultLifeKey() internal returns (uint256) {
        address[] memory beneficiaries = _beneficiariesTwo();
        address[] memory assets = new address[](0);

        vm.prank(OWNER);
        return protocol.createLifeKey(beneficiaries, assets);
    }

    function _createLifeKeyWithThreeBeneficiaries() internal returns (uint256) {
        address[] memory beneficiaries = new address[](3);
        beneficiaries[0] = BENEFICIARY_ONE;
        beneficiaries[1] = BENEFICIARY_TWO;
        beneficiaries[2] = BENEFICIARY_THREE;

        address[] memory assets = new address[](0);

        vm.prank(OWNER);
        return protocol.createLifeKey(beneficiaries, assets);
    }

    function _beneficiariesTwo() internal pure returns (address[] memory) {
        address[] memory beneficiaries = new address[](2);
        beneficiaries[0] = BENEFICIARY_ONE;
        beneficiaries[1] = BENEFICIARY_TWO;
        return beneficiaries;
    }

    function _assetsSingle() internal pure returns (address[] memory) {
        address[] memory assets = new address[](1);
        assets[0] = address(0x09);
        return assets;
    }
}

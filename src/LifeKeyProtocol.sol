// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title LifeKeyProtocol
 * @notice Minimal beneficiary-driven recovery contract implemented as a UUPS upgradeable proxy target.
 */
contract LifeKeyProtocol is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    struct LifeKey {
        uint256 id;
        address owner;
        address[] beneficiaries;
        address[] assets;
        address newOwner;
        address proposedOwner;
        uint256 approvals;
        bool proposalActive;
    }

    uint256 public lifeKeyID;

    mapping(uint256 => LifeKey) public lifeKeyDetails;
    mapping(address => bool) public lifeKeyCreated;
    mapping(uint256 => mapping(address => uint256))
        private beneficiaryApprovalSnapshot;

    event LifeKeyCreated(uint256 indexed lifeKeyId, address indexed owner);

    event BeneficiariesAdded(
        uint256 indexed lifeKeyId,
        address indexed owner,
        address indexed newBeneficiaries
    );

    event BeneficiariesRemoved(
        uint256 indexed lifeKeyId,
        address indexed owner,
        address indexed removedBeneficiaries
    );

    event AssetsAdded(
        uint256 indexed lifeKeyId,
        address indexed owner,
        address indexed newAssets
    );

    event AssetsRemoved(
        uint256 indexed lifeKeyId,
        address indexed owner,
        address indexed removedAsset
    );

    event RecoveryCancelled(uint256 indexed lifeKeyId, address indexed owner);

    event LifeKeyDeleted(uint256 indexed lifeKeyId, address indexed owner);

    event RecoveryClaimed(
        uint256 indexed lifeKeyId,
        address indexed previousOwner,
        address indexed newOwner
    );

    event RecoveryInitiated(
        uint256 indexed lifeKeyId,
        address indexed initiator,
        address proposedOwner
    );

    event RecoveryApproved(
        uint256 indexed lifeKeyId,
        address indexed beneficiary,
        uint256 approvals
    );
    event RecoveryCompleted(
        uint256 indexed lifeKeyId,
        address indexed newOwner
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() external initializer {
        __Ownable_init(msg.sender);
    }

    function createLifeKey(
        address[] calldata beneficiaries,
        address[] calldata assets
    ) external returns (uint256) {
        require(!lifeKeyCreated[msg.sender], "LifeKey already created");
        lifeKeyID++;
        LifeKey memory newLifeKey = LifeKey({
            id: lifeKeyID,
            owner: msg.sender,
            beneficiaries: beneficiaries,
            assets: assets,
            newOwner: address(0),
            proposedOwner: address(0),
            approvals: 0,
            proposalActive: false
        });

        lifeKeyCreated[msg.sender] = true;
        lifeKeyDetails[lifeKeyID] = newLifeKey;

        emit LifeKeyCreated(lifeKeyID, msg.sender);

        for (uint256 i = 0; i < beneficiaries.length; i++) {
            emit BeneficiariesAdded(
                lifeKeyID,
                newLifeKey.owner,
                beneficiaries[i]
            );
        }

        for (uint256 i = 0; i < assets.length; i++) {
            emit AssetsAdded(lifeKeyID, newLifeKey.owner, assets[i]);
        }

        return lifeKeyID;
    }

    function addBeneficiaries(
        uint256 id,
        address[] calldata newBeneficiaries
    ) external {
        LifeKey storage lifeKey = lifeKeyDetails[id];
        require(lifeKey.id != 0, "LifeKey does not exist");
        require(lifeKey.owner == msg.sender, "Only owner can update");
        for (uint256 i = 0; i < newBeneficiaries.length; i++) {
            address candidate = newBeneficiaries[i];
            require(candidate != address(0), "Invalid beneficiary");
            require(!_isBeneficiary(lifeKey, candidate), "Duplicate beneficiary");
            lifeKey.beneficiaries.push(candidate);
            emit BeneficiariesAdded(id, lifeKey.owner, candidate);
        }
    }

    function deleteLifeKey(uint256 id) external {
        LifeKey storage lifeKey = lifeKeyDetails[id];
        require(lifeKey.id != 0, "LifeKey does not exist");
        require(lifeKey.owner == msg.sender, "Only owner can delete");
        require(!lifeKey.proposalActive, "Active recovery exists");
        address owner = lifeKey.owner;
        delete lifeKeyDetails[id];
        lifeKeyCreated[msg.sender] = false;
        emit LifeKeyDeleted(id, owner);
    }

    function removeBeneficiaries(
        uint256 id,
        address[] calldata beneficiary
    ) external {
        LifeKey storage lifeKey = lifeKeyDetails[id];
        require(lifeKey.id != 0, "LifeKey does not exist");
        require(lifeKey.owner == msg.sender, "Only owner can remove");
        address[] storage beneficiaries = lifeKey.beneficiaries;
        uint256 len = beneficiaries.length;
        require(len > 0, "No beneficiaries to remove");
        address[] memory removals = new address[](beneficiary.length);
        uint256 removedCount;

        for (uint256 i = 0; i < len; ) {
            bool removed = false;
            for (uint256 j = 0; j < beneficiary.length; j++) {
                if (beneficiaries[i] == beneficiary[j]) {
                    address removedAddress = beneficiaries[i];
                    beneficiaries[i] = beneficiaries[len - 1];
                    beneficiaries.pop();
                    len--;
                    removed = true;
                    removals[removedCount] = removedAddress;
                    removedCount++;
                    break;
                }
            }
            if (!removed) {
                i++;
            }
        }

        if (removedCount > 0) {
            address[] memory trimmed = new address[](removedCount);
            for (uint256 k = 0; k < removedCount; k++) {
                trimmed[k] = removals[k];
                emit BeneficiariesRemoved(id, lifeKey.owner, trimmed[k]);
            }
        }
    }

    function addAssets(uint256 id, address[] calldata newAssets) external {
        LifeKey storage lifeKey = lifeKeyDetails[id];
        require(lifeKey.id != 0, "LifeKey does not exist");
        require(lifeKey.owner == msg.sender, "Only owner can add assets");
        for (uint256 i = 0; i < newAssets.length; i++) {
            address asset = newAssets[i];
            require(asset != address(0), "Invalid asset");
            require(!_hasAsset(lifeKey, asset), "Duplicate asset");
            lifeKey.assets.push(asset);
            emit AssetsAdded(id, lifeKey.owner, asset);
        }
    }

    function removeAssets(uint256 id, address[] calldata assetsToRemove) external {
        LifeKey storage lifeKey = lifeKeyDetails[id];
        require(lifeKey.id != 0, "LifeKey does not exist");
        require(lifeKey.owner == msg.sender, "Only owner can remove");
        address[] storage assets = lifeKey.assets;
        uint256 len = assets.length;

        for (uint256 j = 0; j < assetsToRemove.length; j++) {
            address target = assetsToRemove[j];
            for (uint256 i = 0; i < len; ) {
                if (assets[i] == target) {
                    address removedAsset = assets[i];
                    assets[i] = assets[len - 1];
                    assets.pop();
                    len--;
                    emit AssetsRemoved(id, lifeKey.owner, removedAsset);
                    break;
                } else {
                    unchecked { i++; }
                }
            }
        }
    }

    function cancleRecoveryRequest(uint256 id) external {
        LifeKey storage lifeKey = lifeKeyDetails[id];
        require(lifeKey.id != 0, "LifeKey does not exist");
        require(lifeKey.owner == msg.sender, "Only owner can cancel");
        require(lifeKey.proposalActive, "No active recovery");
        lifeKey.proposalActive = false;
        emit RecoveryCancelled(id, lifeKey.owner);
    }

    function initiateRecovery(uint256 id, address proposedOwner) external {
        LifeKey storage lifeKey = lifeKeyDetails[id];
        require(lifeKey.id != 0, "LifeKey does not exist");
        require(_isBeneficiary(lifeKey, msg.sender), "Only beneficiary");
        require(proposedOwner != address(0), "Invalid new owner");
        require(lifeKey.newOwner == address(0), "Pending claim in progress");
        require(lifeKey.beneficiaries.length > 0, "No beneficiaries");

        require(!lifeKey.proposalActive, "Recovery already active");

        lifeKey.proposedOwner = proposedOwner;
        lifeKey.approvals = 0;
        lifeKey.proposalActive = true;

        emit RecoveryInitiated(id, msg.sender, proposedOwner);

        _approveRecovery(lifeKey, msg.sender);
    }

    function approveRecovery(uint256 id) external {
        LifeKey storage lifeKey = lifeKeyDetails[id];
        require(lifeKey.id != 0, "LifeKey does not exist");
        require(_isBeneficiary(lifeKey, msg.sender), "Only beneficiary");
        _approveRecovery(lifeKey, msg.sender);
    }

    function claimLifeKey(uint256 id) external {
        LifeKey memory lifeKey = lifeKeyDetails[id];
        require(lifeKey.id != 0, "LifeKey does not exist");
        require(lifeKey.newOwner != address(0), "New owner not ready");
        require(lifeKey.newOwner == msg.sender, "Only new owner");
        require(
            lifeKey.beneficiaries.length == lifeKey.approvals,
            "Recovery not completed"
        );

        address previousOwner = lifeKey.owner;
        uint256 assetsCount = lifeKey.assets.length;
        for (uint256 i = 0; i < assetsCount; i++) {
            IERC20 asset = IERC20(lifeKey.assets[i]);
            uint256 balance = asset.balanceOf(lifeKey.owner);
            uint256 allowance = asset.allowance(lifeKey.owner, address(this));
            uint256 amountToTransfer = balance;
            if (allowance < balance) {
                amountToTransfer = allowance;
            }
            if (balance > 0) {
                asset.safeTransferFrom(
                    lifeKey.owner,
                    lifeKey.newOwner,
                    amountToTransfer
                );
            }
        }

        lifeKeyCreated[previousOwner] = false;
        emit RecoveryClaimed(id, previousOwner, lifeKey.newOwner);
    }

    function protocolVersion() external pure returns (string memory) {
        return "1.0.0";
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyOwner {}

    function _approveRecovery(
        LifeKey storage lifeKey,
        address beneficiary
    ) internal {
        uint256 snapshotId = lifeKey.id;
        require(
            beneficiaryApprovalSnapshot[lifeKey.id][beneficiary] != snapshotId,
            "Already approved"
        );
        beneficiaryApprovalSnapshot[lifeKey.id][beneficiary] = snapshotId;

        lifeKey.approvals += 1;
        emit RecoveryApproved(lifeKey.id, beneficiary, lifeKey.approvals);

        if (lifeKey.approvals == lifeKey.beneficiaries.length) {
            lifeKey.proposalActive = false;
            lifeKey.newOwner = lifeKey.proposedOwner;
            emit RecoveryCompleted(lifeKey.id, lifeKey.proposedOwner);
        }
    }

    function _isBeneficiary(
        LifeKey storage lifeKey,
        address account
    ) internal view returns (bool) {
        address[] storage beneficiaries = lifeKey.beneficiaries;
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            if (beneficiaries[i] == account) {
                return true;
            }
        }
        return false;
    }

    function _hasAsset(
        LifeKey storage lifeKey,
        address asset
    ) internal view returns (bool) {
        address[] storage assets = lifeKey.assets;
        for (uint256 i = 0; i < assets.length; i++) {
            if (assets[i] == asset) {
                return true;
            }
        }
        return false;
    }
}

import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  AssetsAdded,
  AssetsRemoved,
  BeneficiariesAdded,
  BeneficiariesRemoved,
  Initialized,
  LifeKeyCreated,
  LifeKeyDeleted,
  OwnershipTransferred,
  RecoveryApproved,
  RecoveryCancelled,
  RecoveryClaimed,
  RecoveryCompleted,
  RecoveryInitiated,
  Upgraded
} from "../generated/LifeKeyProtocol/LifeKeyProtocol"

export function createAssetsAddedEvent(
  lifeKeyId: BigInt,
  owner: Address,
  newAssets: Address
): AssetsAdded {
  let assetsAddedEvent = changetype<AssetsAdded>(newMockEvent())

  assetsAddedEvent.parameters = new Array()

  assetsAddedEvent.parameters.push(
    new ethereum.EventParam(
      "lifeKeyId",
      ethereum.Value.fromUnsignedBigInt(lifeKeyId)
    )
  )
  assetsAddedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  assetsAddedEvent.parameters.push(
    new ethereum.EventParam("newAssets", ethereum.Value.fromAddress(newAssets))
  )

  return assetsAddedEvent
}

export function createAssetsRemovedEvent(
  lifeKeyId: BigInt,
  owner: Address,
  removedAsset: Address
): AssetsRemoved {
  let assetsRemovedEvent = changetype<AssetsRemoved>(newMockEvent())

  assetsRemovedEvent.parameters = new Array()

  assetsRemovedEvent.parameters.push(
    new ethereum.EventParam(
      "lifeKeyId",
      ethereum.Value.fromUnsignedBigInt(lifeKeyId)
    )
  )
  assetsRemovedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  assetsRemovedEvent.parameters.push(
    new ethereum.EventParam(
      "removedAsset",
      ethereum.Value.fromAddress(removedAsset)
    )
  )

  return assetsRemovedEvent
}

export function createBeneficiariesAddedEvent(
  lifeKeyId: BigInt,
  owner: Address,
  newBeneficiaries: Address
): BeneficiariesAdded {
  let beneficiariesAddedEvent = changetype<BeneficiariesAdded>(newMockEvent())

  beneficiariesAddedEvent.parameters = new Array()

  beneficiariesAddedEvent.parameters.push(
    new ethereum.EventParam(
      "lifeKeyId",
      ethereum.Value.fromUnsignedBigInt(lifeKeyId)
    )
  )
  beneficiariesAddedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  beneficiariesAddedEvent.parameters.push(
    new ethereum.EventParam(
      "newBeneficiaries",
      ethereum.Value.fromAddress(newBeneficiaries)
    )
  )

  return beneficiariesAddedEvent
}

export function createBeneficiariesRemovedEvent(
  lifeKeyId: BigInt,
  owner: Address,
  removedBeneficiaries: Address
): BeneficiariesRemoved {
  let beneficiariesRemovedEvent = changetype<BeneficiariesRemoved>(
    newMockEvent()
  )

  beneficiariesRemovedEvent.parameters = new Array()

  beneficiariesRemovedEvent.parameters.push(
    new ethereum.EventParam(
      "lifeKeyId",
      ethereum.Value.fromUnsignedBigInt(lifeKeyId)
    )
  )
  beneficiariesRemovedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  beneficiariesRemovedEvent.parameters.push(
    new ethereum.EventParam(
      "removedBeneficiaries",
      ethereum.Value.fromAddress(removedBeneficiaries)
    )
  )

  return beneficiariesRemovedEvent
}

export function createInitializedEvent(version: BigInt): Initialized {
  let initializedEvent = changetype<Initialized>(newMockEvent())

  initializedEvent.parameters = new Array()

  initializedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(version)
    )
  )

  return initializedEvent
}

export function createLifeKeyCreatedEvent(
  lifeKeyId: BigInt,
  owner: Address
): LifeKeyCreated {
  let lifeKeyCreatedEvent = changetype<LifeKeyCreated>(newMockEvent())

  lifeKeyCreatedEvent.parameters = new Array()

  lifeKeyCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "lifeKeyId",
      ethereum.Value.fromUnsignedBigInt(lifeKeyId)
    )
  )
  lifeKeyCreatedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )

  return lifeKeyCreatedEvent
}

export function createLifeKeyDeletedEvent(
  lifeKeyId: BigInt,
  owner: Address
): LifeKeyDeleted {
  let lifeKeyDeletedEvent = changetype<LifeKeyDeleted>(newMockEvent())

  lifeKeyDeletedEvent.parameters = new Array()

  lifeKeyDeletedEvent.parameters.push(
    new ethereum.EventParam(
      "lifeKeyId",
      ethereum.Value.fromUnsignedBigInt(lifeKeyId)
    )
  )
  lifeKeyDeletedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )

  return lifeKeyDeletedEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  )

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createRecoveryApprovedEvent(
  lifeKeyId: BigInt,
  beneficiary: Address,
  approvals: BigInt
): RecoveryApproved {
  let recoveryApprovedEvent = changetype<RecoveryApproved>(newMockEvent())

  recoveryApprovedEvent.parameters = new Array()

  recoveryApprovedEvent.parameters.push(
    new ethereum.EventParam(
      "lifeKeyId",
      ethereum.Value.fromUnsignedBigInt(lifeKeyId)
    )
  )
  recoveryApprovedEvent.parameters.push(
    new ethereum.EventParam(
      "beneficiary",
      ethereum.Value.fromAddress(beneficiary)
    )
  )
  recoveryApprovedEvent.parameters.push(
    new ethereum.EventParam(
      "approvals",
      ethereum.Value.fromUnsignedBigInt(approvals)
    )
  )

  return recoveryApprovedEvent
}

export function createRecoveryCancelledEvent(
  lifeKeyId: BigInt,
  owner: Address
): RecoveryCancelled {
  let recoveryCancelledEvent = changetype<RecoveryCancelled>(newMockEvent())

  recoveryCancelledEvent.parameters = new Array()

  recoveryCancelledEvent.parameters.push(
    new ethereum.EventParam(
      "lifeKeyId",
      ethereum.Value.fromUnsignedBigInt(lifeKeyId)
    )
  )
  recoveryCancelledEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )

  return recoveryCancelledEvent
}

export function createRecoveryClaimedEvent(
  lifeKeyId: BigInt,
  previousOwner: Address,
  newOwner: Address
): RecoveryClaimed {
  let recoveryClaimedEvent = changetype<RecoveryClaimed>(newMockEvent())

  recoveryClaimedEvent.parameters = new Array()

  recoveryClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "lifeKeyId",
      ethereum.Value.fromUnsignedBigInt(lifeKeyId)
    )
  )
  recoveryClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  recoveryClaimedEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return recoveryClaimedEvent
}

export function createRecoveryCompletedEvent(
  lifeKeyId: BigInt,
  newOwner: Address
): RecoveryCompleted {
  let recoveryCompletedEvent = changetype<RecoveryCompleted>(newMockEvent())

  recoveryCompletedEvent.parameters = new Array()

  recoveryCompletedEvent.parameters.push(
    new ethereum.EventParam(
      "lifeKeyId",
      ethereum.Value.fromUnsignedBigInt(lifeKeyId)
    )
  )
  recoveryCompletedEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return recoveryCompletedEvent
}

export function createRecoveryInitiatedEvent(
  lifeKeyId: BigInt,
  initiator: Address,
  proposedOwner: Address
): RecoveryInitiated {
  let recoveryInitiatedEvent = changetype<RecoveryInitiated>(newMockEvent())

  recoveryInitiatedEvent.parameters = new Array()

  recoveryInitiatedEvent.parameters.push(
    new ethereum.EventParam(
      "lifeKeyId",
      ethereum.Value.fromUnsignedBigInt(lifeKeyId)
    )
  )
  recoveryInitiatedEvent.parameters.push(
    new ethereum.EventParam("initiator", ethereum.Value.fromAddress(initiator))
  )
  recoveryInitiatedEvent.parameters.push(
    new ethereum.EventParam(
      "proposedOwner",
      ethereum.Value.fromAddress(proposedOwner)
    )
  )

  return recoveryInitiatedEvent
}

export function createUpgradedEvent(implementation: Address): Upgraded {
  let upgradedEvent = changetype<Upgraded>(newMockEvent())

  upgradedEvent.parameters = new Array()

  upgradedEvent.parameters.push(
    new ethereum.EventParam(
      "implementation",
      ethereum.Value.fromAddress(implementation)
    )
  )

  return upgradedEvent
}

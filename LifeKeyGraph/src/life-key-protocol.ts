import {
  AssetsAdded as AssetsAddedEvent,
  BeneficiariesRemoved as BeneficiariesRemovedEvent,
  BeneficiariesUpdated as BeneficiariesUpdatedEvent,
  Initialized as InitializedEvent,
  LifeKeyCreated as LifeKeyCreatedEvent,
  LifeKeyDeleted as LifeKeyDeletedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  RecoveryApproved as RecoveryApprovedEvent,
  RecoveryCancelled as RecoveryCancelledEvent,
  RecoveryClaimed as RecoveryClaimedEvent,
  RecoveryCompleted as RecoveryCompletedEvent,
  RecoveryInitiated as RecoveryInitiatedEvent,
  Upgraded as UpgradedEvent
} from "../generated/LifeKeyProtocol/LifeKeyProtocol"
import {
  AssetsAdded,
  BeneficiariesRemoved,
  BeneficiariesUpdated,
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
} from "../generated/schema"

export function handleAssetsAdded(event: AssetsAddedEvent): void {
  let entity = new AssetsAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.lifeKeyId = event.params.lifeKeyId
  entity.owner = event.params.owner
  entity.newAssets = event.params.newAssets

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBeneficiariesRemoved(
  event: BeneficiariesRemovedEvent
): void {
  let entity = new BeneficiariesRemoved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.lifeKeyId = event.params.lifeKeyId
  entity.owner = event.params.owner
  entity.removedBeneficiaries = event.params.removedBeneficiaries

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleBeneficiariesUpdated(
  event: BeneficiariesUpdatedEvent
): void {
  let entity = new BeneficiariesUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.lifeKeyId = event.params.lifeKeyId
  entity.owner = event.params.owner
  entity.newBeneficiaries = event.params.newBeneficiaries

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleInitialized(event: InitializedEvent): void {
  let entity = new Initialized(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.version = event.params.version

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLifeKeyCreated(event: LifeKeyCreatedEvent): void {
  let entity = new LifeKeyCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.lifeKeyId = event.params.lifeKeyId
  entity.owner = event.params.owner
  entity.beneficiaries = event.params.beneficiaries
  entity.assets = event.params.assets

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleLifeKeyDeleted(event: LifeKeyDeletedEvent): void {
  let entity = new LifeKeyDeleted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.lifeKeyId = event.params.lifeKeyId
  entity.owner = event.params.owner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRecoveryApproved(event: RecoveryApprovedEvent): void {
  let entity = new RecoveryApproved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.lifeKeyId = event.params.lifeKeyId
  entity.beneficiary = event.params.beneficiary
  entity.approvals = event.params.approvals

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRecoveryCancelled(event: RecoveryCancelledEvent): void {
  let entity = new RecoveryCancelled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.lifeKeyId = event.params.lifeKeyId
  entity.owner = event.params.owner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRecoveryClaimed(event: RecoveryClaimedEvent): void {
  let entity = new RecoveryClaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.lifeKeyId = event.params.lifeKeyId
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRecoveryCompleted(event: RecoveryCompletedEvent): void {
  let entity = new RecoveryCompleted(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.lifeKeyId = event.params.lifeKeyId
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleRecoveryInitiated(event: RecoveryInitiatedEvent): void {
  let entity = new RecoveryInitiated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.lifeKeyId = event.params.lifeKeyId
  entity.initiator = event.params.initiator
  entity.proposedOwner = event.params.proposedOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleUpgraded(event: UpgradedEvent): void {
  let entity = new Upgraded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.implementation = event.params.implementation

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

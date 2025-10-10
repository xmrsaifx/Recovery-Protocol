import { LifeKeyStructOutput, LifeKeySnapshot } from '../types/LifeKeyTypes';

export function toSnapshot(struct: LifeKeyStructOutput): LifeKeySnapshot {
  return {
    id: struct.id,
    owner: struct.owner,
    beneficiaries: struct.beneficiaries || [],
    assets: struct.assets || [],
    newOwner: struct.newOwner,
    proposedOwner: struct.proposedOwner,
    approvals: Number(struct.approvals),
    proposalActive: struct.proposalActive
  };
}

export function zeroSnapshot(): LifeKeySnapshot {
  return {
    id: 0n,
    owner: '0x0000000000000000000000000000000000000000',
    beneficiaries: [],
    assets: [],
    newOwner: '0x0000000000000000000000000000000000000000',
    proposedOwner: '0x0000000000000000000000000000000000000000',
    approvals: 0,
    proposalActive: false
  };
}

export interface LifeKeyStructOutput {
  id: bigint;
  owner: `0x${string}`;
  beneficiaries: `0x${string}`[];
  assets: `0x${string}`[];
  newOwner: `0x${string}`;
  proposedOwner: `0x${string}`;
  approvals: bigint;
  proposalActive: boolean;
}

export interface LifeKeySnapshot {
  id: bigint;
  owner: string;
  beneficiaries: string[];
  assets: string[];
  newOwner: string;
  proposedOwner: string;
  approvals: number;
  proposalActive: boolean;
}

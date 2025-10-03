import { useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { lifeKeyContract } from '../config/lifekey';

export function useLifeKeyDetails(id: bigint | undefined) {
  return useReadContract({
    ...lifeKeyContract,
    functionName: 'lifeKeyDetails',
    args: id ? [id] : undefined,
    query: {
      enabled: Boolean(id)
    }
  });
}

export function useLifeKeyCreated(address: `0x${string}` | undefined) {
  return useReadContract({
    ...lifeKeyContract,
    functionName: 'lifeKeyCreated',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address)
    }
  });
}

export function useLifeKeyWrite() {
  const { writeContractAsync } = useWriteContract();

  return {
    createLifeKey: (beneficiaries: string[], assets: string[]) =>
      writeContractAsync({
        ...lifeKeyContract,
        functionName: 'createLifeKey',
        args: [beneficiaries, assets]
      }),
    updateBeneficiaries: (id: bigint, newBeneficiaries: string[]) =>
      writeContractAsync({
        ...lifeKeyContract,
        functionName: 'updateBeneficiaries',
        args: [id, newBeneficiaries]
      }),
    removeBeneficiaries: (id: bigint, removals: string[]) =>
      writeContractAsync({
        ...lifeKeyContract,
        functionName: 'removeBeneficiaries',
        args: [id, removals]
      }),
    addAssets: (id: bigint, assets: string[]) =>
      writeContractAsync({
        ...lifeKeyContract,
        functionName: 'addAssets',
        args: [id, assets]
      }),
    deleteLifeKey: (id: bigint) =>
      writeContractAsync({
        ...lifeKeyContract,
        functionName: 'deleteLifeKey',
        args: [id]
      }),
    cancelRecovery: (id: bigint) =>
      writeContractAsync({
        ...lifeKeyContract,
        functionName: 'cancleRecoveryRequest',
        args: [id]
      }),
    initiateRecovery: (id: bigint, proposedOwner: string) =>
      writeContractAsync({
        ...lifeKeyContract,
        functionName: 'initiateRecovery',
        args: [id, proposedOwner]
      }),
    approveRecovery: (id: bigint) =>
      writeContractAsync({
        ...lifeKeyContract,
        functionName: 'approveRecovery',
        args: [id]
      }),
    claimLifeKey: (id: bigint) =>
      writeContractAsync({
        ...lifeKeyContract,
        functionName: 'claimLifeKey',
        args: [id]
      })
  };
}

export function useLifeKeyEvents(onInvalidate: () => void) {
  useWatchContractEvent({
    ...lifeKeyContract,
    eventName: 'LifeKeyCreated',
    onLogs: onInvalidate
  });
  useWatchContractEvent({
    ...lifeKeyContract,
    eventName: 'BeneficiariesUpdated',
    onLogs: onInvalidate
  });
  useWatchContractEvent({
    ...lifeKeyContract,
    eventName: 'BeneficiariesRemoved',
    onLogs: onInvalidate
  });
  useWatchContractEvent({
    ...lifeKeyContract,
    eventName: 'AssetsAdded',
    onLogs: onInvalidate
  });
  useWatchContractEvent({
    ...lifeKeyContract,
    eventName: 'RecoveryInitiated',
    onLogs: onInvalidate
  });
  useWatchContractEvent({
    ...lifeKeyContract,
    eventName: 'RecoveryApproved',
    onLogs: onInvalidate
  });
  useWatchContractEvent({
    ...lifeKeyContract,
    eventName: 'RecoveryCompleted',
    onLogs: onInvalidate
  });
  useWatchContractEvent({
    ...lifeKeyContract,
    eventName: 'RecoveryCancelled',
    onLogs: onInvalidate
  });
  useWatchContractEvent({
    ...lifeKeyContract,
    eventName: 'RecoveryClaimed',
    onLogs: onInvalidate
  });
}

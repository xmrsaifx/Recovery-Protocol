import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useAccount, usePublicClient, useWatchContractEvent } from 'wagmi';
import { Card } from '../components/Card';
import { ConnectButton } from '../components/ConnectButton';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { StatusPill } from '../components/StatusPill';
import { RecoveryTimeline } from '../components/RecoveryTimeline';
import { colors, typography, radii } from '../theme/tokens';
import { useLifeKeyDetails, useLifeKeyWrite } from '../hooks/useLifeKeyContract';
import { lifeKeyContract } from '../config/lifekey';
import { toSnapshot, zeroSnapshot } from '../utils/lifekey';
import { parseEventLogs, zeroAddress } from 'viem';

type RecoveryEventArgs = {
  lifeKeyId?: bigint;
  proposedOwner?: `0x${string}`;
  newOwner?: `0x${string}`;
  owner?: `0x${string}`;
  approvals?: bigint;
};

const Section = styled(Card)`
  gap: 20px;
`;

const Title = styled('h2')`
  margin: 0;
  font-size: ${typography.section.size};
  font-weight: ${typography.section.weight};
  color: ${colors.text};
`;

const Subtitle = styled('p')`
  margin: 0;
  color: ${colors.textMuted};
`;

const Row = styled('div')`
  display: grid;
  gap: 12px;
`;

const Grid = styled('div')`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
`;

const InfoCard = styled(Card)`
  gap: 12px;
`;

const InfoTitle = styled('h3')`
  margin: 0;
  font-size: 18px;
`;

const MetricValue = styled('span')`
  font-size: 32px;
  font-weight: 700;
  color: ${colors.text};
`;

const MetricLabel = styled('span')`
  color: ${colors.textMuted};
`;

const ActionsGrid = styled('div')`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
`;

const ActionCard = styled(Card)`
  gap: 16px;
`;

const ActionTitle = styled('h3')`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text};
`;

const ActionCopy = styled('p')`
  margin: 0;
  color: ${colors.textMuted};
`;

const ErrorText = styled('p')`
  margin: 0;
  color: ${colors.danger};
`;

const FormRow = styled('div')`
  display: grid;
  gap: 8px;
`;

const InlineActions = styled('div')`
  display: flex;
  gap: 10px;
  align-items: center;
`;

export function ClaimPage() {
  const { address, isConnected } = useAccount();
  const [lifeKeyIdInput, setLifeKeyIdInput] = useState('');
  const [lifeKeyId, setLifeKeyId] = useState<bigint | undefined>();
  const [loadError, setLoadError] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | undefined>();
  const [isClaiming, setIsClaiming] = useState(false);

  const { data, refetch, isLoading } = useLifeKeyDetails(lifeKeyId);
  const snapshot = useMemo(() => (data ? toSnapshot(data as any) : zeroSnapshot()), [data]);
  const writer = useLifeKeyWrite();
  const publicClient = usePublicClient();

  const watchConfig = {
    ...lifeKeyContract,
    enabled: Boolean(lifeKeyId)
  } as const;

  useWatchContractEvent({
    ...watchConfig,
    eventName: 'RecoveryInitiated',
    onLogs: (logs) => {
      for (const log of logs as Array<{ args?: RecoveryEventArgs }>) {
        if (log.args?.lifeKeyId && lifeKeyId && log.args.lifeKeyId === lifeKeyId) {
          refetch();
          break;
        }
      }
    }
  });
  useWatchContractEvent({
    ...watchConfig,
    eventName: 'RecoveryApproved',
    onLogs: (logs) => {
      for (const log of logs as Array<{ args?: RecoveryEventArgs }>) {
        if (log.args?.lifeKeyId && lifeKeyId && log.args.lifeKeyId === lifeKeyId) {
          refetch();
          break;
        }
      }
    }
  });
  useWatchContractEvent({
    ...watchConfig,
    eventName: 'RecoveryCompleted',
    onLogs: (logs) => {
      for (const log of logs as Array<{ args?: RecoveryEventArgs }>) {
        if (log.args?.lifeKeyId && lifeKeyId && log.args.lifeKeyId === lifeKeyId) {
          refetch();
          break;
        }
      }
    }
  });
  useWatchContractEvent({
    ...watchConfig,
    eventName: 'RecoveryCancelled',
    onLogs: (logs) => {
      for (const log of logs as Array<{ args?: RecoveryEventArgs }>) {
        if (log.args?.lifeKeyId && lifeKeyId && log.args.lifeKeyId === lifeKeyId) {
          refetch();
          break;
        }
      }
    }
  });
  useWatchContractEvent({
    ...watchConfig,
    eventName: 'RecoveryClaimed',
    onLogs: (logs) => {
      for (const log of logs as Array<{ args?: RecoveryEventArgs }>) {
        if (log.args?.lifeKeyId && lifeKeyId && log.args.lifeKeyId === lifeKeyId) {
          refetch();
          break;
        }
      }
    }
  });

  const handleLoad = () => {
    const trimmed = lifeKeyIdInput.trim();
    setLoadError(undefined);
    setActionError(undefined);
    setLastTxHash(undefined);
    if (!trimmed) {
      setLifeKeyId(undefined);
      return;
    }
    try {
      const value = BigInt(trimmed);
      if (value <= 0n) {
        setLoadError('Enter a LifeKey id greater than 0.');
        setLifeKeyId(undefined);
        return;
      }
      setLifeKeyId(value);
    } catch (error) {
      setLoadError('Enter a valid numeric LifeKey id.');
      setLifeKeyId(undefined);
    }
  };

  const lowerAddress = address?.toLowerCase();
  const approvalsRequired = snapshot.beneficiaries.length;
  const approvalsConfirmed = snapshot.approvals;
  const approvalsPending = Math.max(approvalsRequired - approvalsConfirmed, 0);
  const requestInitiated = snapshot.proposedOwner !== zeroAddress;
  const executionReady = Boolean(snapshot.newOwner && snapshot.newOwner !== zeroAddress);
  const isDesignatedNewOwner = Boolean(
    lowerAddress && executionReady && snapshot.newOwner?.toLowerCase() === lowerAddress
  );
  const readyForClaim = isDesignatedNewOwner && approvalsPending === 0;
  const claimDisabledReason = !requestInitiated
    ? 'Recovery has not been initiated.'
    : approvalsPending > 0
      ? 'Waiting for remaining beneficiary approvals.'
      : !isDesignatedNewOwner
        ? 'Only the designated new owner can claim.'
        : undefined;

  const claim = async () => {
    if (!lifeKeyId || !readyForClaim) return;
    setActionError(undefined);
    setLastTxHash(undefined);
    try {
      setIsClaiming(true);
      const txHash = await writer.claimLifeKey(lifeKeyId);
      setLastTxHash(txHash);
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        const logs = parseEventLogs({
          abi: lifeKeyContract.abi,
          eventName: 'RecoveryClaimed',
          logs: receipt.logs
        }) as Array<{ args?: RecoveryEventArgs }>;
        const matching = logs.find((log) => log.args?.lifeKeyId === lifeKeyId);
        if (matching?.args?.newOwner) {
          await refetch();
        }
      } else {
        await refetch();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to claim LifeKey';
      setActionError(message);
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isConnected) {
    return (
      <Section>
        <Title>Claim Recovery</Title>
        <Subtitle>Connect your wallet to claim ownership of a LifeKey.</Subtitle>
        <ConnectButton />
      </Section>
    );
  }

  return (
    <>
      <Section>
        <Title>Claim Recovery</Title>
        <Subtitle>Claim ownership of a LifeKey after a successful recovery.</Subtitle>

        <Grid>
          <Card>
            <Title>LifeKey ID</Title>
            <FormRow>
              <Input
                value={lifeKeyIdInput}
                onChange={(event) => setLifeKeyIdInput(event.target.value)}
                placeholder="Enter LifeKey ID"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleLoad();
                  }
                }}
              />
              <Button onClick={handleLoad} variant="secondary">
                Load LifeKey
              </Button>
            </FormRow>
            {loadError && <ErrorText>{loadError}</ErrorText>}
          </Card>
        </Grid>

        {lifeKeyId && (
          <>
            <Grid>
              <Card>
                <Title>Current Status</Title>
                {isLoading ? (
                  <Subtitle>Loading LifeKey details...</Subtitle>
                ) : (
                  <>
                    <StatusPill tone={snapshot.proposalActive ? 'warning' : 'info'}>
                      {snapshot.proposalActive ? 'Recovery Active' : 'Idle'}
                    </StatusPill>
                    <Subtitle>
                      {snapshot.proposedOwner !== zeroAddress ? (
                        <>Recovery proposed for {snapshot.proposedOwner}</>
                      ) : (
                        <>No active recovery</>
                      )}
                    </Subtitle>
                  </>
                )}
              </Card>

              <Card>
                <Title>Beneficiaries</Title>
                <Subtitle>
                  {isLoading ? 'Loading...' : snapshot.beneficiaries.length ? snapshot.beneficiaries.length : 'None configured'}
                </Subtitle>
              </Card>

              <Card>
                <Title>Assets</Title>
                <Subtitle>
                  {isLoading ? 'Loading...' : snapshot.assets.length ? snapshot.assets.length : 'None configured'}
                </Subtitle>
              </Card>
            </Grid>

            <RecoveryTimeline
              approvals={snapshot.approvals}
              totalBeneficiaries={snapshot.beneficiaries.length}
              proposalActive={snapshot.proposalActive}
              newOwnerReady={snapshot.newOwner !== zeroAddress}
            />

            <ActionsGrid>
              <ActionCard>
                <ActionTitle>Claim Ownership</ActionTitle>
                {isDesignatedNewOwner && readyForClaim ? (
                  <ActionCopy>
                    You are the designated new owner and all approvals have been received. You can now claim ownership of this LifeKey.
                  </ActionCopy>
                ) : !isDesignatedNewOwner ? (
                  <ActionCopy>
                    You are not the designated new owner for this LifeKey.
                  </ActionCopy>
                ) : approvalsPending > 0 ? (
                  <ActionCopy>
                    Waiting for {approvalsPending} more approval{approvalsPending !== 1 ? 's' : ''} before you can claim ownership.
                  </ActionCopy>
                ) : (
                  <ActionCopy>
                    Claim ownership of this LifeKey.
                  </ActionCopy>
                )}

                {isDesignatedNewOwner && (
                  <Button
                    onClick={claim}
                    disabled={!readyForClaim || isClaiming}
                    style={{
                      backgroundColor: readyForClaim && !isClaiming ? colors.primary : `${colors.primary}40`,
                      color: readyForClaim && !isClaiming ? colors.background : `${colors.text}80`
                    }}
                  >
                    {isClaiming ? 'Claiming...' : 'Claim Ownership'}
                  </Button>
                )}
              </ActionCard>
            </ActionsGrid>

            {actionError && <ErrorText>{actionError}</ErrorText>}
            {lastTxHash && <Subtitle>Latest transaction: {lastTxHash}</Subtitle>}
          </>
        )}
      </Section>
    </>
  );
}

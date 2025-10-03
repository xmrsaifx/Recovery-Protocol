import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useAccount, useWatchContractEvent } from 'wagmi';
import { Card } from '../components/Card';
import { ConnectButton } from '../components/ConnectButton';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { RecoveryTimeline } from '../components/RecoveryTimeline';
import { StatusPill } from '../components/StatusPill';
import { colors, typography } from '../theme/tokens';
import { useLifeKeyDetails, useLifeKeyWrite } from '../hooks/useLifeKeyContract';
import { lifeKeyContract } from '../config/lifekey';
import { toSnapshot, zeroSnapshot } from '../utils/lifekey';

const Section = styled(Card)`
  gap: 20px;
`;

const Title = styled('h2')`
  margin: 0;
  font-size: ${typography.section.size};
`;

const Subtitle = styled('p')`
  margin: 0;
  color: ${colors.textMuted};
`;

const Row = styled('div')`
  display: grid;
  gap: 12px;
`;

export function BeneficiaryPage() {
  const { address, isConnected } = useAccount();
  const [lifeKeyIdInput, setLifeKeyIdInput] = useState('');
  const [lifeKeyId, setLifeKeyId] = useState<bigint | undefined>();
  const [proposedOwner, setProposedOwner] = useState('');

  const { data, refetch } = useLifeKeyDetails(lifeKeyId);
  const snapshot = useMemo(() => (data ? toSnapshot(data as any) : zeroSnapshot()), [data]);

  const writer = useLifeKeyWrite();

  useWatchContractEvent({
    ...lifeKeyContract,
    eventName: 'RecoveryInitiated',
    onLogs: () => refetch()
  });
  useWatchContractEvent({
    ...lifeKeyContract,
    eventName: 'RecoveryApproved',
    onLogs: () => refetch()
  });
  useWatchContractEvent({
    ...lifeKeyContract,
    eventName: 'RecoveryCompleted',
    onLogs: () => refetch()
  });
  useWatchContractEvent({
    ...lifeKeyContract,
    eventName: 'RecoveryCancelled',
    onLogs: () => refetch()
  });

  const handleLoad = () => {
    if (!lifeKeyIdInput) return;
    try {
      const value = BigInt(lifeKeyIdInput);
      setLifeKeyId(value);
      refetch();
    } catch (error) {
      console.error('Invalid id', error);
    }
  };

  const initiate = async () => {
    if (!lifeKeyId || !proposedOwner) return;
    await writer.initiateRecovery(lifeKeyId, proposedOwner);
  };

  const approve = async () => {
    if (!lifeKeyId) return;
    await writer.approveRecovery(lifeKeyId);
  };

  return (
    <>
      {!isConnected ? (
        <Section>
          <Title>Connect</Title>
          <Subtitle>Connect as a beneficiary to review LifeKeys that include your address.</Subtitle>
          <ConnectButton />
        </Section>
      ) : (
        <Section>
          <Title>Beneficiary Console</Title>
          <Row>
            <label>LifeKey identifier</label>
            <Input
              value={lifeKeyIdInput}
              onChange={(event) => setLifeKeyIdInput(event.target.value)}
              placeholder="Enter numeric LifeKey ID"
            />
            <Button variant="secondary" onClick={handleLoad}>Load</Button>
          </Row>
          {snapshot.id > 0n && (
            <>
              <Subtitle>Owner: {snapshot.owner}</Subtitle>
              <Subtitle>Beneficiaries: {snapshot.beneficiaries.join(', ')}</Subtitle>
              <RecoveryTimeline
                approvals={snapshot.approvals}
                totalBeneficiaries={snapshot.beneficiaries.length}
                proposalActive={snapshot.proposalActive}
                newOwnerReady={snapshot.newOwner !== '0x0000000000000000000000000000000000000000'}
              />
              {snapshot.proposalActive ? (
                <StatusPill tone="warning">Recovery active</StatusPill>
              ) : (
                <StatusPill tone="info">Idle</StatusPill>
              )}
              <Row>
                <label>Proposed new owner</label>
                <Input
                  value={proposedOwner}
                  onChange={(event) => setProposedOwner(event.target.value)}
                  placeholder="0x proposed owner"
                />
                <Button onClick={initiate}>Initiate recovery</Button>
              </Row>
              <Button variant="secondary" onClick={approve}>Approve recovery</Button>
            </>
          )}
        </Section>
      )}
    </>
  );
}

import { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useAccount, useWatchContractEvent } from 'wagmi';
import { Card } from '../components/Card';
import { ConnectButton } from '../components/ConnectButton';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { StatusPill } from '../components/StatusPill';
import { RecoveryTimeline } from '../components/RecoveryTimeline';
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

export function ClaimPage() {
  const { address, isConnected } = useAccount();
  const [lifeKeyIdInput, setLifeKeyIdInput] = useState('');
  const [lifeKeyId, setLifeKeyId] = useState<bigint | undefined>();

  const { data, refetch } = useLifeKeyDetails(lifeKeyId);
  const snapshot = useMemo(() => (data ? toSnapshot(data as any) : zeroSnapshot()), [data]);
  const writer = useLifeKeyWrite();

  useWatchContractEvent({
    ...lifeKeyContract,
    eventName: 'RecoveryCompleted',
    onLogs: () => refetch()
  });
  useWatchContractEvent({
    ...lifeKeyContract,
    eventName: 'RecoveryClaimed',
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

  const claim = async () => {
    if (!lifeKeyId) return;
    await writer.claimLifeKey(lifeKeyId);
  };

  const readyForClaim = snapshot.newOwner.toLowerCase() === (address?.toLowerCase() ?? '') && snapshot.newOwner !== '0x0000000000000000000000000000000000000000';

  return (
    <>
      {!isConnected ? (
        <Section>
          <Title>Connect</Title>
          <Subtitle>Connect with the wallet designated as the new owner to finalize recovery.</Subtitle>
          <ConnectButton />
        </Section>
      ) : (
        <Section>
          <Title>Claim Console</Title>
          <Row>
            <label>LifeKey identifier</label>
            <Input
              value={lifeKeyIdInput}
              onChange={(event) => setLifeKeyIdInput(event.target.value)}
              placeholder="Enter LifeKey ID"
            />
            <Button variant="secondary" onClick={handleLoad}>Load</Button>
          </Row>
          {snapshot.id > 0n && (
            <>
              <Subtitle>Previous owner: {snapshot.owner}</Subtitle>
              <Subtitle>Proposed owner: {snapshot.proposedOwner}</Subtitle>
              <RecoveryTimeline
                approvals={snapshot.approvals}
                totalBeneficiaries={snapshot.beneficiaries.length}
                proposalActive={snapshot.proposalActive}
                newOwnerReady={snapshot.newOwner !== '0x0000000000000000000000000000000000000000'}
              />
              {readyForClaim ? (
                <StatusPill tone="success">Ready to claim</StatusPill>
              ) : (
                <StatusPill tone="warning">Waiting for approvals</StatusPill>
              )}
              <Button onClick={claim} disabled={!readyForClaim}>
                Claim LifeKey
              </Button>
            </>
          )}
        </Section>
      )}
    </>
  );
}

import { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useAccount, useWatchContractEvent } from 'wagmi';
import { Card } from '../components/Card';
import { ConnectButton } from '../components/ConnectButton';
import { AddressListInput } from '../components/AddressListInput';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { StatusPill } from '../components/StatusPill';
import { RecoveryTimeline } from '../components/RecoveryTimeline';
import { colors, typography } from '../theme/tokens';
import { validateAddresses } from '../utils/address';
import { lifeKeyContract } from '../config/lifekey';
import { useLifeKeyWrite, useLifeKeyDetails, useLifeKeyCreated, useLifeKeyEvents } from '../hooks/useLifeKeyContract';
import { toSnapshot, zeroSnapshot } from '../utils/lifekey';
import { LifeKeySnapshot } from '../types/LifeKeyTypes';

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

const Grid = styled('div')`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
`;

const FormRow = styled('div')`
  display: grid;
  gap: 12px;
`;

function useStoredLifeKeyId(address?: `0x${string}`) {
  const key = address ? `lifekey:${address}` : undefined;
  const [value, setValue] = useState<bigint | undefined>(() => {
    if (!key || typeof window === 'undefined') return undefined;
    const stored = window.localStorage.getItem(key);
    if (!stored) return undefined;
    return BigInt(stored);
  });

  useEffect(() => {
    if (!key || typeof window === 'undefined') return;
    if (value) {
      window.localStorage.setItem(key, value.toString());
    } else {
      window.localStorage.removeItem(key);
    }
  }, [key, value]);

  return [value, setValue] as const;
}

export function OwnerPage() {
  const { address, isConnected } = useAccount();
  const [lifeKeyId, setLifeKeyId] = useStoredLifeKeyId(address);
  const [createBeneficiaries, setCreateBeneficiaries] = useState<string[]>(['']);
  const [createAssets, setCreateAssets] = useState<string[]>(['']);
  const [updateBeneficiaries, setUpdateBeneficiaries] = useState<string[]>(['']);
  const [removalBeneficiaries, setRemovalBeneficiaries] = useState<string[]>(['']);
  const [assetAdditions, setAssetAdditions] = useState<string[]>(['']);
  const [proposedOwner, setProposedOwner] = useState('');

  const { data: created } = useLifeKeyCreated(address);
  const { data: detailsData, refetch } = useLifeKeyDetails(lifeKeyId);
  const snapshot: LifeKeySnapshot = useMemo(() => {
    if (!detailsData) return zeroSnapshot();
    return toSnapshot(detailsData as any);
  }, [detailsData]);

  const lifeKeyExists = created ?? false;
  const lifeKeyActive = lifeKeyExists && snapshot.id > 0n;

  const writer = useLifeKeyWrite();

  useLifeKeyEvents(() => {
    if (lifeKeyId) {
      refetch();
    }
  });

  useWatchContractEvent({
    ...lifeKeyContract,
    eventName: 'LifeKeyCreated',
    onLogs: (logs) => {
      for (const log of logs) {
        const { args } = log;
        if (args && args.owner && address && args.owner.toLowerCase() === address.toLowerCase()) {
          setLifeKeyId(BigInt(args.lifeKeyId));
          refetch();
        }
      }
    }
  });

  useWatchContractEvent({
    ...lifeKeyContract,
    eventName: 'LifeKeyDeleted',
    onLogs: (logs) => {
      for (const log of logs) {
        if (address && log.args && log.args.owner.toLowerCase() === address.toLowerCase()) {
          setLifeKeyId(undefined);
          refetch();
        }
      }
    }
  });

  const creationValidation = useMemo(() => validateAddresses(createBeneficiaries), [createBeneficiaries]);
  const creationAssetValidation = useMemo(() => validateAddresses(createAssets), [createAssets]);
  const updateValidation = useMemo(() => validateAddresses(updateBeneficiaries), [updateBeneficiaries]);
  const removalValidation = useMemo(() => validateAddresses(removalBeneficiaries), [removalBeneficiaries]);
  const additionValidation = useMemo(() => validateAddresses(assetAdditions), [assetAdditions]);

  useEffect(() => {
    if (!snapshot.beneficiaries.length) return;
    setUpdateBeneficiaries(snapshot.beneficiaries);
    setRemovalBeneficiaries(snapshot.beneficiaries);
  }, [snapshot.beneficiaries.join('|')]);

  useEffect(() => {
    if (!snapshot.assets.length) return;
    setAssetAdditions(['']);
  }, [snapshot.assets.join('|')]);

  const handleCreate = async () => {
    if (!creationValidation.valid.length) return;
    await writer.createLifeKey(creationValidation.valid, creationAssetValidation.valid);
  };

  const handleUpdate = async () => {
    if (!lifeKeyId) return;
    await writer.updateBeneficiaries(lifeKeyId, updateValidation.valid);
  };

  const handleRemove = async () => {
    if (!lifeKeyId) return;
    await writer.removeBeneficiaries(lifeKeyId, removalValidation.valid);
  };

  const handleAddAssets = async () => {
    if (!lifeKeyId || !additionValidation.valid.length) return;
    await writer.addAssets(lifeKeyId, additionValidation.valid);
  };

  const handleDelete = async () => {
    if (!lifeKeyId) return;
    await writer.deleteLifeKey(lifeKeyId);
  };

  const handleCancel = async () => {
    if (!lifeKeyId) return;
    await writer.cancelRecovery(lifeKeyId);
  };

  const handleInitiate = async () => {
    if (!lifeKeyId || !proposedOwner) return;
    await writer.initiateRecovery(lifeKeyId, proposedOwner);
  };

  return (
    <>
      {!isConnected ? (
        <Section>
          <Title>Connect wallet</Title>
          <Subtitle>Authenticate with the owner wallet to manage your LifeKey configuration.</Subtitle>
          <ConnectButton />
        </Section>
      ) : !lifeKeyActive ? (
        <Section>
          <Title>Create LifeKey</Title>
          <Subtitle>Define beneficiaries and optional ERC20 assets to guard.</Subtitle>
          <FormRow>
            <label>Beneficiaries</label>
            <AddressListInput
              values={createBeneficiaries}
              onChange={setCreateBeneficiaries}
              placeholder="0x..."
            />
            {creationValidation.invalid.length > 0 && (
              <Subtitle>Invalid addresses: {creationValidation.invalid.join(', ')}</Subtitle>
            )}
          </FormRow>
          <FormRow>
            <label>Assets</label>
            <AddressListInput
              values={createAssets}
              onChange={setCreateAssets}
              placeholder="ERC20 contract address"
            />
          </FormRow>
          <Button onClick={handleCreate} disabled={!creationValidation.valid.length}>Create LifeKey</Button>
        </Section>
      ) : (
        <>
          <Section>
            <Title>Current LifeKey</Title>
            <Subtitle>ID #{snapshot.id.toString()}</Subtitle>
            <Grid>
              <Card>
                <Title>Beneficiaries</Title>
                <Subtitle>{snapshot.beneficiaries.join(', ') || 'None'}</Subtitle>
              </Card>
              <Card>
                <Title>Tracked assets</Title>
                <Subtitle>{snapshot.assets.join(', ') || 'Not configured'}</Subtitle>
              </Card>
              <Card>
                <Title>Status</Title>
                {snapshot.proposalActive ? <StatusPill tone="warning">Recovery active</StatusPill> : <StatusPill tone="info">Idle</StatusPill>}
                <RecoveryTimeline
                  approvals={snapshot.approvals}
                  totalBeneficiaries={snapshot.beneficiaries.length}
                  proposalActive={snapshot.proposalActive}
                  newOwnerReady={snapshot.newOwner !== '0x0000000000000000000000000000000000000000'}
                />
              </Card>
            </Grid>
          </Section>

          <Section>
            <Title>Manage configuration</Title>
            <FormRow>
              <label>Update beneficiaries</label>
              <AddressListInput values={updateBeneficiaries} onChange={setUpdateBeneficiaries} placeholder="0x..." />
              <Button variant="secondary" onClick={handleUpdate}>Update list</Button>
            </FormRow>
            <FormRow>
              <label>Remove selected beneficiaries</label>
              <Subtitle>Only addresses currently on the list will be removed.</Subtitle>
              <AddressListInput values={removalBeneficiaries} onChange={setRemovalBeneficiaries} placeholder="0x..." />
              <Button variant="secondary" onClick={handleRemove}>Remove</Button>
            </FormRow>
            <FormRow>
              <label>Add ERC20 assets</label>
              <AddressListInput values={assetAdditions} onChange={setAssetAdditions} placeholder="ERC20 contract" />
              <Button variant="secondary" onClick={handleAddAssets}>Add assets</Button>
            </FormRow>
            <FormRow>
              <label>Proposed new owner</label>
              <Input value={proposedOwner} onChange={(e) => setProposedOwner(e.target.value)} placeholder="0x new owner" />
              <Button onClick={handleInitiate}>Initiate recovery</Button>
            </FormRow>
            {snapshot.proposalActive && (
              <Button variant="secondary" onClick={handleCancel}>Cancel active recovery</Button>
            )}
            <Button variant="text" onClick={handleDelete}>Delete LifeKey</Button>
          </Section>
        </>
      )}
    </>
  );
}

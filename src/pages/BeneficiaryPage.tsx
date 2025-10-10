import { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useAccount, usePublicClient, useWatchContractEvent, useWriteContract } from 'wagmi';
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
import { validateAddresses } from '../utils/address';
import { parseEventLogs, zeroAddress } from 'viem';
import LifeKeyProtocolAbi from '../assets/abi/LifeKeyProtocol.json';

type RecoveryEventArgs = {
  lifeKeyId?: bigint;
  proposedOwner?: `0x${string}`;
  initiator?: `0x${string}`;
  owner?: `0x${string}`;
  newOwner?: `0x${string}`;
};

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

const Grid = styled('div')`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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
  font-size: 18px;
`;

const ActionCopy = styled('p')`
  margin: 0;
  color: ${colors.textMuted};
`;

const InlineActions = styled('div')`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const LifeKeyList = styled('div')`
  display: grid;
  gap: 12px;
`;

const LifeKeyButton = styled(Button)`
  justify-content: flex-start;
  width: 100%;
  text-align: left;
  align-items: flex-start;
  flex-direction: column;
  gap: 4px;
`;

const LifeKeyButtonLabel = styled('span')`
  font-size: 12px;
  color: ${colors.textMuted};
`;

const ErrorText = styled('p')`
  margin: 0;
  color: ${colors.danger};
`;

const InfoCard = styled(Card)`
  gap: 12px;
`;

const InfoTitle = styled('h3')`
  margin: 0;
  font-size: 18px;
`;

export function BeneficiaryPage() {
  const { address, isConnected } = useAccount();
  const [lifeKeyId, setLifeKeyId] = useState<bigint | undefined>();
  const [proposedOwner, setProposedOwner] = useState('');
  const [actionError, setActionError] = useState<string>();
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | undefined>();
  const [isInitiating, setIsInitiating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // GraphQL states for auto-discovery
  const [myLifeKeys, setMyLifeKeys] = useState<Array<{id: string, owner: string}>>([]);
  const [beneficiariesLive, setBeneficiariesLive] = useState<string[]>([]);
  const [assetsLive, setAssetsLive] = useState<string[]>([]);
  const [graphqlLoading, setGraphqlLoading] = useState(false);
  const [graphqlError, setGraphqlError] = useState<string | null>(null);
  const [proposedOwnerLive, setProposedOwnerLive] = useState<string | null>(null);

  const { data, refetch, isLoading } = useLifeKeyDetails(lifeKeyId);

  const mapLifeKeyData = (arr: any, beneficiaries: string[], assets: string[]) => {
    if (!Array.isArray(arr)) return arr;
    return {
      id: arr[0],
      owner: arr[1],
      proposedOwner: arr[2],
      newOwner: arr[3],
      approvals: arr[4],
      proposalActive: arr[5],
      beneficiaries,
      assets,
    };
  };

  const snapshot = useMemo(
    () => (data ? toSnapshot(mapLifeKeyData(data, beneficiariesLive, assetsLive)) : zeroSnapshot()),
    [data, beneficiariesLive, assetsLive]
  );

  const displayProposedOwner = useMemo(() => {
    const live = proposedOwnerLive && proposedOwnerLive !== zeroAddress ? proposedOwnerLive : null;
    const fromSnapshot = snapshot.proposedOwner !== zeroAddress ? snapshot.proposedOwner : null;
    return live ?? fromSnapshot;
  }, [proposedOwnerLive, snapshot.proposedOwner]);

  // Debug: log contract data and loading state
  useEffect(() => {
    console.log('LifeKeyId:', lifeKeyId, 'isLoading:', isLoading, 'data:', data);
  }, [data, isLoading, lifeKeyId]);


  const publicClient = usePublicClient();
  const writer = useLifeKeyWrite();
  const { writeContractAsync } = useWriteContract();

  const truncateAddress = (addr: string, start = 15, end = 15) => {
    if (!addr || addr.length <= start + end) return addr;
    return `${addr.slice(0, start)}...${addr.slice(-end)}`;
  };

  const formatAddressList = (addresses: string[]) => {
    if (addresses.length === 0) return 'None configured';
    if (addresses.length === 1) return truncateAddress(addresses[0]);
    if (addresses.length <= 3) return addresses.map((addr) => truncateAddress(addr)).join(', ');
    return `${addresses.slice(0, 2).map((addr) => truncateAddress(addr)).join(', ')}, +${
      addresses.length - 2
    } more`;
  };
  useEffect(() => {
    if (!address) {
      setMyLifeKeys([]);
      return;
    }
    setGraphqlLoading(true);
    setGraphqlError(null);
    const endpoint = 'https://subgraph.satsuma-prod.com/57f4fa800d67/saifs-team--438738/lifeKey-Protocol/api';
    const query = `query GetBeneficiaryLifeKeys {
      beneficiariesAddeds(where: { newBeneficiaries_in: ["${address.toLowerCase()}"] }) {
        lifeKeyId
        newBeneficiaries
      }
      beneficiariesRemoveds(where: { removedBeneficiaries_in: ["${address.toLowerCase()}"] }) {
        lifeKeyId
        removedBeneficiaries
      }
      lifeKeyCreateds {
        lifeKeyId
        owner
      }
    }`;
    
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    })
      .then(res => res.json())
      .then(data => {
        if (data.errors) throw new Error(data.errors[0]?.message || 'GraphQL error');
        
        // Get all LifeKeys where user was added as beneficiary
        const addedLifeKeys = new Set(
          data.data.beneficiariesAddeds
            ?.filter((b: any) => b.newBeneficiaries.toLowerCase().includes(address.toLowerCase()))
            ?.map((b: any) => b.lifeKeyId) || []
        );
        
        // Get all LifeKeys where user was removed as beneficiary
        const removedLifeKeys = new Set(
          data.data.beneficiariesRemoveds
            ?.filter((r: any) => r.removedBeneficiaries.toLowerCase().includes(address.toLowerCase()))
            ?.map((r: any) => r.lifeKeyId) || []
        );
        
        // Filter to only active beneficiary LifeKeys
        const activeLifeKeyIds = Array.from(addedLifeKeys).filter(id => !removedLifeKeys.has(id));
        
        // Get owner info for active LifeKeys
        const lifeKeysWithOwners = activeLifeKeyIds.map(id => {
          const ownerInfo = data.data.lifeKeyCreateds?.find((lk: any) => lk.lifeKeyId === id);
          return {
            id: String(id),
            owner: String(ownerInfo?.owner || 'Unknown')
          };
        });
        
        setMyLifeKeys(lifeKeysWithOwners);
        
        // Auto-select first LifeKey if available and none selected
        if (lifeKeysWithOwners.length > 0 && !lifeKeyId) {
          const firstLifeKey = BigInt(String(lifeKeysWithOwners[0].id));
          setLifeKeyId(firstLifeKey);
        }
        
        setGraphqlLoading(false);
      })
      .catch(e => {
        setGraphqlError(e.message || 'Error fetching LifeKeys');
        setGraphqlLoading(false);
      });
  }, [address, lifeKeyId]);

  // Fetch live beneficiaries and assets for selected LifeKey
  useEffect(() => {
    if (!lifeKeyId) {
      setBeneficiariesLive([]);
      setAssetsLive([]);
      setProposedOwnerLive(null);
      return;
    }
    
    const endpoint = 'https://subgraph.satsuma-prod.com/57f4fa800d67/saifs-team--438738/lifeKey-Protocol/api';
    const query = `query GetLifeKeyData {
      beneficiariesAddeds(where: { lifeKeyId: "${lifeKeyId.toString()}" }) {
        newBeneficiaries
      }
      beneficiariesRemoveds(where: { lifeKeyId: "${lifeKeyId.toString()}" }) {
        removedBeneficiaries
      }
      assetsAddeds(where: { lifeKeyId: "${lifeKeyId.toString()}" }) {
        newAssets
      }
      assetsRemoveds(where: { lifeKeyId: "${lifeKeyId.toString()}" }) {
        removedAsset
      }
      recoveryInitiateds(where: { lifeKeyId: "${lifeKeyId.toString()}" }, orderBy: blockTimestamp, orderDirection: desc, first: 1) {
        proposedOwner
      }
    }`;
    
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    })
      .then(res => res.json())
      .then(data => {
        if (data.errors) throw new Error(data.errors[0]?.message || 'GraphQL error');
        
        // Process beneficiaries
        const addedBeneficiaries = data.data.beneficiariesAddeds
          ?.map((b: any) => String(b.newBeneficiaries).toLowerCase()) || [];
        const removedBeneficiaries = data.data.beneficiariesRemoveds
          ?.map((r: any) => String(r.removedBeneficiaries).toLowerCase()) || [];
        const activeBeneficiaries = addedBeneficiaries.filter(
          (beneficiary: string) => !removedBeneficiaries.includes(beneficiary)
        );
        setBeneficiariesLive([...new Set(activeBeneficiaries)] as string[]);
        
        // Process assets
        const addedAssets = data.data.assetsAddeds
          ?.map((a: any) => String(a.newAssets).toLowerCase()) || [];
        const removedAssets = data.data.assetsRemoveds
          ?.map((r: any) => String(r.removedAsset).toLowerCase()) || [];
        const activeAssets = addedAssets.filter(
          (asset: string) => !removedAssets.includes(asset)
        );
        setAssetsLive([...new Set(activeAssets)] as string[]);

        const latestRecovery = data.data.recoveryInitiateds?.[0]?.proposedOwner;
        setProposedOwnerLive(latestRecovery ? String(latestRecovery) : null);
      })
      .catch(e => {
        console.error('Error fetching LifeKey data:', e);
      });
  }, [lifeKeyId]);

  const lowerAddress = address?.toLowerCase();
  const isBeneficiary = Boolean(
    lowerAddress && snapshot.beneficiaries && snapshot.beneficiaries.some((entry) => entry.toLowerCase() === lowerAddress)
  );
  const proposedOwnerValidation = useMemo(
    () => validateAddresses(proposedOwner ? [proposedOwner] : []),
    [proposedOwner]
  );
  const recoveryActive = snapshot.proposalActive;
  const showDetails = snapshot.id > 0n;
  const totalBeneficiaries = snapshot.beneficiaries?.length || 0;
  const approvalsCollected = snapshot.approvals;
  const allApprovalsCollected = recoveryActive && totalBeneficiaries > 0 && approvalsCollected >= totalBeneficiaries;
  const readyForClaim = snapshot.newOwner !== zeroAddress && allApprovalsCollected;
  const isProposedOwner = Boolean(
    lowerAddress &&
    displayProposedOwner &&
    displayProposedOwner !== zeroAddress &&
    displayProposedOwner.toLowerCase() === lowerAddress
  );
  const isNewOwner = Boolean(
    lowerAddress &&
    snapshot.newOwner &&
    snapshot.newOwner !== zeroAddress &&
    snapshot.newOwner.toLowerCase() === lowerAddress
  );

  useWatchContractEvent({
    ...lifeKeyContract,
    eventName: 'RecoveryInitiated',
    enabled: Boolean(lifeKeyId),
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
    ...lifeKeyContract,
    eventName: 'RecoveryApproved',
    enabled: Boolean(lifeKeyId),
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
    ...lifeKeyContract,
    eventName: 'RecoveryCompleted',
    enabled: Boolean(lifeKeyId),
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
    ...lifeKeyContract,
    eventName: 'RecoveryCancelled',
    enabled: Boolean(lifeKeyId),
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
    ...lifeKeyContract,
    eventName: 'RecoveryClaimed',
    enabled: Boolean(lifeKeyId),
    onLogs: (logs) => {
      for (const log of logs as Array<{ args?: RecoveryEventArgs }>) {
        if (log.args?.lifeKeyId && lifeKeyId && log.args.lifeKeyId === lifeKeyId) {
          refetch();
          break;
        }
      }
    }
  });

  useEffect(() => {
    if (!showDetails || !displayProposedOwner || !recoveryActive) {
      return;
    }
    if (proposedOwner !== displayProposedOwner) {
      setProposedOwner(displayProposedOwner);
    }
  }, [showDetails, displayProposedOwner, recoveryActive, proposedOwner]);

  const handleSelectLifeKey = (id: bigint) => {
    setActionError(undefined);
    setLastTxHash(undefined);
    setLifeKeyId(id);
    setProposedOwner('');
  };

  const initiate = async () => {
    if (!lifeKeyId || !isBeneficiary || recoveryActive || !proposedOwnerValidation.valid.length) {
      return;
    }
    setActionError(undefined);
    setLastTxHash(undefined);
    try {
      setIsInitiating(true);
      const txHash = await writeContractAsync({
        abi: LifeKeyProtocolAbi as any,
        address: lifeKeyContract.address,
        functionName: 'initiateRecovery',
        args: [lifeKeyId, proposedOwnerValidation.valid[0]],
        chainId: lifeKeyContract.chainId,
        account: address
      } as any);
      setLastTxHash(txHash);
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        const logs = parseEventLogs({
          abi: lifeKeyContract.abi,
          eventName: 'RecoveryInitiated',
          logs: receipt.logs
        }) as Array<{ args?: RecoveryEventArgs }>;
        const matching = logs.find((log) => log.args?.lifeKeyId === lifeKeyId);
        if (matching?.args?.proposedOwner) {
          setProposedOwner(matching.args.proposedOwner);
        }
      }
      await refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initiate recovery';
      setActionError(message);
    } finally {
      setIsInitiating(false);
    }
  };

  const approve = async () => {
    if (!lifeKeyId || !isBeneficiary || !recoveryActive) {
      return;
    }
    setActionError(undefined);
    setLastTxHash(undefined);
    try {
      setIsApproving(true);
      const txHash = await writeContractAsync({
        abi: LifeKeyProtocolAbi as any,
        address: lifeKeyContract.address,
        functionName: 'approveRecovery',
        args: [lifeKeyId],
        chainId: lifeKeyContract.chainId,
        account: address
      } as any);
      setLastTxHash(txHash);
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        const logs = parseEventLogs({
          abi: lifeKeyContract.abi,
          eventName: 'RecoveryApproved',
          logs: receipt.logs
        }) as Array<{ args?: RecoveryEventArgs }>;
        const matching = logs.find((log) => log.args?.lifeKeyId === lifeKeyId);
        if (matching?.args?.lifeKeyId) {
          await refetch();
        }
      } else {
        await refetch();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve recovery';
      setActionError(message);
    } finally {
      setIsApproving(false);
    }
  };

  const claim = async () => {
    if (!lifeKeyId || !isNewOwner) {
      return;
    }
    setActionError(undefined);
    setLastTxHash(undefined);
    try {
      setIsClaiming(true);
      const txHash = await writeContractAsync({
        abi: LifeKeyProtocolAbi as any,
        address: lifeKeyContract.address,
        functionName: 'claimLifeKey',
        args: [lifeKeyId],
        chainId: lifeKeyContract.chainId,
        account: address
      } as any);
      setLastTxHash(txHash);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }
      await refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to claim LifeKey';
      setActionError(message);
    } finally {
      setIsClaiming(false);
    }
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
        <>
          <Section>
            <Title>Beneficiary Console</Title>
            <Subtitle>Review LifeKey details and coordinate with fellow beneficiaries.</Subtitle>
            
            {graphqlLoading ? (
              <Subtitle>Loading your LifeKeys...</Subtitle>
            ) : myLifeKeys.length > 0 ? (
              <>
                <Subtitle>LifeKeys where you are a beneficiary:</Subtitle>
                <LifeKeyList>
                  {myLifeKeys.map((lk) => {
                    const idBigInt = BigInt(lk.id);
                    const isActive = lifeKeyId === idBigInt;
                    return (
                      <LifeKeyButton
                        key={lk.id}
                        variant={isActive ? 'primary' : 'secondary'}
                        onClick={() => handleSelectLifeKey(idBigInt)}
                      >
                        LifeKey #{lk.id} Owner {truncateAddress(lk.owner)}
                       
                      </LifeKeyButton>
                    );
                  })}
                </LifeKeyList>
              </>
            ) : (
              <Subtitle>No LifeKeys found where you are a beneficiary.</Subtitle>
            )}
            {graphqlError && <ErrorText>GraphQL Error: {graphqlError}</ErrorText>}
          </Section>

          {isLoading && lifeKeyId ? (
            <Section>
              <Subtitle>Loading LifeKey #{lifeKeyId.toString()}…</Subtitle>
            </Section>
          ) : showDetails ? (
            <>
              <Section>
                <Title>LifeKey overview</Title>
                <Subtitle>Details for LifeKey #{(lifeKeyId ?? snapshot.id).toString()}</Subtitle>
                <Grid>
                  <InfoCard>
                    <InfoTitle>Owner</InfoTitle>
                    <Subtitle>{truncateAddress(snapshot.owner)}</Subtitle>
                  </InfoCard>
                  <InfoCard>
                    <InfoTitle>Beneficiaries</InfoTitle>
                    <Subtitle>{beneficiariesLive.length ? formatAddressList(beneficiariesLive) : 'None configured'}</Subtitle>
                  </InfoCard>
                  <InfoCard>
                    <InfoTitle>Tracked assets</InfoTitle>
                    <Subtitle>{assetsLive.length ? formatAddressList(assetsLive) : 'Not configured'}</Subtitle>
                  </InfoCard>
                  <InfoCard>
                    <InfoTitle>Proposed owner</InfoTitle>
                    <Subtitle>
                      {displayProposedOwner ? truncateAddress(displayProposedOwner) : 'Not proposed'}
                    </Subtitle>
                  </InfoCard>
                  <InfoCard>
                    <InfoTitle>Your wallet</InfoTitle>
                    <Subtitle>
                      {isBeneficiary ? 'Listed as beneficiary' : 'Not a beneficiary'}
                    </Subtitle>
                    {isProposedOwner && <StatusPill tone="warning">Proposed to inherit</StatusPill>}
                    {isNewOwner && <StatusPill tone="success">Eligible to claim</StatusPill>}
                  </InfoCard>
                </Grid>
                <InfoCard>
                  <InfoTitle>Recovery status</InfoTitle>
                  {recoveryActive ? (
                    <StatusPill tone="warning">Recovery active</StatusPill>
                  ) : (
                    <StatusPill tone="info">Idle</StatusPill>
                  )}
                  <RecoveryTimeline
                    approvals={snapshot.approvals}
                    totalBeneficiaries={snapshot.beneficiaries?.length || 0}
                    proposalActive={recoveryActive}
                    newOwnerReady={snapshot.newOwner !== zeroAddress}
                  />
                </InfoCard>
              </Section>

              <Section>
                <Title>Beneficiary actions</Title>
                <Subtitle>Only wallet addresses listed as beneficiaries can interact with this LifeKey.</Subtitle>
                {isBeneficiary ? (
                  <ActionsGrid>
                    <ActionCard>
                      <ActionTitle>Start recovery</ActionTitle>
                      {recoveryActive && displayProposedOwner ? (
                        <ActionCopy>
                          Recovery already initiated for {truncateAddress(displayProposedOwner)}.
                        </ActionCopy>
                      ) : (
                        <>
                          <ActionCopy>Propose a new owner when the LifeKey is idle.</ActionCopy>
                          <Row>
                            <label>Proposed owner</label>
                            <Input
                              value={proposedOwner}
                              onChange={(event) => setProposedOwner(event.target.value)}
                              placeholder="0x proposed owner"
                            />
                            {proposedOwner && proposedOwnerValidation.invalid.length > 0 && (
                              <Subtitle>Invalid address: {proposedOwner}</Subtitle>
                            )}
                            <Button
                              onClick={initiate}
                              disabled={
                                !lifeKeyId ||
                                recoveryActive ||
                                isInitiating ||
                                !proposedOwnerValidation.valid.length
                              }
                            >
                              {isInitiating ? 'Submitting…' : 'Initiate recovery'}
                            </Button>
                          </Row>
                        </>
                      )}
                    </ActionCard>

                    <ActionCard>
                      <ActionTitle>Approve recovery</ActionTitle>
                      <Subtitle>
                        Approvals: {approvalsCollected} / {totalBeneficiaries}
                      </Subtitle>
                      {allApprovalsCollected ? (
                        <ActionCopy>
                          All beneficiaries have approved {displayProposedOwner ? truncateAddress(displayProposedOwner) : 'the proposal'}.
                        </ActionCopy>
                      ) : recoveryActive ? (
                        <InlineActions>
                          <Button
                            variant="secondary"
                            onClick={approve}
                            disabled={!lifeKeyId || !recoveryActive || isApproving}
                          >
                            {isApproving ? 'Approving…' : 'Approve recovery'}
                          </Button>
                        </InlineActions>
                      ) : (
                        <ActionCopy>Waiting for recovery request.</ActionCopy>
                      )}
                    </ActionCard>
                  </ActionsGrid>
                ) : (
                  <Subtitle>
                    This LifeKey does not include your address, so no beneficiary actions are available for your wallet.
                  </Subtitle>
                )}
                {actionError && <ErrorText>{actionError}</ErrorText>}
                {lastTxHash && <Subtitle>Latest transaction: {lastTxHash}</Subtitle>}
              </Section>
            </>
          ) : lifeKeyId ? (
            <Section>
              <Title>No LifeKey data</Title>
              <Subtitle>
                We could not load LifeKey #{lifeKeyId.toString()}. Confirm the identifier or ask the owner to share the correct id.
              </Subtitle>
            </Section>
          ) : null}
        </>
      )}
    </>
  );
}

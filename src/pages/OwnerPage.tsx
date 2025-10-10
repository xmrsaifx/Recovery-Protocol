import { useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { useAccount, usePublicClient, useWatchContractEvent, useWriteContract } from 'wagmi';
import { Card } from '../components/Card';
import { ConnectButton } from '../components/ConnectButton';
import { AddressListInput } from '../components/AddressListInput';
import { BeneficiariesListInput } from '../components/BeneficiariesListInput';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { StatusPill } from '../components/StatusPill';
import { RecoveryTimeline } from '../components/RecoveryTimeline';
import { colors, typography, radii } from '../theme/tokens';
import LifeKeyProtocolAbi from '../assets/abi/LifeKeyProtocol.json';
import { validateAddresses } from '../utils/address';
import { lifeKeyContract } from '../config/lifekey';
import { useLifeKeyWrite, useLifeKeyDetails, useLifeKeyCreated, useLifeKeyEvents } from '../hooks/useLifeKeyContract';
import { toSnapshot, zeroSnapshot } from '../utils/lifekey';
import { LifeKeySnapshot } from '../types/LifeKeyTypes';
import { formatUnits, maxUint256, parseEventLogs, parseUnits, zeroAddress } from 'viem';
import type { Abi } from 'viem';
import { tokenCatalog } from '../config/tokenCatalog';

type LifeKeyCreatedArgs = {
  owner?: `0x${string}`;
  lifeKeyId?: bigint;
};

type LifeKeyDeletedArgs = {
  owner?: `0x${string}`;
};

const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    outputs: []
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }]
  }
] as const satisfies Abi;

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

const SuccessBanner = styled(Card)`
  gap: 12px;
  background: linear-gradient(160deg, rgba(34, 197, 94, 0.18) 0%, rgba(15, 23, 42, 0.92) 100%);
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

const ErrorText = styled('p')`
  margin: 0;
  color: ${colors.danger};
`;

const TokenCatalogSection = styled('div')`
  display: grid;
  gap: 16px;
`;

const TokenCatalogHeading = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
`;

const TokenGrid = styled('div')`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const TokenCard = styled(Card)`
  gap: 12px;
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
`;

const TokenMeta = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TokenActions = styled('div')`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
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


const GRAPHQL_ENDPOINT = import.meta.env.VITE_ALCHEMY_GRAPHQL_ENDPOINT || '';

export function OwnerPage() {
  try {
  const { address, isConnected } = useAccount();
  const [lifeKeyId, setLifeKeyId] = useStoredLifeKeyId(address);
  
  const [beneficiariesLive, setBeneficiariesLive] = useState<string[]>([]);
  const [beneficiariesLoading, setBeneficiariesLoading] = useState(false);
  const [beneficiariesError, setBeneficiariesError] = useState<string | null>(null);

  const [assetsLive, setAssetsLive] = useState<string[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setBeneficiariesLoading(true);
    setBeneficiariesError(null);
    const endpoint = 'https://subgraph.satsuma-prod.com/57f4fa800d67/saifs-team--438738/lifeKey-Protocol/api';
    const query = `query GetBeneficiariesAndOwner {
      beneficiariesAddeds { lifeKeyId newBeneficiaries }
      beneficiariesRemoveds { lifeKeyId removedBeneficiaries }
      lifeKeyCreateds { lifeKeyId owner }
    }`;
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    })
      .then(res => res.json())
      .then(data => {
        if (data.errors) throw new Error(data.errors[0]?.message || 'GraphQL error');
        console.log('GraphQL Beneficiaries Response:', data.data);
        
        // Find LifeKey owned by connected address
        const ownedLifeKey = data.data.lifeKeyCreateds?.find((lk: any) => 
          lk.owner.toLowerCase() === address.toLowerCase()
        );
        
        if (ownedLifeKey) {
          const lifeKeyIdFromGraphQL = BigInt(ownedLifeKey.lifeKeyId);
          console.log('Found owned LifeKey ID:', lifeKeyIdFromGraphQL);
          setLifeKeyId(lifeKeyIdFromGraphQL);
          
          // Get added beneficiaries for this specific LifeKey
          const addedBeneficiaries = data.data.beneficiariesAddeds
            ?.filter((b: any) => b.lifeKeyId === ownedLifeKey.lifeKeyId)
            ?.map((b: any) => b.newBeneficiaries.toLowerCase()) || [];
          
          // Get removed beneficiaries for this specific LifeKey
          const removedBeneficiaries = data.data.beneficiariesRemoveds
            ?.filter((r: any) => r.lifeKeyId === ownedLifeKey.lifeKeyId)
            ?.map((r: any) => r.removedBeneficiaries.toLowerCase()) || [];
          
          // Filter out removed beneficiaries from added ones
          const activeBeneficiaries = addedBeneficiaries.filter(
            (beneficiary: string) => !removedBeneficiaries.includes(beneficiary)
          );
          
          setBeneficiariesLive([...new Set(activeBeneficiaries)] as string[]);
        } else {
          console.log('No LifeKey found for address:', address);
          setBeneficiariesLive([]);
        }
        
        setBeneficiariesLoading(false);
      })
      .catch(e => {
        setBeneficiariesError(e.message || 'Error fetching beneficiaries');
        setBeneficiariesLoading(false);
      });
  }, [address, setLifeKeyId]);

  useEffect(() => {
    if (!address || !lifeKeyId) return;
    setAssetsLoading(true);
    setAssetsError(null);
    const endpoint = 'https://subgraph.satsuma-prod.com/57f4fa800d67/saifs-team--438738/lifeKey-Protocol/api';
    const query = `query GetAssets { 
      assetsAddeds { lifeKeyId newAssets }
      assetsRemoveds { lifeKeyId removedAsset }
    }`;
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    })
      .then(res => res.json())
      .then(data => {
        if (data.errors) throw new Error(data.errors[0]?.message || 'GraphQL error');
        console.log('GraphQL Assets Response:', data.data);
        
        // Get added assets for this specific LifeKey
        const addedAssets = data.data.assetsAddeds
          ?.filter((a: any) => a.lifeKeyId === lifeKeyId.toString())
          ?.map((a: any) => a.newAssets.toLowerCase()) || [];
        
        // Get removed assets for this specific LifeKey
        const removedAssets = data.data.assetsRemoveds
          ?.filter((r: any) => r.lifeKeyId === lifeKeyId.toString())
          ?.map((r: any) => r.removedAsset.toLowerCase()) || [];
        
        // Filter out removed assets from added ones
        const activeAssets = addedAssets.filter(
          (asset: string) => !removedAssets.includes(asset)
        );
        
        setAssetsLive([...new Set(activeAssets)] as string[]);
        setAssetsLoading(false);
      })
      .catch(e => {
        setAssetsError(e.message || 'Error fetching assets');
        setAssetsLoading(false);
      });
  }, [address, lifeKeyId]);

  const [createBeneficiaries, setCreateBeneficiaries] = useState<string[]>(['']);
  const [createAssets, setCreateAssets] = useState<string[]>(['']);
  const [allAssetsApproved, setAllAssetsApproved] = useState(false);
  const [updateBeneficiaries, setUpdateBeneficiaries] = useState<string[]>(['']);
  const [removalBeneficiaries, setRemovalBeneficiaries] = useState<string[]>(['']);
  const [assetAdditions, setAssetAdditions] = useState<string[]>(['']);
  const [assetRemovals, setAssetRemovals] = useState<string[]>(['']);
  const [proposedOwner, setProposedOwner] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<{proposedOwner: string | null, isLoading: boolean}>({ proposedOwner: null, isLoading: false });
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState<string>();
  const [creationTxHash, setCreationTxHash] = useState<`0x${string}` | undefined>();
  const [isApprovingAssets, setIsApprovingAssets] = useState(false);
  const [approveError, setApproveError] = useState<string>();
  const [approveMessage, setApproveMessage] = useState<string>();
  const [tokenBalances, setTokenBalances] = useState<Record<string, bigint>>({});

  const decimalsCache = useRef<Record<string, number>>({});

  const publicClient = usePublicClient();
  const { data: created, refetch: refetchCreated } = useLifeKeyCreated(address);
  const { data: detailsData, refetch, isLoading: detailsLoading } = useLifeKeyDetails(lifeKeyId);
  const snapshot: LifeKeySnapshot = useMemo(() => {
    if (!detailsData) return zeroSnapshot();
    return toSnapshot(detailsData as any);
  }, [detailsData]);


  const lifeKeyExists = Boolean(created ?? false) || typeof lifeKeyId === 'bigint';
  const isOwnerMismatch = Boolean(
    address &&
    snapshot.owner &&
    snapshot.owner !== zeroAddress &&
    snapshot.owner.toLowerCase() !== address?.toLowerCase()
  );
  const activeLifeKeyId = lifeKeyId ?? (snapshot.id > 0n ? snapshot.id : undefined);


  const writer = useLifeKeyWrite();
  const { writeContractAsync } = useWriteContract();


  // Handler: Delete LifeKey
  const handleDelete = async () => {
    if (!activeLifeKeyId) return;
    try {
      await writeContractAsync({
        abi: LifeKeyProtocolAbi as any,
        address: lifeKeyContract.address,
        functionName: 'deleteLifeKey',
        args: [activeLifeKeyId],
        chainId: lifeKeyContract.chainId,
        account: address
      } as any);
    } catch (error) {
      console.error('Delete LifeKey failed:', error);
    }
  };

  // Fetch recovery status from GraphQL on mount or when activeLifeKeyId changes
  useEffect(() => {
    const fetchRecoveryStatus = async () => {
      if (!activeLifeKeyId) return;
      
      setRecoveryStatus(prev => ({ ...prev, isLoading: true }));
      
      try {
        const endpoint = 'https://subgraph.satsuma-prod.com/57f4fa800d67/saifs-team--438738/lifeKey-Protocol/api';
        const query = `
          query GetRecoveryStatus($lifeKeyId: String!) {
            recoveryInitiateds(
              where: { lifeKeyId: $lifeKeyId }
              orderBy: blockTimestamp
              orderDirection: desc
              first: 1
            ) {
              lifeKeyId
              proposedOwner
            }
          }
        `;
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query, 
            variables: { lifeKeyId: activeLifeKeyId.toString() } 
          })
        });
        
        const { data } = await response.json();
        const latestRecovery = data?.recoveryInitiateds?.[0];
        
        setRecoveryStatus({
          proposedOwner: latestRecovery?.proposedOwner || null,
          isLoading: false
        });
      } catch (error) {
        console.error('Error fetching recovery status:', error);
        setRecoveryStatus(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    fetchRecoveryStatus();
    
    // No more polling - will only run on mount or when activeLifeKeyId changes
  }, [activeLifeKeyId]);

  // Handler: Cancel Recovery
  const handleCancel = async () => {
    if (!activeLifeKeyId || !recoveryStatus.proposedOwner) return;
    try {
      await writeContractAsync({
        abi: LifeKeyProtocolAbi as any,
        address: lifeKeyContract.address,
        functionName: 'cancelRecoveryRequest',
        args: [activeLifeKeyId],
        chainId: lifeKeyContract.chainId,
        account: address
      } as any);
      
      // Clear the recovery status after successful cancellation
      setRecoveryStatus({ proposedOwner: null, isLoading: false });
    } catch (error) {
      console.error('Cancel recovery failed:', error);
    }
  };

  // Handler: Add Assets
  const handleAddAssets = async () => {
    if (!activeLifeKeyId || !assetAdditions.length) return;
    try {
      await writeContractAsync({
        abi: LifeKeyProtocolAbi as any,
        address: lifeKeyContract.address,
        functionName: 'addAssets',
        args: [activeLifeKeyId, assetAdditions],
        chainId: lifeKeyContract.chainId,
        account: address
      } as any);
    } catch (error) {
      console.error('Add assets failed:', error);
    }
  };

  // Always show the full catalog for balance fetch; filter for UI below
  const chainTokens = useMemo(
    () => tokenCatalog[lifeKeyContract.chainId] ?? [],
    [lifeKeyContract.chainId]
  );
  // Only show tokens with balance > 0 in the UI
  const visibleTokens = useMemo(
    () => chainTokens.filter(token => {
      const bal = tokenBalances[token.address.toLowerCase()];
      return typeof bal === 'bigint' && bal > 0n;
    }),
    [chainTokens, tokenBalances]
  );
  const selectedAssetSet = useMemo(
    () => new Set(createAssets.filter(Boolean).map((entry) => entry.toLowerCase())),
    [createAssets]
  );

  useLifeKeyEvents(() => {
    if (lifeKeyId) {
      refetch();
    }
  });

  useWatchContractEvent({
    ...lifeKeyContract,
    eventName: 'LifeKeyCreated',
    onLogs: (logs) => {
      for (const log of logs as Array<{ args?: LifeKeyCreatedArgs }>) {
        const args = log.args;
        if (args && args.owner && address && args.owner.toLowerCase() === address.toLowerCase() && typeof args.lifeKeyId === 'bigint') {
          setLifeKeyId(args.lifeKeyId);
          refetch();
        }
      }
    }
  });

  useWatchContractEvent({
    ...lifeKeyContract,
    eventName: 'LifeKeyDeleted',
    onLogs: (logs) => {
      for (const log of logs as Array<{ args?: LifeKeyDeletedArgs }>) {
        const args = log.args;
        if (address && args && args.owner && args.owner.toLowerCase() === address.toLowerCase()) {
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
  const assetRemovalValidation = useMemo(() => validateAddresses(assetRemovals), [assetRemovals]);
  const proposedOwnerValidation = useMemo(
    () => validateAddresses(proposedOwner ? [proposedOwner] : []),
    [proposedOwner]
  );

  useEffect(() => {
    if (!snapshot.beneficiaries?.length) return;
    setUpdateBeneficiaries(snapshot.beneficiaries);
    setRemovalBeneficiaries(snapshot.beneficiaries);
  }, [snapshot.beneficiaries?.join('|') || '']);

  useEffect(() => {
    if (!snapshot.assets?.length) return;
    setAssetAdditions(['']);
  }, [snapshot.assets?.join('|') || '']);

  useEffect(() => {
    if (!address || !publicClient || !chainTokens.length) {
      setTokenBalances({});
      return;
    }
    let cancelled = false;
    (async () => {
      const balances: Record<string, bigint> = {};
      for (const token of chainTokens) {
        try {
          const balance = await (publicClient as any).readContract({
            address: token.address,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address]
          });
          if (balance > 0n) {
            balances[token.address.toLowerCase()] = balance;
          }
        } catch {
          // ignore token fetch errors
        }
      }
      if (!cancelled) {
        setTokenBalances(balances);
      }
    })();
    // Only refetch balances if address or catalog changes
    // Do NOT depend on tokenBalances or visibleTokens
    // This prevents infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, publicClient, lifeKeyContract.chainId]);

  const handleCreate = async () => {
    if (!creationValidation.valid.length || isCreating) return;
    setCreationError(undefined);
    setCreationTxHash(undefined);
    try {
      setIsCreating(true);
      const txHash = await writer.createLifeKey(creationValidation.valid, creationAssetValidation.valid);
      setCreationTxHash(txHash);
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        const logs = parseEventLogs({
          abi: lifeKeyContract.abi,
          eventName: 'LifeKeyCreated',
          logs: receipt.logs
        }) as Array<{ args?: LifeKeyCreatedArgs }>;
        const matchingLog = logs.find((log) => {
          const owner = log.args?.owner;
          return owner && address && owner.toLowerCase() === address.toLowerCase();
        });
        const newId = matchingLog?.args?.lifeKeyId;
        if (typeof newId === 'bigint') {
          setLifeKeyId(newId);
        }
      }
      await refetchCreated();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create LifeKey';
      setCreationError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddAssetFromCatalog = (addressToAdd: `0x${string}`) => {
    const lower = addressToAdd.toLowerCase();
    if (selectedAssetSet.has(lower)) return;
    setCreateAssets((prev) => {
      const next = [...prev];
      const insertIndex = next.length && next[next.length - 1] === '' ? next.length - 1 : next.length;
      next.splice(insertIndex, 0, addressToAdd);
      if (next[next.length - 1] !== '') {
        next.push('');
      }
      return next;
    });
  };

  const handleApproveAssets = async (
    mode: 'standard' | 'unlimited',
    overrideAddresses?: string[]
  ) => {
    const targets = overrideAddresses ?? creationAssetValidation.valid;
    if (!targets.length || isApprovingAssets) return;
    if (!writeContractAsync) return;
    setApproveError(undefined);
    setApproveMessage(undefined);
    try {
      setIsApprovingAssets(true);
      for (const asset of targets) {
        const lower = asset.toLowerCase();
        const catalogToken = chainTokens.find((token) => token.address.toLowerCase() === lower);
        let decimals = catalogToken?.decimals;
        if (decimals === undefined) {
          const cached = decimalsCache.current[lower];
          if (cached !== undefined) {
            decimals = cached;
          } else {
            try {
              const onChainDecimals = publicClient
                ? await (publicClient as any).readContract({
                  address: asset as `0x${string}`,
                  abi: ERC20_ABI,
                  functionName: 'decimals'
                })
                : undefined;
              if (typeof onChainDecimals === 'number') {
                decimals = onChainDecimals;
                decimalsCache.current[lower] = onChainDecimals;
              }
            } catch {
              decimals = 18;
            }
          }
        }
        const resolvedDecimals = decimals ?? 18;
        const approvalAmount = mode === 'unlimited'
          ? maxUint256
          : parseUnits('1000', resolvedDecimals);
        await writeContractAsync({
          address: asset as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [lifeKeyContract.address, approvalAmount],
          chainId: lifeKeyContract.chainId,
          account: address
        } as any);
      }
      const summary = `${targets.length} asset${targets.length === 1 ? '' : 's'}`;
      setApproveMessage(
        mode === 'unlimited'
          ? `Submitted unlimited approvals for ${summary}.`
          : `Submitted standard approvals (1,000 units) for ${summary}.`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve assets';
      setApproveError(message);
    } finally {
      setIsApprovingAssets(false);
    }
  };

  // Handler: Update Beneficiaries
  const handleUpdate = async () => {
    if (!activeLifeKeyId || !updateValidation.valid.length) return;
    try {
      await writeContractAsync({
        abi: LifeKeyProtocolAbi as any,
        address: lifeKeyContract.address,
        functionName: 'addBeneficiaries',
        args: [activeLifeKeyId, updateValidation.valid],
        chainId: lifeKeyContract.chainId,
        account: address
      } as any);
    } catch (error) {
      console.error('Update beneficiaries failed:', error);
    }
  };

  // Handler: Remove Beneficiaries
  const handleRemove = async () => {
    if (!activeLifeKeyId || !removalValidation.valid.length) return;
    await writer.removeBeneficiaries(activeLifeKeyId, removalValidation.valid);
  };

  // Handler: Remove Assets
  const handleRemoveAssets = async () => {
    if (!activeLifeKeyId || !assetRemovalValidation.valid.length) return;
    try {
      await writeContractAsync({
        abi: LifeKeyProtocolAbi as any,
        address: lifeKeyContract.address,
        functionName: 'removeAssets',
        args: [activeLifeKeyId, assetRemovalValidation.valid],
        chainId: lifeKeyContract.chainId,
        account: address
      } as any);
    } catch (error) {
      console.error('Remove assets failed:', error);
    }
  };


  // Handler: Initiate Recovery
const handleInitiate = async () => {
    if (!activeLifeKeyId || !proposedOwnerValidation.valid.length) return;
    await writer.initiateRecovery(activeLifeKeyId, proposedOwnerValidation.valid[0]);
  };

  return (
    <>
      {!isConnected ? (
        <Section>
          <Title>Connect wallet</Title>
          <Subtitle>Authenticate with the owner wallet to manage your LifeKey configuration.</Subtitle>
          <ConnectButton />
        </Section>
      ) : !lifeKeyExists ? (
        <Section>
          <Title>Create LifeKey</Title>
          <Subtitle>Define beneficiaries and optional ERC20 assets to guard.</Subtitle>
          <FormRow>
            <label>Beneficiaries</label>
            <BeneficiariesListInput
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
              onAllApprovedChange={setAllAssetsApproved}
            />
            {creationAssetValidation.invalid.length > 0 && (
              <Subtitle>Invalid addresses: {creationAssetValidation.invalid.join(', ')}</Subtitle>
            )}

            {approveError && <ErrorText>{approveError}</ErrorText>}
            {approveMessage && <Subtitle>{approveMessage}</Subtitle>}
          </FormRow>
          {visibleTokens.length > 0 && (
            <TokenCatalogSection>
              <TokenCatalogHeading>
                <Subtitle>Token catalog</Subtitle>
                {address && (
                  <Subtitle>
                    Wallet balances for {address.slice(0, 6)}…{address.slice(-4)}
                  </Subtitle>
                )}
              </TokenCatalogHeading>
              <TokenGrid>
                {visibleTokens.map((token) => {
                  const lower = token.address.toLowerCase();
                  const balance = tokenBalances[lower];
                  const isSelected = selectedAssetSet.has(lower);
                  const formattedBalance = balance !== undefined
                    ? Number.parseFloat(formatUnits(balance, token.decimals)).toLocaleString(undefined, {
                      maximumFractionDigits: 4
                    })
                    : undefined;
                  return (
                    <TokenCard key={token.address}>
                      <TokenMeta>
                        <strong>{token.symbol}</strong>
                        <span style={{ color: colors.textMuted, fontSize: '14px' }}>{token.name}</span>
                        {formattedBalance && (
                          <span style={{ color: colors.textMuted, fontSize: '13px' }}>
                            Balance: {formattedBalance}
                          </span>
                        )}
                      </TokenMeta>
                      <TokenActions>
                        <Button
                          variant="secondary"
                          disabled={isSelected}
                          onClick={() => handleAddAssetFromCatalog(token.address)}
                        >
                          {isSelected ? 'Added' : 'Add to list'}
                        </Button>

                      </TokenActions>
                    </TokenCard>
                  );
                })}
              </TokenGrid>
            </TokenCatalogSection>
          )}
          <Button
            onClick={handleCreate}
            disabled={!creationValidation.valid.length || isCreating || !allAssetsApproved}
          >
            {isCreating ? 'Creating LifeKey…' : 'Create LifeKey'}
          </Button>
          {creationError && <ErrorText>{creationError}</ErrorText>}
          {creationTxHash && (
            <Subtitle>Transaction submitted: {creationTxHash}</Subtitle>
          )}
        </Section>
      ) : (
        <>
          {creationTxHash && (
            <SuccessBanner>
              <Title>LifeKey created</Title>
              <Subtitle>Your LifeKey is now live. Track the transaction hash below.</Subtitle>
              <Subtitle>Tx hash: {creationTxHash}</Subtitle>
            </SuccessBanner>
          )}

          <Section>
            <Title>Current LifeKey</Title>
            <Subtitle>
              {lifeKeyId ? `ID #${lifeKeyId.toString()}` : snapshot.id > 0n ? `ID #${snapshot.id.toString()}` : 'Syncing on-chain data…'}
            </Subtitle>
            {detailsLoading ? (
              <Subtitle>Loading LifeKey details…</Subtitle>
            ) : (
              <Grid>
                <Card>
                  <Title>Beneficiaries</Title>
                  <Subtitle>{beneficiariesLoading ? 'Loading…' : beneficiariesError ? `Error: ${beneficiariesError}` : beneficiariesLive.length ? beneficiariesLive.join(', ') : 'None configured'}</Subtitle>
                </Card>
                <Card>
                  <Title>Tracked Assets</Title>
                  <Subtitle>{assetsLoading ? 'Loading…' : assetsError ? `Error: ${assetsError}` : assetsLive.length ? assetsLive.join(', ') : 'Not configured'}</Subtitle>
                </Card>
                {snapshot.id > 0n && (
                  <Card>
                    <Title>Status</Title>
                    {snapshot.proposalActive ? (
                      <StatusPill tone="warning">Recovery Active</StatusPill>
                    ) : (
                      <StatusPill tone="info">Idle</StatusPill>
                    )}
                    <RecoveryTimeline
                      approvals={snapshot.approvals}
                      totalBeneficiaries={snapshot.beneficiaries.length}
                      proposalActive={snapshot.proposalActive}
                      newOwnerReady={snapshot.newOwner !== zeroAddress}
                    />
                  </Card>
                )}
              </Grid>
            )}
            <ActionsGrid>

                <ActionCard>
                  <ActionTitle>Beneficiaries</ActionTitle>
                  <ActionCopy>Update the list or remove existing addresses.</ActionCopy>
                  <FormRow>
                    <label>Update List</label>
                    <BeneficiariesListInput values={updateBeneficiaries} onChange={setUpdateBeneficiaries} placeholder="0x..." />
                    {updateValidation.invalid.length > 0 && (
                      <Subtitle>Invalid addresses: {updateValidation.invalid.join(', ')}</Subtitle>
                    )}
                    <Button
                      variant="secondary"
                      onClick={handleUpdate}
                      disabled={!activeLifeKeyId || !updateValidation.valid.length}
                    >
                      Update list
                    </Button>
                  </FormRow>
                  <FormRow>
                    <label>Remove Beneficiaries</label>
                    <BeneficiariesListInput values={removalBeneficiaries} onChange={setRemovalBeneficiaries} placeholder="0x..." />
                    {removalValidation.invalid.length > 0 && (
                      <Subtitle>Invalid addresses: {removalValidation.invalid.join(', ')}</Subtitle>
                    )}
                    <Button
                      variant="secondary"
                      onClick={handleRemove}
                      disabled={!activeLifeKeyId || !removalValidation.valid.length}
                    >
                      Remove selected
                    </Button>
                  </FormRow>
                </ActionCard>


                <ActionCard>
                  <ActionTitle>Tracked assets</ActionTitle>
                  <ActionCopy>Add or remove ERC20 contracts to guard as part of the LifeKey.</ActionCopy>
                  <FormRow>
                    <label>Add Assets</label>
                    <AddressListInput values={assetAdditions} onChange={setAssetAdditions} placeholder="ERC20 contract" />
                    {additionValidation.invalid.length > 0 && (
                      <Subtitle>Invalid addresses: {additionValidation.invalid.join(', ')}</Subtitle>
                    )}
                    <Button
                      variant="secondary"
                      onClick={handleAddAssets}
                      disabled={!activeLifeKeyId || !additionValidation.valid.length}
                    >
                      Add assets
                    </Button>
                  </FormRow>
                  <FormRow>
                    <label>Remove Assets</label>
                    <BeneficiariesListInput values={assetRemovals} onChange={setAssetRemovals} placeholder="ERC20 contract" />
                    {assetRemovalValidation.invalid.length > 0 && (
                      <Subtitle>Invalid addresses: {assetRemovalValidation.invalid.join(', ')}</Subtitle>
                    )}
                    <Button
                      variant="secondary"
                      onClick={handleRemoveAssets}
                      disabled={!activeLifeKeyId || !assetRemovalValidation.valid.length}
                    >
                      Remove selected
                    </Button>
                  </FormRow>
                </ActionCard>

                <ActionCard>
                  <ActionTitle>Danger Zone</ActionTitle>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: colors.card,
                    borderRadius: radii.md,
                    border: `1px solid ${colors.border}20`,
                    marginBottom: '20px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: colors.danger,
                        flexShrink: 0
                      }} />
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: colors.text
                      }}>
                        Delete LifeKey
                      </span>
                    </div>
                    
                    <div style={{
                      backgroundColor: colors.surface,
                      borderRadius: radii.sm,
                      padding: '12px',
                      border: `1px solid ${colors.border}20`,
                      fontSize: '0.8125rem',
                      lineHeight: '1.5'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: '2px' }}>
                          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke={colors.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 8V12" stroke={colors.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 16H12.01" stroke={colors.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div>
                          <div style={{ fontWeight: 500, color: colors.text, marginBottom: '4px' }}>This action cannot be undone</div>
                          <div style={{ color: colors.textMuted }}>This will permanently delete your LifeKey configuration and all associated data.</div>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="secondary"
                      onClick={handleDelete} 
                      disabled={!activeLifeKeyId}
                      style={{
                        width: '100%',
                        marginTop: '4px',
                        borderColor: `${colors.danger}80`,
                        color: colors.danger,
                        backgroundColor: `${colors.danger}10`,
                        ...(!activeLifeKeyId ? {} : {
                          '&:hover': {
                            backgroundColor: `${colors.danger}15`,
                            borderColor: `${colors.danger}60`
                          }
                        })
                      } as React.CSSProperties}
                    >
                      Delete LifeKey
                    </Button>
                  </div>

                  <ActionTitle>Cancel recovery</ActionTitle>
                  <ActionCopy>Cancel an active recovery.</ActionCopy>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: colors.card,
                    borderRadius: radii.md,
                    border: `1px solid ${colors.border}20`
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: recoveryStatus.proposedOwner ? colors.danger : colors.textMuted,
                        flexShrink: 0
                      }} />
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: recoveryStatus.proposedOwner ? colors.text : colors.textMuted
                      }}>
                        {recoveryStatus.isLoading 
                          ? 'Loading Recovery Status...' 
                          : recoveryStatus.proposedOwner 
                            ? 'Recovery in Progress' 
                            : 'No Active Recovery'}
                      </span>
                    </div>
                    
                    {recoveryStatus.proposedOwner && (
                      <div style={{
                        backgroundColor: colors.surface,
                        borderRadius: radii.sm,
                        padding: '12px',
                        border: `1px solid ${colors.border}20`,
                        fontSize: '0.8125rem',
                        lineHeight: '1.5'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start',
                          gap: '8px',
                          marginBottom: '8px'
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: '2px' }}>
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke={colors.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 8V12" stroke={colors.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 16H12.01" stroke={colors.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <div>
                            <div style={{ fontWeight: 500, color: colors.text, marginBottom: '4px' }}>Recovery Initiated To </div>
                            <div style={{ color: colors.textMuted, fontFamily: 'monospace', wordBreak: 'break-word' }}>
                              {recoveryStatus.proposedOwner}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      variant="secondary"
                      onClick={handleCancel} 
                      disabled={!activeLifeKeyId || !recoveryStatus.proposedOwner || recoveryStatus.isLoading}
                      style={{
                        width: '100%',
                        marginTop: '4px',
                        borderColor: recoveryStatus.proposedOwner ? `${colors.danger}80` : `${colors.border}40`,
                        color: recoveryStatus.proposedOwner ? colors.danger : colors.textMuted,
                        backgroundColor: recoveryStatus.proposedOwner ? `${colors.danger}10` : colors.surface,
                        ...(!recoveryStatus.isLoading && recoveryStatus.proposedOwner ? {
                          ':hover': {
                            backgroundColor: `${colors.danger}15`,
                            borderColor: `${colors.danger}60`
                          }
                        } : {})
                      }}
                    >
                      {recoveryStatus.isLoading 
                        ? 'Processing...' 
                        : 'Cancel Recovery'}
                    </Button>
                  </div>
                  </ActionCard>
              </ActionsGrid>
          </Section>
        </>
      )}
    </>
  );
  } catch (error) {
    console.error('OwnerPage Error:', error);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>Error in OwnerPage</h2>
        <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
        <pre>{error instanceof Error ? error.stack : ''}</pre>
      </div>
    );
  }
}



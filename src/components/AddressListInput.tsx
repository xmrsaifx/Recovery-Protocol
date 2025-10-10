import styled from '@emotion/styled';
import { useCallback, useEffect, useState } from 'react';
import { useWriteContract, useAccount, usePublicClient } from 'wagmi';
import { colors, radii, typography } from '../theme/tokens';
import { lifeKeyContract } from '../config/lifekey';
import { Button } from './Button';

const Wrapper = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Row = styled('div')`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 8px;
`;

const Field = styled('input')`
  width: 100%;
  height: 44px;
  border-radius: ${radii.md};
  border: 1px solid rgba(203, 213, 245, 0.3);
  background: rgba(15, 23, 42, 0.6);
  color: ${colors.text};
  font-size: ${typography.body.size};
  padding: 0 16px;
  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.25);
  }
  &::placeholder {
    color: ${colors.textMuted};
  }
`;

const RemoveButton = styled(Button)`
  padding: 0 10px;
  min-width: 44px;
`;

const ApproveButton = styled(Button)`
  padding: 0 10px;
  white-space: nowrap;
`;

const StatusText = styled('span') <{ status: 'pending' | 'success' | 'error' }>`
  font-size: 12px;
  color: ${props =>
    props.status === 'success' ? '#10b981' :
      props.status === 'error' ? '#ef4444' :
        '#fbbf24'
  };
`;

// ERC20 ABI for approve function
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  }
] as const;

const LIFEKEY_PROXY = import.meta.env.VITE_LIFEKEY_PROXY as `0x${string}`;
const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

interface AddressListInputProps {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  label?: string;
  onAllApprovedChange?: (allApproved: boolean) => void;
}

export function AddressListInput({ values, onChange, placeholder, onAllApprovedChange }: AddressListInputProps) {
  const [pendingApprovals, setPendingApprovals] = useState<Record<number, string>>({});
  const { writeContractAsync } = useWriteContract();
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();
  // Track allowance for each asset (by index)
  const [allowances, setAllowances] = useState<Record<number, boolean>>({});

  const handleChange = useCallback(
    (index: number, value: string) => {
      const next = [...values];
      next[index] = value;
      onChange(next);
    },
    [onChange, values]
  );

  const addField = useCallback(() => {
    onChange([...values, '']);
  }, [onChange, values]);

  const removeField = useCallback(
    (index: number) => {
      const next = values.filter((_, idx) => idx !== index);
      onChange(next);
      // Clean up pending status
      setPendingApprovals(prev => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
    },
    [onChange, values]
  );

  // Check allowance for each asset
  useEffect(() => {
    let cancelled = false;
    async function checkAllAllowances() {
      if (!userAddress || !publicClient) return;
      const result: Record<number, boolean> = {};
      await Promise.all(values.map(async (asset, idx) => {
        if (!/^0x[a-fA-F0-9]{40}$/.test(asset)) return;
        try {
          const allowance = await publicClient.readContract({
            address: asset as `0x${string}`,
            abi: [
              {
                name: 'allowance',
                type: 'function',
                stateMutability: 'view',
                inputs: [
                  { name: 'owner', type: 'address' },
                  { name: 'spender', type: 'address' }
                ],
                outputs: [{ type: 'uint256' }]
              }
            ],
            functionName: 'allowance',
            args: [userAddress, LIFEKEY_PROXY],
            chainId: lifeKeyContract.chainId,
          } as any);
          // Consider approved if allowance is very high (not zero)
          result[idx] = allowance && typeof allowance === 'bigint' && allowance > MAX_UINT256 / 2n;
        } catch {
          result[idx] = false;
        }
      }));
      if (!cancelled) setAllowances(result);
      if (onAllApprovedChange) {
        const allApproved = values.every((_, idx) => result[idx]);
        onAllApprovedChange(allApproved);
      }
    }
    checkAllAllowances();
    return () => { cancelled = true; };
  }, [values, userAddress, publicClient, onAllApprovedChange]);

  const approveAsset = useCallback(
    async (address: string, index: number) => {
      try {
        // Check if wallet is connected
        if (!userAddress) {
          alert('Please connect your wallet first');
          return;
        }

        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
          alert('Invalid Ethereum address format');
          return;
        }

        setPendingApprovals(prev => ({ ...prev, [index]: 'pending' }));
        setAllowances(prev => ({ ...prev, [index]: false })); // optimistic reset
        const txHash = await writeContractAsync({
          address: address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [LIFEKEY_PROXY, MAX_UINT256],
          account: userAddress,
          chainId: lifeKeyContract.chainId,
        } as any);
        // Mark success on submit; optionally you can wait for confirmation externally if desired
        if (txHash) {
          // Wait for allowance to update
          setTimeout(() => {
            if (publicClient && userAddress) {
              publicClient.readContract({
                address: address as `0x${string}`,
                abi: [
                  {
                    name: 'allowance',
                    type: 'function',
                    stateMutability: 'view',
                    inputs: [
                      { name: 'owner', type: 'address' },
                      { name: 'spender', type: 'address' }
                    ],
                    outputs: [{ type: 'uint256' }]
                  }
                ],
                functionName: 'allowance',
                args: [userAddress, LIFEKEY_PROXY],
                chainId: lifeKeyContract.chainId,
              } as any).then((allowance) => {
                if (allowance && typeof allowance === 'bigint' && allowance > MAX_UINT256 / 2n) {
                  setAllowances(prev => ({ ...prev, [index]: true }));
                }
              });
            }
          }, 3000);
          setPendingApprovals(prev => ({ ...prev, [index]: 'success' }));
          setTimeout(() => {
            setPendingApprovals(prev => {
              const updated = { ...prev };
              delete updated[index];
              return updated;
            });
          }, 3000);
        }
      } catch (error) {
        console.error('Error approving asset:', error);
        setPendingApprovals(prev => ({ ...prev, [index]: 'error' }));
        setTimeout(() => {
          setPendingApprovals(prev => {
            const updated = { ...prev };
            delete updated[index];
            return updated;
          });
        }, 3000);
      }
    },
    [writeContractAsync, userAddress]
  );

  return (
    <Wrapper>
      {values.map((value, idx) => (
        <Row key={idx}>
          <Field
            value={value}
            onChange={(event) => handleChange(idx, event.target.value)}
            placeholder={placeholder}
            spellCheck={false}
          />
          <RemoveButton
            type="button"
            variant="secondary"
            disabled={values.length <= 1}
            onClick={() => removeField(idx)}
          >
            –
          </RemoveButton>
          <ApproveButton
            type="button"
            variant="secondary"
            disabled={!value || !!pendingApprovals[idx] || allowances[idx]}
            onClick={() => approveAsset(value, idx)}
          >
            {allowances[idx]
              ? '✓ Approved'
              : pendingApprovals[idx] === 'pending'
                ? 'Approving...'
                : pendingApprovals[idx] === 'success'
                  ? '✓ Approved'
                  : pendingApprovals[idx] === 'error'
                    ? '✗ Failed'
                    : 'Approve asset'
            }
          </ApproveButton>
        </Row>
      ))}
      <Button type="button" variant="secondary" onClick={addField}>
        Add address
      </Button>
    </Wrapper>
  );
}
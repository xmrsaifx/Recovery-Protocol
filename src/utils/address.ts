import { isAddress } from 'viem';

export function normalizeAddress(address: string): string {
  return address.trim();
}

export function validateAddresses(addresses: string[]): { valid: string[]; invalid: string[] } {
  const normalized = addresses.map(normalizeAddress).filter(Boolean);
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const entry of normalized) {
    if (!isAddress(entry)) {
      invalid.push(entry);
      continue;
    }
    const lower = entry.toLowerCase();
    if (seen.has(lower)) {
      continue;
    }
    seen.add(lower);
    valid.push(entry);
  }

  return { valid, invalid };
}

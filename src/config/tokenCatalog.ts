export interface TokenInfo {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
}

// Placeholder catalog: adjust to match the networks you deploy to.
// Base Sepolia sample addresses are provided for convenience.
export const tokenCatalog: Record<number, TokenInfo[]> = {
  84532: [
    {
      address: '0x4200000000000000000000000000000000000006',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18
    },
    {
      address: '0xf175520c52418dfe19c8098071a252da48cd1c19',
      symbol: 'USDC.e',
      name: 'USD Coin (Bridged)',
      decimals: 6
    },
    {
      address: '0x67e51f46e8e14d4e4cab9d3c4e4c435c77a134f9',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18
    }
  ],
  11155111: [] // Sepolia placeholder
};

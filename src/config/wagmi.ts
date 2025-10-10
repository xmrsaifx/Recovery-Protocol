import { createConfig, http } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { defaultChainId, rpcUrl } from './lifekey';
import { sepolia, mainnet, polygon, arbitrum, baseSepolia } from 'wagmi/chains';
import type { Chain } from 'wagmi/chains';

const chainMap = new Map<number, Chain>([
  [sepolia.id, sepolia],
  [mainnet.id, mainnet],
  [polygon.id, polygon],
  [arbitrum.id, arbitrum],
  [baseSepolia.id, baseSepolia]
]);

const activeChain = chainMap.get(defaultChainId);

if (!activeChain) {
  throw new Error(`Unsupported chain id ${defaultChainId}. Update chainMap in lifekey config.`);
}

export const wagmiConfig = createConfig({
  chains: [activeChain],
  transports: {
    [activeChain.id]: http(rpcUrl || activeChain.rpcUrls.default.http[0])
  },
  connectors: [
    injected({ shimDisconnect: true }),
    walletConnect({ projectId: 'lifekey-placeholder' })
  ]
});

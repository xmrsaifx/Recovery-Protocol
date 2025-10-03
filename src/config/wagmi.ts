import { createConfig, http } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { defaultChainId, rpcUrl } from './lifekey';
import { sepolia, mainnet, polygon, arbitrum } from 'wagmi/chains';

const chainMap = new Map<number, typeof sepolia>([
  [sepolia.id, sepolia],
  [mainnet.id, mainnet],
  [polygon.id, polygon],
  [arbitrum.id, arbitrum]
]);

const activeChain = chainMap.get(defaultChainId) ?? sepolia;

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

import ABI from '../assets/abi/LifeKeyProtocol.json';

export const defaultChainId = Number(import.meta.env.VITE_CHAIN_ID ?? '11155111');
export const rpcUrl = import.meta.env.VITE_RPC_URL ?? '';

export const lifeKeyContract = {
  address: (import.meta.env.VITE_LIFEKEY_PROXY as `0x${string}`) ?? '0x0000000000000000000000000000000000000000',
  abi: ABI,
  chainId: defaultChainId
};

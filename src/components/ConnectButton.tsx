import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from './Button';

export function ConnectButton() {
  const { isConnected, address } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <Button variant="secondary" onClick={() => disconnect()}>
        Disconnect {address && `${address.slice(0, 6)}…${address.slice(-4)}`}
      </Button>
    );
  }

  const injected = connectors.find((connector) => connector.id === 'injected') ?? connectors[0];

  return (
    <Button
      onClick={() => injected && connect({ connector: injected })}
      disabled={isConnecting || !injected}
    >
      {isConnecting ? 'Connecting…' : injected ? 'Connect Wallet' : 'No wallet available'}
    </Button>
  );
}

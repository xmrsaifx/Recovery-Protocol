
import { gql, useQuery } from 'urql';
import { useAccount } from 'wagmi';

const LIFEKEY_QUERY = gql`
  query LifeKeyData($owner: Bytes!) {
    lifeKeyCreateds(where: { owner: $owner }) {
      lifeKeyId
      owner
      blockTimestamp
      transactionHash
    }
    beneficiariesAddeds(where: { owner: $owner }) {
      lifeKeyId
      newBeneficiaries
      blockTimestamp
      transactionHash
    }
    assetsAddeds(where: { owner: $owner }) {
      lifeKeyId
      newAssets
      blockTimestamp
      transactionHash
    }
  }
`;

export function LifeKeyGraphSection() {
  const { address } = useAccount();
  const [result] = useQuery({
    query: LIFEKEY_QUERY,
    variables: { owner: address?.toLowerCase() },
    pause: !address,
  });

  if (!address) return <div>Please connect your wallet.</div>;
  if (result.fetching) return <div>Loading LifeKey data…</div>;
  if (result.error) return <div>Error: {result.error.message}</div>;

  const created = result.data?.lifeKeyCreateds?.[0];
  const beneficiaries = result.data?.beneficiariesAddeds || [];
  const assets = result.data?.assetsAddeds || [];

  return (
    <div style={{ marginTop: 24 }}>
      <h3>LifeKey (from Graph)</h3>
      {created ? (
        <div>
          <div><b>LifeKey ID:</b> {created.lifeKeyId}</div>
          <div><b>Owner:</b> {created.owner}</div>
          <div><b>Created at:</b> {new Date(Number(created.blockTimestamp) * 1000).toLocaleString()}</div>
        </div>
      ) : (
        <div>No LifeKey found for this address.</div>
      )}
      <div style={{ marginTop: 16 }}>
        <b>Beneficiaries Added:</b>
        <ul>
          {beneficiaries.map((b: any) => (
            <li key={b.transactionHash}>{b.newBeneficiaries}</li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 16 }}>
        <b>Assets Added:</b>
        <ul>
          {assets.map((a: any) => (
            <li key={a.transactionHash}>{a.newAssets}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

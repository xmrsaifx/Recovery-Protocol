import { useEffect, useState } from 'react';

export function useGraphQLBeneficiariesAndAssets(lifeKeyId: string | number, endpoint: string) {
  const [beneficiaries, setBeneficiaries] = useState<string[]>([]);
  const [assets, setAssets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lifeKeyId) return;
    setLoading(true);
    setError(null);
    const query = `
      query BeneficiariesAndAssets($lifeKeyId: BigInt!) {
        beneficiariesAddeds(where: { lifeKeyId: $lifeKeyId }) {
          newBeneficiaries
        }
        beneficiariesRemoveds(where: { lifeKeyId: $lifeKeyId }) {
          removedBeneficiaries
        }
        assetsAddeds(where: { lifeKeyId: $lifeKeyId }) {
          newAssets
        }
        assetsRemoveds(where: { lifeKeyId: $lifeKeyId }) {
          removedAsset
        }
      }
    `;
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { lifeKeyId: lifeKeyId.toString() } })
    })
      .then(res => res.json())
      .then(data => {
        // Beneficiaries
        const added = ((data.data.beneficiariesAddeds || []).map((b: any) => b.newBeneficiaries.toLowerCase()) as string[]);
        const removed = ((data.data.beneficiariesRemoveds || []).map((b: any) => b.removedBeneficiaries.toLowerCase()) as string[]);
        const currentBeneficiaries = added.filter((b: string) => !removed.includes(b));
        setBeneficiaries([...new Set(currentBeneficiaries)] as string[]);
        // Assets
        const assetsAdded = ((data.data.assetsAddeds || []).map((a: any) => a.newAssets.toLowerCase()) as string[]);
        const assetsRemoved = ((data.data.assetsRemoveds || []).map((a: any) => a.removedAsset.toLowerCase()) as string[]);
        const currentAssets = assetsAdded.filter((a: string) => !assetsRemoved.includes(a));
        setAssets([...new Set(currentAssets)] as string[]);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message || 'Error fetching data');
        setLoading(false);
      });
  }, [lifeKeyId, endpoint]);

  return { beneficiaries, assets, loading, error };
}
